"use client";

import Link from "next/link";
import { Button } from "@/app/components/ui/Button";

export default function AppError({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-surface-400">Ups</p>
      <h1 className="mt-2 text-2xl font-bold text-surface-900">Halaman gagal dimuat</h1>
      <p className="mt-2 max-w-sm text-sm text-surface-500">
        Kemungkinan sesi Anda telah berakhir atau data tidak tersedia. Silakan coba lagi atau kembali ke beranda.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Button variant="primary" onClick={() => reset()}>
          Coba lagi
        </Button>
        <Link href="/">
          <Button variant="secondary">Kembali ke beranda</Button>
        </Link>
      </div>
    </div>
  );
}