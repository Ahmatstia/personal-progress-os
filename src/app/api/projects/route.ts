import { NextResponse } from "next/server";
import { createProjectSchema, projectStatusEnum } from "@/schemas/project.schema";
import { createProject, getProjects, ProjectServiceError } from "@/services/project.service";
import { requireCurrentUser, authErrorResponse, AuthorizationError } from "@/lib/auth";
import type { ProjectStatus } from "@/generated/prisma/client";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const goalId = searchParams.get("goalId") || undefined;
    const areaId = searchParams.get("areaId") || undefined;

    const parsedStatus = statusParam ? projectStatusEnum.safeParse(statusParam) : null;
    const status = parsedStatus?.success ? (parsedStatus.data as ProjectStatus) : undefined;

    const data = await getProjects(user.id, { status, goalId, areaId });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    return NextResponse.json({ success: false, error: { message: "Gagal mengambil data project.", code: "INTERNAL_ERROR" } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = await request.json();

    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: "Data project tidak valid.", code: "INVALID_INPUT", details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const data = await createProject(parsed.data, user.id);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    const isServiceError = error instanceof ProjectServiceError;
    const status = isServiceError && (error.code === "GOAL_NOT_FOUND" || error.code === "AREA_NOT_FOUND") ? 404 : isServiceError ? 400 : 500;
    return NextResponse.json(
      { success: false, error: { message: isServiceError ? error.message : "Gagal membuat project.", code: isServiceError ? error.code : "INTERNAL_ERROR" } },
      { status }
    );
  }
}
