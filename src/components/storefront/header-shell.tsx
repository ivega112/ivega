"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, MessageCircle, Phone, Search, X } from "lucide-react";
import { HeaderActions, SupportLink } from "./header-actions";
import { MobileNav } from "./mobile-nav";
import { SearchTrigger } from "./search-trigger";
import { SiteNav, type NavCategory } from "./site-nav";

interface HeaderShellProps {
  logoUrl: string;
  storeName: string;
  phoneDisplay: string;
  phoneHref: string;
  categories: NavCategory[];
  /** Set when the admin enabled the WhatsApp button in the header. */
  whatsappHref?: string | null;
}

export function HeaderShell({ logoUrl, storeName, phoneDisplay, phoneHref, categories, whatsappHref }: HeaderShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const sticky = useStickyClone();

  // Logo image with the English store name written beside it.
  const logo = (imgCls: string, textCls: string) => (
    <Link href="/" aria-label={storeName} className="flex flex-none items-center gap-2.5">
      <span className={`relative block flex-none ${imgCls}`}>
        <Image src={logoUrl} alt="" fill priority sizes="80px" className="object-contain" />
      </span>
      <span dir="ltr" className={`font-bold whitespace-nowrap text-ay-heading ${textCls}`}>
        {storeName}
      </span>
    </Link>
  );

  const mobileRow = (
    <div className="border-b border-ay-line lg:hidden">
      <div className="ay-container flex h-[60px] items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button type="button" aria-label="القائمة" onClick={() => setDrawerOpen(true)} className="grid size-10 place-items-center text-ay-title">
            <Menu className="size-[23px]" strokeWidth={1.7} />
          </button>
          <button type="button" aria-label="بحث" onClick={() => setSearchOpen(true)} className="grid size-10 place-items-center text-ay-title">
            <Search className="size-[21px]" strokeWidth={1.8} />
          </button>
        </div>
        <div className="flex min-w-0 flex-1 justify-center">{logo("size-[36px]", "text-[15px] sm:text-[17px]")}</div>
        <HeaderActions compact />
      </div>
    </div>
  );

  return (
    <>
      <header className="relative z-50 bg-white">
        {/* Desktop: general row */}
        <div className="hidden border-b border-ay-line lg:block">
          <div className="ay-container flex h-[105px] items-center gap-[30px]">
            {logo("size-[76px]", "text-[24px]")}
            <SearchTrigger className="max-w-[596px] flex-1" />
            <div className="ms-auto flex items-center gap-[18px]">
              <span className="hidden lg:block">
                <SupportLink />
              </span>
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="واتساب المتجر"
                  className="grid size-10 place-items-center rounded-full bg-ay-whatsapp text-white transition-opacity hover:opacity-90"
                >
                  <MessageCircle className="size-[20px]" />
                </a>
              )}
              <HeaderActions />
            </div>
          </div>
        </div>
        {/* Desktop: navigation row */}
        <nav className="hidden border-b border-ay-line lg:block" aria-label="التنقل الرئيسي">
          <div className="ay-container flex h-[52px] items-center justify-between">
            <SiteNav categories={categories} />
            <a href={phoneHref} className="hidden items-center gap-1.5 text-[13px] font-semibold text-ay-title lg:flex">
              <Phone className="size-[15px]" />
              اتصل بنا : <span dir="ltr">{phoneDisplay}</span>
            </a>
          </div>
        </nav>
        {mobileRow}
      </header>

      {/* Sticky clone: slides in when scrolling up, hides when scrolling down. */}
      <div
        inert={!sticky}
        className={`fixed inset-x-0 top-0 z-[60] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition-transform duration-300 ${
          sticky ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="hidden lg:block">
          <div className="ay-container flex h-[70px] items-center gap-[30px]">
            {logo("size-[50px]", "text-[19px]")}
            <SiteNav categories={categories} />
            <div className="ms-auto flex items-center gap-[14px]">
              <button type="button" aria-label="بحث" onClick={() => setSearchOpen(true)} className="grid size-10 place-items-center text-ay-title hover:text-ay-primary">
                <Search className="size-5" strokeWidth={1.8} />
              </button>
              <HeaderActions />
            </div>
          </div>
        </div>
        {mobileRow}
      </div>

      <MobileNav categories={categories} open={drawerOpen} onClose={() => setDrawerOpen(false)} phoneDisplay={phoneDisplay} phoneHref={phoneHref} />
      <SearchLayer open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

/** Full-width search layer dropping from the top (mobile + sticky header). */
function SearchLayer({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className={`fixed inset-0 z-[170] ${open ? "" : "pointer-events-none"}`} inert={!open}>
      <div onClick={onClose} className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} />
      <div className={`absolute inset-x-0 top-0 bg-white py-6 shadow-lg transition-transform duration-500 ease-ay ${open ? "translate-y-0" : "-translate-y-full"}`}>
        <div className="ay-container flex items-center gap-3">
          {open && <SearchTrigger className="flex-1" autoFocus inputId="layer-search" onNavigate={onClose} />}
          <button type="button" onClick={onClose} aria-label="إغلاق البحث" className="grid size-10 flex-none place-items-center text-ay-title">
            <X className="size-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

function useStickyClone() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 300) setShow(false);
      else if (y < last - 2) setShow(true);
      else if (y > last + 2) setShow(false);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return show;
}
