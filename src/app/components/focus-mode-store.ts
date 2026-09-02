"use client";

import { useSyncExternalStore } from "react";

// Tiny presentation-only store: broadcasts whether a focus session is active
// so the shell can dim chrome and let the work surface take over.
let active = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function setFocusMode(value: boolean) {
  if (active === value) return;
  active = value;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useFocusMode() {
  return useSyncExternalStore(subscribe, () => active, () => false);
}