import { NextResponse } from "next/server";
import { createMilestoneSchema } from "@/schemas/milestone.schema";
import { createMilestone, getMilestonesByProject, MilestoneServiceError } from "@/services/milestone.service";
import { requireCurrentUser, authErrorResponse, AuthorizationError } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: { message: "Query parameter projectId diperlukan.", code: "MISSING_PROJECT_ID" } },
        { status: 400 }
      );
    }

    const data = await getMilestonesByProject(projectId, user.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    const isServiceError = error instanceof MilestoneServiceError;
    const status = isServiceError && error.code === "PROJECT_NOT_FOUND" ? 404 : 500;
    return NextResponse.json(
      { success: false, error: { message: isServiceError ? error.message : "Gagal mengambil data milestone.", code: isServiceError ? error.code : "INTERNAL_ERROR" } },
      { status }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request);
    const body = await request.json();

    const parsed = createMilestoneSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: "Data milestone tidak valid.", code: "INVALID_INPUT", details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const data = await createMilestone(parsed.data, user.id);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) return authErrorResponse(error);
    const isServiceError = error instanceof MilestoneServiceError;
    const status = isServiceError && error.code === "PROJECT_NOT_FOUND" ? 404 : isServiceError ? 400 : 500;
    return NextResponse.json(
      { success: false, error: { message: isServiceError ? error.message : "Gagal membuat milestone.", code: isServiceError ? error.code : "INTERNAL_ERROR" } },
      { status }
    );
  }
}
