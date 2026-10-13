"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/pricing";

interface Suggestion {
  slug: string;
  nameAr: string;
  price: number;
  imageUrl: string | null;
  categoryName: string;
  brandName: string;
}

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 250;

export function SearchTrigger({
  className = "",
  autoFocus = false,
  onNavigate,
  inputId = "site-search-input",
}: {
  className?: string;
  autoFocus?: boolean;
  onNavigate?: () => void;
  inputId?: string;
} = {}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const triggerRef = useRef<HTMLInputElement>(null);

  function close() {
    setOpen(false);
  }

  function navigated() {
    close();
    onNavigate?.();
  }

  function goToResults(query: string) {
    if (query.trim().length === 0) return;
    router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
    navigated();
  }

  // Close when clicking outside
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = q.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setLoading(false);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);
    const requestId = ++requestIdRef.current;

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(trimmed)}`);
        if (!res.ok) throw new Error("bad response");
        const data = await res.json();
        if (requestId === requestIdRef.current) {
          setSuggestions(data.suggestions ?? []);
          setActiveIndex(-1);
        }
      } catch {
        if (requestId === requestIdRef.current) setError(true);
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      router.push(`/product/${suggestions[activeIndex].slug}`);
      navigated();
      return;
    }
    goToResults(q);
  }

  function onKeyDownInput(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    }
  }

  const showPanel = open && q.trim().length >= MIN_QUERY_LENGTH;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form
        onSubmit={submit}
        role="search"
        className="flex h-[46px] items-center rounded-[35px] border-2 border-black/10 bg-white transition-colors focus-within:border-black/20"
      >
        <label htmlFor={inputId} className="sr-only">ابحث عن منتج، ماركة، أو موديل</label>
        <input
          id={inputId}
          autoFocus={autoFocus}
          ref={triggerRef}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls="site-search-suggestions"
          aria-autocomplete="list"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDownInput}
          placeholder="ابحث عن منتج، ماركة، أو موديل…"
          className="h-full w-full min-w-0 flex-1 bg-transparent ps-5 text-[14px] text-ay-title outline-none placeholder:text-ay-text"
          autoComplete="off"
        />
        {q && (
          <button type="button" onClick={() => { setQ(""); triggerRef.current?.focus(); }} aria-label="مسح البحث" className="flex items-center justify-center rounded-full px-1 text-sm text-[#999] hover:text-ay-title">
            ✕
          </button>
        )}
        <button type="submit" aria-label="بحث" className="grid h-full w-[50px] flex-none place-items-center text-ay-title hover:text-ay-primary">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.6-3.6" />
          </svg>
        </button>
      </form>

      {showPanel && (
        <div
          id="site-search-suggestions"
          role="listbox"
          className="absolute top-[calc(100%+6px)] z-[100] max-h-[420px] w-full animate-ay-rise overflow-y-auto bg-white text-ay-text shadow-[0_0_3px_rgba(0,0,0,0.15)]"
        >
          {loading && <p className="px-3 py-4 text-center text-[13px]">جارٍ البحث…</p>}

          {!loading && error && (
            <p className="px-3 py-4 text-center text-xs text-discount-ribbon">تعذّر تحميل الاقتراحات، حاول مرة أخرى</p>
          )}

          {!loading && !error && suggestions.length === 0 && (
            <p className="px-3 py-5 text-center text-[14px]">لا توجد نتائج مطابقة لـ «{q}»</p>
          )}

          {!loading &&
            !error &&
            suggestions.length > 0 && (
              <div className="flex flex-col">
                {suggestions.map((s, i) => (
                  <Link
                    key={s.slug}
                    href={`/product/${s.slug}`}
                    role="option"
                    aria-selected={i === activeIndex}
                    onClick={navigated}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`flex items-center gap-3 border-b border-ay-line px-[15px] py-[10px] transition-colors ${i === activeIndex ? "bg-ay-page" : "hover:bg-ay-page"}`}
                  >
                    <span className="relative size-[60px] flex-none overflow-hidden bg-white">
                      {s.imageUrl && <Image src={s.imageUrl} alt="" fill className="object-contain p-1" />}
                    </span>
                    <span className="flex flex-1 flex-col gap-0.5">
                      <span className="line-clamp-2 text-[14px] font-medium text-ay-title">{s.nameAr}</span>
                      <span className="text-[12px] text-ay-muted">{s.brandName} · {s.categoryName}</span>
                    </span>
                    <span className="text-[13px] font-semibold whitespace-nowrap text-ay-primary">{formatCurrency(s.price)}</span>
                  </Link>
                ))}
              </div>
            )}

          {!loading && !error && (
            <button
              type="button"
              onClick={() => goToResults(q)}
              className="sticky bottom-0 flex w-full items-center justify-center bg-ay-page py-3 text-[13px] font-semibold text-ay-title transition-colors hover:text-ay-primary"
            >
              عرض كل نتائج البحث عن «{q}»
            </button>
          )}
        </div>
      )}
    </div>
  );
}
