import Link from "next/link";

/**
 * Shared numbered-pagination control for admin list pages. Server component — page state
 * lives entirely in the URL (`buildHref(page)`), so it works with plain <Link>s: no client
 * JS needed, browser back/forward and refresh all just work.
 */
export function AdminPagination({
  page,
  pageCount,
  buildHref,
}: {
  page: number;
  pageCount: number;
  buildHref: (page: number) => string;
}) {
  if (pageCount <= 1) return null;

  // Compact window: first, last, current ±1, with "…" gaps — avoids rendering 50+ page
  // links for a large catalog.
  const pages = new Set<number>([1, pageCount, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pageCount));
  const sorted = Array.from(pages).sort((a, b) => a - b);

  const items: (number | "gap")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) items.push("gap");
    items.push(p);
    prev = p;
  }

  return (
    <nav aria-label="ترقيم الصفحات" className="flex items-center justify-center gap-1.5">
      <PageLink
        href={page > 1 ? buildHref(page - 1) : undefined}
        disabled={page <= 1}
        label="السابق"
      />
      {items.map((item, i) =>
        item === "gap" ? (
          <span key={`gap-${i}`} className="px-1.5 text-sm text-text-faint" aria-hidden="true">…</span>
        ) : (
          <Link
            key={item}
            href={buildHref(item)}
            aria-current={item === page ? "page" : undefined}
            className={`flex h-9 min-w-9 items-center justify-center rounded-[9px] border px-2 text-sm font-mono ${
              item === page
                ? "border-brand-action bg-brand-action-tint font-semibold text-brand-deep"
                : "border-border text-text-secondary hover:border-admin-border-hover"
            }`}
          >
            {item}
          </Link>
        )
      )}
      <PageLink
        href={page < pageCount ? buildHref(page + 1) : undefined}
        disabled={page >= pageCount}
        label="التالي"
      />
    </nav>
  );
}

function PageLink({ href, disabled, label }: { href?: string; disabled: boolean; label: string }) {
  if (disabled || !href) {
    return (
      <span aria-disabled="true" className="flex h-9 items-center rounded-[9px] border border-border-light px-3 text-sm text-text-faintest">
        {label}
      </span>
    );
  }
  return (
    <Link href={href} className="flex h-9 items-center rounded-[9px] border border-border px-3 text-sm text-text-secondary hover:border-admin-border-hover">
      {label}
    </Link>
  );
}
