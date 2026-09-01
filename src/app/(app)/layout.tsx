import { requireCurrentUser } from "@/lib/auth";
import { AppShell } from "@/app/components/shell/AppShell";
import { ToastProvider } from "@/app/components/ui/Toast";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let user: { id: string; name?: string | null } | null = null;
  let authed = false;
  try {
    user = await requireCurrentUser();
    authed = true;
  } catch {
    authed = false;
  }

  // Authenticated users get the persistent shell. Unauthenticated requests
  // render the page directly (e.g. the login screen on "/").
  if (!authed) {
    return <>{children}</>;
  }

  return (
    <ToastProvider>
      <AppShell user={{ name: user?.name }}>{children}</AppShell>
    </ToastProvider>
  );
}
