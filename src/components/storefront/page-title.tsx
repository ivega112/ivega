import Link from "next/link";

/** Centered page heading band with breadcrumb (reference "page title"). */
export function PageTitle({ title, crumb }: { title: string; crumb?: string }) {
  return (
    <div className="border-b border-ay-line bg-white">
      <div className="ay-container flex flex-col items-center gap-2 py-[30px] text-center">
        <h1 className="text-[28px] font-semibold text-ay-heading md:text-[36px]">{title}</h1>
        <nav aria-label="مسار التنقل" className="flex flex-wrap justify-center gap-1.5 text-[14px]">
          <Link href="/" className="hover:text-ay-primary">
            الرئيسية
          </Link>
          <span className="text-[#bbb]">/</span>
          <span className="font-semibold text-ay-title">{crumb ?? title}</span>
        </nav>
      </div>
    </div>
  );
}
