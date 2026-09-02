import Link from "next/link";
import { Button } from "@/app/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-surface-400">404</p>
      <h1 className="mt-2 text-2xl font-bold text-surface-900">Halaman tidak ditemukan</h1>
      <p className="mt-2 max-w-sm text-sm text-surface-500">
        Alamat yang Anda tuju tidak tersedia atau sudah dipindahkan.
      </p>
      <div className="mt-6">
        <Link href="/">
          <Button variant="primary">Kembali ke beranda</Button>
        </Link>
      </div>
    </div>
  );
}