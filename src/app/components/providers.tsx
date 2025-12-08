"use client";

import { Toaster } from "sonner";
import { ReactNode } from "react";
import KeyboardShortcuts from "./keyboard-shortcuts";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="bottom-right" richColors />
      <KeyboardShortcuts />
    </>
  );
}
