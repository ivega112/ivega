"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export function BackButton() {
  const router = useRouter();

  return (
    <button type="button" onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-semibold text-ay-title transition-colors hover:text-ay-primary">
      <ArrowRight className="size-4 ltr:rotate-180" />
      عودة
    </button>
  );
}
