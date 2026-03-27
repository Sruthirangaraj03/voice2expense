"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      toastOptions={{
        style: {
          background: "#1e293b",
          border: "1px solid #334155",
          color: "#e2e8f0",
        },
      }}
    />
  );
}
