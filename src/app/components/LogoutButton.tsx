"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "./ui/Button";
import { useToast } from "./ui/Toast";

export default function LogoutButton() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function logout() {
    if (!window.confirm("Sign out of your account?")) return;
    setLoading(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error();
      toast("Signed out.", "success");
      router.refresh();
    } catch {
      toast("Couldn't sign out.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="danger" icon="logout" onClick={logout} loading={loading}>
      Sign out
    </Button>
  );
}
