"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "./ui/Button";
import { useToast } from "./ui/Toast";
import { useConfirm } from "./ui/Confirm";

export default function LogoutButton() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { askConfirm, confirmDialog } = useConfirm();

  async function logout() {
    if (!(await askConfirm({ title: "Keluar akun", description: "Keluar dari akun Anda?", confirmLabel: "Keluar", danger: true }))) return;
    setLoading(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error();
      toast("Berhasil keluar.", "success");
      router.refresh();
    } catch {
      toast("Gagal keluar.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="danger" icon="logout" onClick={logout} loading={loading}>
        Keluar
      </Button>
      {confirmDialog}
    </>
  );
}