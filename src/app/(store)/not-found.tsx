import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-content flex-col items-center gap-4 px-6 py-24 text-center">
      <span className="font-mono text-7xl font-medium text-brand-deep">404</span>
      <h1 className="text-2xl font-bold text-text-primary">الصفحة غير موجودة</h1>
      <p className="max-w-md text-sm text-text-muted">قد يكون الرابط قديماً أو تمت إزالة المنتج. يمكنك العودة إلى الرئيسية أو تصفح المتجر.</p>
      <div className="flex gap-3">
        <Link href="/" className="h-11 rounded-control bg-brand-action px-5 py-3 text-sm font-semibold text-white">العودة للرئيسية</Link>
        <Link href="/shop" className="h-11 rounded-control border border-border-strong px-5 py-3 text-sm font-semibold text-brand-deep">تصفح المتجر</Link>
      </div>
    </div>
  );
}
