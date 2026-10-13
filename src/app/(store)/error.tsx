"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-content flex-col items-center gap-4 px-6 py-24 text-center">
      <h1 className="text-xl font-bold text-text-primary">حدث خطأ غير متوقع</h1>
      <p className="text-sm text-text-muted">يرجى المحاولة مرة أخرى.</p>
      <button onClick={reset} className="h-11 rounded-control bg-brand-action px-5 text-sm font-semibold text-white">
        إعادة المحاولة
      </button>
    </div>
  );
}
