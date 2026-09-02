"use client";

import { useCallback, useRef, useState } from "react";
import { Dialog } from "./Dialog";
import { Button } from "./Button";

type ConfirmOptions = {
  title?: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

// Pengganti `window.confirm` bawaan browser dengan dialog yang selaras dengan
// design system aplikasi (selalu menunggu keputusan user via Promise<boolean>).
export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const askConfirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setOptions(opts);
    });
  }, []);

  const close = useCallback((value: boolean) => {
    resolveRef.current?.(value);
    resolveRef.current = null;
    setOptions(null);
  }, []);

  const confirmDialog = (
    <Dialog
      open={options !== null}
      onClose={() => close(false)}
      title={options?.title ?? "Konfirmasi"}
      closeable
    >
      <p className="text-sm leading-relaxed text-surface-500">{options?.description}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" type="button" onClick={() => close(false)}>
          {options?.cancelLabel ?? "Batal"}
        </Button>
        <Button
          variant={options?.danger ? "danger" : "primary"}
          type="button"
          onClick={() => close(true)}
        >
          {options?.confirmLabel ?? "Lanjutkan"}
        </Button>
      </div>
    </Dialog>
  );

  return { askConfirm, confirmDialog };
}