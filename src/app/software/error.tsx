"use client";

import { useEffect } from "react";
import { Button } from "@/software-components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Caught. See server logs for details.");
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center space-y-6 shadow-sm">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>

        <h2 className="text-2xl font-bold">حدث خطأ غير متوقع</h2>

        <p className="text-muted-foreground text-sm leading-relaxed">
          نعتذر، واجه النظام مشكلة أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.
        </p>

        {process.env.NODE_ENV !== "production" && (
          <div className="bg-secondary p-4 rounded-lg text-left overflow-x-auto text-xs text-destructive font-mono mt-4" dir="ltr">
            {error.message}
          </div>
        )}

        <Button onClick={() => reset()} className="w-full">
          <RefreshCcw className="w-4 h-4" />
          إعادة المحاولة
        </Button>
      </div>
    </div>
  );
}
