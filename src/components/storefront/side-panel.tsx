"use client";

import { useEffect, useState } from "react";

/** Off-canvas panel with backdrop. `side` is logical: "start" is the right edge in RTL. */
export function SidePanel({
  open,
  onClose,
  side = "start",
  width = 340,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  side?: "start" | "end";
  width?: number;
  label: string;
  children: React.ReactNode;
}) {
  // Keep content mounted only while open (plus the closing slide), so closed panels don't
  // leave duplicate, hidden copies of their content in the page.
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    const t = setTimeout(() => setMounted(false), 500);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const hidden = side === "start" ? "translate-x-full ltr:-translate-x-full" : "-translate-x-full ltr:translate-x-full";

  return (
    <div className={`fixed inset-0 z-[150] ${open ? "" : "pointer-events-none"}`} inert={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/70 transition-opacity duration-500 ease-ay ${open ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={label}
        style={{ width: `min(${width}px, 90vw)` }}
        className={`absolute inset-y-0 flex flex-col bg-white text-ay-text transition-transform duration-500 ease-ay ${
          side === "start" ? "start-0" : "end-0"
        } ${open ? "translate-x-0" : hidden}`}
      >
        {mounted ? children : null}
      </aside>
    </div>
  );
}
