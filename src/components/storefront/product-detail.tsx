"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, MessageCircle, X } from "lucide-react";
import { useCart } from "./cart-context";
import { useStorefrontUi } from "./storefront-ui";
import { QuantityInput } from "./quantity-input";
import { ProductPrice, StockStatus } from "./product-card";
import { calculateDiscountPercent, formatCurrency } from "@/lib/pricing";

export interface ProductDetailData {
  id: string;
  nameAr: string;
  sku: string;
  model: string | null;
  brandName: string;
  brandSlug?: string;
  brandLogoUrl?: string | null;
  categoryName: string;
  categorySlug?: string;
  price: number;
  oldPrice: number | null;
  quantity: number;
  shortSpec: string | null;
  description: string | null;
  warrantyInfo: string | null;
  images: { url: string; altText: string | null }[];
  specifications?: { label: string; value: string }[];
}

export function ProductDetail({
  product,
  whatsappNumber,
}: {
  product: ProductDetailData;
  /** Set when the admin enabled the WhatsApp button on product pages. */
  whatsappNumber?: string | null;
}) {
  const { addToCart, recordRecentlyViewed } = useCart();
  const { setCartOpen } = useStorefrontUi();
  const [qty, setQty] = useState(1);
  const discount = calculateDiscountPercent(product.price, product.oldPrice);

  useEffect(() => {
    recordRecentlyViewed(product.id);
  }, [product.id, recordRecentlyViewed]);

  const specs = product.specifications ?? [];
  type Tab = { key: string; label: string; content: React.ReactNode };
  const tabs = ([
    product.description || product.shortSpec
      ? {
          key: "desc",
          label: "الوصف",
          content: <p className="max-w-[900px] text-[14px] leading-[1.9] whitespace-pre-line">{product.description || product.shortSpec}</p>,
        }
      : null,
    specs.length > 0
      ? {
          key: "specs",
          label: "المواصفات",
          content: (
            <table className="w-full max-w-[900px] border border-ay-line text-[14px]">
              <tbody>
                {specs.map((s) => (
                  <tr key={s.label} className="border-b border-ay-line last:border-0">
                    <th className="w-1/3 bg-ay-page px-4 py-3 text-start font-semibold text-ay-title">{s.label}</th>
                    <td className="px-4 py-3">{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ),
        }
      : null,
    product.warrantyInfo
      ? { key: "warranty", label: "الضمان", content: <p className="max-w-[900px] text-[14px] leading-[1.9] whitespace-pre-line">{product.warrantyInfo}</p> }
      : null,
  ] as (Tab | null)[]).filter((t): t is Tab => t !== null);

  return (
    <>
      <div className="ay-container grid gap-[30px] pt-[40px] pb-[40px] md:grid-cols-2">
        <Gallery images={product.images} name={product.nameAr} discount={discount} />

        <div className="flex flex-col gap-[18px]">
          <nav aria-label="مسار التنقل" className="flex flex-wrap items-center gap-1.5 text-[14px]">
            <Link href="/" className="hover:text-ay-primary">الرئيسية</Link>
            <span className="text-[#bbb]">/</span>
            {product.categorySlug && (
              <>
                <Link href={`/category/${product.categorySlug}`} className="hover:text-ay-primary">{product.categoryName}</Link>
                <span className="text-[#bbb]">/</span>
              </>
            )}
            <span className="font-semibold text-ay-title">{product.nameAr}</span>
          </nav>

          <div className="flex items-start justify-between gap-5">
            <h1 className="text-[26px] leading-[1.25] font-medium text-ay-title md:text-[34px]">{product.nameAr}</h1>
            {product.brandSlug && (
              <Link
                href={`/brands/${product.brandSlug}`}
                title={product.brandName}
                className="grid h-[70px] w-[90px] flex-none place-items-center border border-ay-line bg-white p-2 text-center text-[13px] font-bold text-ay-title"
              >
                {product.brandLogoUrl ? (
                  <span className="relative block size-full">
                    <Image src={product.brandLogoUrl} alt={product.brandName} fill sizes="90px" className="object-contain" />
                  </span>
                ) : (
                  product.brandName
                )}
              </Link>
            )}
          </div>

          <ProductPrice price={product.price} oldPrice={product.oldPrice} className="justify-start text-[22px]" />
          {product.shortSpec && <p className="text-[14px] leading-[1.8]">{product.shortSpec}</p>}
          <StockStatus />

          <div className="flex flex-wrap items-center gap-[10px]">
              <QuantityInput value={qty} onChange={setQty} />
              <button
                type="button"
                onClick={() => {
                  addToCart(product.id, qty);
                  setCartOpen(true);
                }}
                className="ay-btn-primary min-w-[160px]"
              >
                أضف إلى السلة
              </button>
            </div>

          {whatsappNumber && (
            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`مرحباً، أود الاستفسار عن: ${product.nameAr} (${formatCurrency(product.price)}) — SKU: ${product.sku}`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-[42px] w-fit items-center gap-2 rounded-[3px] bg-ay-whatsapp px-5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              <MessageCircle className="size-[17px]" />
              اطلب عبر واتساب
            </a>
          )}

          <div className="mt-1 space-y-1 border-t border-ay-line pt-[18px] text-[14px]">
            <p>
              <span className="font-semibold text-ay-title">SKU: </span>
              <span dir="ltr">{product.sku}</span>
            </p>
            {product.model && (
              <p>
                <span className="font-semibold text-ay-title">الموديل: </span>
                {product.model}
              </p>
            )}
            <p>
              <span className="font-semibold text-ay-title">القسم: </span>
              {product.categorySlug ? (
                <Link href={`/category/${product.categorySlug}`} className="hover:text-ay-primary">{product.categoryName}</Link>
              ) : (
                product.categoryName
              )}
            </p>
            <p>
              <span className="font-semibold text-ay-title">الشركة: </span>
              {product.brandSlug ? (
                <Link href={`/brands/${product.brandSlug}`} className="hover:text-ay-primary">{product.brandName}</Link>
              ) : (
                product.brandName
              )}
            </p>
          </div>
        </div>
      </div>

      {tabs.length > 0 && <DetailTabs tabs={tabs} />}
    </>
  );
}

function DetailTabs({ tabs }: { tabs: { key: string; label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.key);
  const current = tabs.find((t) => t.key === active) ?? tabs[0];
  if (!current) return null;
  return (
    <div className="border-t border-ay-line bg-white">
      <div role="tablist" className="ay-container flex justify-center gap-[30px] overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={t.key === current.key}
            onClick={() => setActive(t.key)}
            className={`relative h-[61px] text-[16px] font-semibold whitespace-nowrap transition-colors after:absolute after:inset-x-0 after:top-0 after:h-[2px] after:bg-ay-primary after:transition-opacity ${
              t.key === current.key ? "text-ay-title after:opacity-100" : "text-ay-title/60 after:opacity-0 hover:text-ay-title"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div key={current.key} role="tabpanel" className="ay-container animate-ay-fade pt-[25px] pb-[50px]">
        {current.content}
      </div>
    </div>
  );
}

function Gallery({ images, name, discount }: { images: { url: string; altText: string | null }[]; name: string; discount: number | null }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const count = images.length;
  const go = (n: number) => setActive(((n % count) + count) % count);
  const current = images[active];

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox]);

  return (
    <div className="flex flex-col gap-[10px]">
      <div
        className={`relative aspect-square overflow-hidden bg-white ${current ? "cursor-zoom-in" : ""}`}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onMouseLeave={() => setZoom(null)}
        onClick={() => current && setLightbox(true)}
      >
        {current ? (
          <Image
            key={current.url}
            src={current.url}
            alt={current.altText ?? name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 581px"
            className="animate-ay-fade object-contain p-4 transition-transform duration-200 [@media(hover:hover)]:hover:scale-[1.6]"
            style={zoom ? { transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          />
        ) : (
          <div className="grid h-full place-items-center bg-[repeating-linear-gradient(135deg,#f6f6f6_0_8px,#fff_8px_16px)] text-[13px] text-ay-muted">بانتظار الصورة</div>
        )}
        {discount && (
          <span className="absolute end-[15px] top-[15px] bg-black px-2.5 py-[5px] text-[12px] font-semibold text-white" dir="ltr">
            -{discount}%
          </span>
        )}
        {current && (
          <button
            type="button"
            aria-label="تكبير الصورة"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(true);
            }}
            className="absolute start-[15px] bottom-[15px] grid size-[45px] place-items-center rounded-full bg-white text-ay-title shadow-[0_0_5px_rgba(0,0,0,0.12)] hover:text-ay-primary"
          >
            <Maximize2 className="size-[17px]" />
          </button>
        )}
      </div>

      {count > 1 && (
        <div className="grid grid-cols-4 gap-[10px]">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              aria-label={`صورة ${i + 1}`}
              onClick={() => setActive(i)}
              className={`relative aspect-square bg-white transition-opacity hover:opacity-100 ${i === active ? "opacity-100 ring-1 ring-black/20" : "opacity-60"}`}
            >
              <Image src={img.url} alt="" fill sizes="140px" className="object-contain p-1" />
            </button>
          ))}
        </div>
      )}

      {lightbox && current && (
        <div className="fixed inset-0 z-[180] animate-ay-fade bg-black/90" role="dialog" aria-modal="true" aria-label={name}>
          <button type="button" aria-label="إغلاق" onClick={() => setLightbox(false)} className="absolute end-4 top-4 z-10 grid size-11 place-items-center text-white/80 hover:text-white">
            <X className="size-7" />
          </button>
          <div className="absolute inset-[60px] animate-ay-zoom" onClick={() => setLightbox(false)}>
            <Image src={current.url} alt={current.altText ?? name} fill sizes="100vw" className="object-contain" />
          </div>
          {count > 1 && (
            <>
              <button type="button" aria-label="السابق" onClick={() => go(active - 1)} className="absolute start-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center text-white/80 hover:text-white">
                <ChevronRight className="size-8 ltr:rotate-180" />
              </button>
              <button type="button" aria-label="التالي" onClick={() => go(active + 1)} className="absolute end-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center text-white/80 hover:text-white">
                <ChevronLeft className="size-8 ltr:rotate-180" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
