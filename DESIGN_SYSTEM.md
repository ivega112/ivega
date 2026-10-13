# Smart Line Design System — Extracted Tokens & Patterns

Source of truth: `project/PageSystem.dc.html` (design-token reference page), cross-checked against `ProductCard.dc.html`, `PageHome.dc.html`, `PageShop.dc.html`, `PageProduct.dc.html`, `PageCart.dc.html`, `PageMobile.dc.html`, `Smart Line Admin.dc.html`, `Smart Line Store.dc.html`. All values below are exact hex/px pulled from inline `style` attributes — not approximations.

## 1. Colors

### Brand / identity
| Name | Hex | Usage |
|---|---|---|
| Brand 950 | `#062A5C` | darkest sections, gradient ends (hero/category-card overlays) |
| Brand 900 (primary) | `#0B3C82` | logo bg, header/footer dark sections, prices, headings on dark, primary "deep" buttons |
| Brand 800 (footer/dark alt) | `#08213F` | store header wrapper bg (PageSystem), admin sidebar bg |
| Brand 700 | `#0E4A9E` | hero gradients |
| Primary 600 (action) | `#1B62E5` | primary buttons, links, focus rings, active tab underline |
| Primary 600 hover | `#1550C4` | button hover state |
| Primary 100 | `#EEF4FE` | icon chip backgrounds, active filter/chip backgrounds |
| Primary 100 border | `#DCE7F8` / `#C7D9F6` | chip/badge borders on primary-tinted surfaces |
| Accent Cyan | `#0891B2` | "hot/bestseller" badge, limited secondary accent |

### Neutrals / surfaces
| Name | Hex | Usage |
|---|---|---|
| Ink 900 (text) | `#0F1B2D` | headings, primary text |
| Slate 600 | `#4A5B70` / `#3B4A5F` | body copy |
| Slate 400 | `#8595AA` | helper/secondary text |
| Slate 300 | `#9AA8BA` / `#C3CEDD` / `#CBD6E4` | placeholders, disabled borders, chevrons |
| Border default | `#E4E9F1` / `#E6EBF2` / `#E9EEF4` | card borders, dividers |
| Border light | `#EDF1F7` / `#EEF2F7` / `#F1F5F9` | inner separators |
| Input bg | `#F7F9FC` / `#F4F7FB` | inputs, search bars |
| Page bg | `#F5F7FA` / `#F1F4F9` | app background |
| Panel bg | `#F8FAFD` | subtle card-in-card panels |
| Image gradient top | `#FBFCFE` | product image frame gradient start |
| Image gradient base | `#F1F5FA` | product image frame gradient end |
| White | `#FFFFFF` | cards, product image surface |

### Semantic
| Name | Hex | Usage |
|---|---|---|
| Success / in-stock | `#12A150` | stock dot, success toast accent, "متوفر" |
| Success text | `#0E7A3E` | in-stock label text |
| Success bg | `#E8F7EE` / `#F0FAF4` | success chip/toast bg |
| Success border | `#CFE9DA` | success chip border |
| WhatsApp | `#12A150` (buttons) / `#128C4B` (icon-only outline) | all WhatsApp CTAs |
| WhatsApp hover | `#0E8843` | WhatsApp button hover |
| Warning / offer badge | `#E9A100` | "عرض" badge bg, offer ribbons |
| Warning text (on amber) | `#20170A` | text on `#E9A100` |
| Low stock | `#B27700` | "كمية محدودة" text/badge bg |
| Low stock dot | `#E9A100` | low-stock indicator dot |
| Error / discount | `#E03131` | discount ribbon, delete-hover, error borders |
| Error bg | `#FFF5F5` / `#FFF1F1` | error input bg, error banner |
| Error border | `#F5C2C2` | error borders |
| Muted / out-of-stock | `#64748B` | "غير متوفر" badge/text |
| Muted dot | `#94A3B8` | out-of-stock dot |
| Purple (featured badge) | `#5B5BD6` | "مميّز" badge |
| New badge | `#0B3C82` (bg) / `#fff` (fg) | "جديد" badge |

### Full badge color map (from `ProductCard.dc.html`)
| Badge key | Label (AR) | Background | Foreground |
|---|---|---|---|
| `new` | جديد | `#0B3C82` | `#ffffff` |
| `offer` | عرض | `#E9A100` | `#20170A` |
| `hot` | الأكثر مبيعاً | `#0891B2` | `#ffffff` |
| `pick` | مميّز | `#5B5BD6` | `#ffffff` |
| `low` | كمية محدودة | `#B27700` | `#ffffff` |
| `out` | غير متوفر | `#64748B` | `#ffffff` |
| discount ribbon | `−NN%` | `#E03131` | `#ffffff` |

Stock-state color triplet (dot / text) used consistently across ProductCard, PageProduct, PageCart, PageMobile:
- In stock: dot `#12A150`, text `#0E7A3E`, label "متوفر"
- Low stock: dot `#E9A100`, text `#B27700`, label "كمية محدودة"
- Out of stock: dot `#94A3B8`, text `#64748B`, label "غير متوفر"

## 2. Typography

Font families: **IBM Plex Sans Arabic** (weights 300/400/500/600/700, primary UI + Arabic + English), **IBM Plex Mono** (weights 400/500, used for numbers, prices, model codes, LTR technical strings). Loaded via Google Fonts in `PageHome.dc.html` `<helmet>`:
```
https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap
```

### Type scale (from PageSystem `typeScale`)
| Role | Size | Weight | Line-height |
|---|---|---|---|
| Display / H1 | 30px (spec label says "44" but sample rendered at 30px — homepage H1 renders at 44px, see below) | 700 | 1.36 |
| H2 section | 24px | 700 | 1.45 |
| H3 card | 19px | 600 | 1.5 |
| Product name | 14.5px | 600 | 1.5 |
| Body | 14px | 400 | 1.9 |
| Label | 12.5px | 600 | 1.6 |
| Caption | 11.5px | 400 | 1.6 |

Note: actual homepage hero H1 (`PageHome.dc.html`) is `font-size:44px;font-weight:700;line-height:1.36`. Product page H1 (`PageProduct.dc.html`) is `31px/700/1.45`. Section H2 across Home/Shop is consistently `24px/700/1.45`. Treat 44px as the true Display size and 30px (seen in PageSystem's own page H1) as a large-heading variant — both exist in the wild; pick 44/36/30/24/19 as a 5-step scale for production.

### Price typography
- Large price (product detail): `38px/700`, currency label `16px/600`, old price `16px` strikethrough `#9AA8BA`
- Card price: `19px/700`, currency `12px/600`
- Compact card price: `15.5px/700`, currency `10.5px/600`
- All prices use `font-variant-numeric: tabular-nums` and color `#0B3C82`
- Currency unit "د.أ" always rendered smaller and bold next to the number, never combined into one string

### RTL/LTR mixing
- Model names / brand names (e.g. "Smart Line HYPER K800 5G") stay `direction:ltr` inside RTL paragraphs
- Phone numbers, prices-as-numerals, and IBM Plex Mono fields use `direction:ltr;text-align:right`

## 3. Spacing rhythm (8pt-ish grid, actual literal values used)

Base scale used directly in `PageSystem.dc.html` spacing swatches: **4, 8, 12, 16, 24, 32, 48, 64px**.

Common component paddings observed across pages: 4px (image inset), 6px, 7px, 9px, 10px, 11px, 12px, 13px, 14px, 16px, 18px, 20px, 22px, 24px, 26px, 28px, 30px, 32px, 34px, 44px (section padding top rhythm: 44px between homepage sections).

Grid gaps: 8px (badges/chips), 11–12px (mobile grids), 14px (desktop card grids in dense areas), 16px (standard desktop product-grid gap), 24px (page-level column gap).

## 4. Radii

| Radius | Usage |
|---|---|
| 5px | badges |
| 6–7px | small icon chips, tags |
| 8–9px | small buttons, icon buttons |
| 9–11px | inputs, medium buttons |
| 10–12px | product image frame (card), cart item thumb |
| 12–14px | admin cards, filter panels |
| 14px | category card |
| 15–16px | large cards, product detail image frame, cart/summary cards |
| 18px | large page sections, PageSystem section cards |
| 20px | mobile bottom-sheet top corners |
| 999px | pills/chips (fully rounded) |
| 42px | mobile device frame (mock-up only, not production) |
| 50% | avatars, radio dots, circular icon buttons |

## 5. Shadows

| Name | Value |
|---|---|
| sm | `0 1px 2px rgba(15,27,45,.06)` |
| md | `0 16px 32px -16px rgba(11,60,130,.26)` (product card hover) |
| lg | `0 30px 60px -26px rgba(3,20,45,.6)` (hero product tile) |
| toast | `0 8px 20px -12px rgba(8,18,31,.3)` |
| sticky bar (mobile checkout) | `0 -6px 20px -10px rgba(15,27,45,.2)` |
| category card hover | `0 16px 32px -18px rgba(11,60,130,.45)` |
| brand card hover | `0 14px 30px -18px rgba(11,60,130,.3)` |

## 6. Breakpoints / containers

| Name | Value |
|---|---|
| Desktop container max-width | **1320px**, `padding: 0 24px` |
| Desktop | ≥ 1280px — 4-column product grid |
| Tablet | 768–1279px — 2–3 columns |
| Mobile | ≤ 767px — 2 columns; **390px** used as the mobile design reference width (iPhone-class) |
| Grid system | 12 columns · 8pt spacing baseline |

Admin panel is desktop-only, fixed-width design (`min-width:1440px`) with a JS-driven `zoom` scale-to-fit for narrower viewports (see `Smart Line Admin.dc.html` `fit()` method) — not a responsive admin; production should build a real responsive admin instead of relying on `zoom`.

## 7. Component patterns

### Header / nav (from `Smart Line Store.dc.html`, referenced)
- Dark blue (`#0B3C82`/`#08213F`) top bar, logo 64px radius 14px (desktop) / 40–44px (mobile)
- Mega menu: 12-section dropdown
- Cart badge: amber `#E9A100` bg, dark text `#20170A`, min 17–19px circular

### Product image treatment (critical, repeated everywhere)
- Aspect ratio **4:3** always
- Inset/padding: **4px** (card), **10px** (product-detail main image), **3px** (compact card), **6–8px** (hero tiles)
- `object-fit: contain`
- `mix-blend-mode: multiply` on product photos over white/gradient bg (removes white background halos)
- Card hover: image `transform: scale(1.07)` over 350ms `cubic-bezier(.2,.7,.3,1)`
- Product-detail gallery main image: hover zoom `scale(1.3)` over 400ms ease
- Gallery thumbnails: 88×76px, 1.5px border, selected border color `#1B62E5`, unselected `#E4E9F1`
- Placeholder (no image yet): diagonal repeating-linear-gradient `135deg,#F2F6FB 0 8px,#FBFDFF 8px 16px` with dashed border and centered image icon + mono-font label
- Crop rule: ≤3% margin around product before upload; no large white-margin square photos

### Product Card (`ProductCard.dc.html`) — 3 variants
- **grid** (default): image 4:3 → brand·category line → 2-line clamped name (min-height 43px) → spec line (1 line, ellipsis) → stock row → price row → action row (primary "أضف إلى السلة" button flex:1 + 40×40 WhatsApp icon button). Card border `#E4E9F1`, hover lifts `translateY(-3px)` + shadow md + border `#BED2F2`. Wishlist heart button top-left 34×34.
- **horizontal**: fixed 132×112 image + inline content, used for search suggestions / "recommended" 3-col rows
- **compact**: image 4:3 → 2-line name (min-height 38px) → price → full-width "أضف إلى السلة" button only (no WhatsApp icon) — used in mobile grids and cross-sell rails
- Badge position: top-right stack (badge + discount ribbon). Discount ribbon separate from status badge, always red `#E03131`, `direction:ltr` (e.g. `−14%`)

### Category card
- Full-bleed 4:3 image, `linear-gradient(175deg,rgba(6,26,58,.08) 30%,rgba(6,26,58,.86))` overlay bottom-heavy for text legibility
- Name + count bottom-left-aligned (RTL: bottom, flex-end), circular arrow chip 30×30 `rgba(255,255,255,.16)` bg bottom-right
- "صورة القسم" (needs-photo) dashed placeholder badge top-start when no image yet — placeholder background uses a brand-tint diagonal gradient (`linear-gradient(160deg, <tint>, #062A5C)`) instead of a photo
- Hover: `translateY(-3px)` + image `scale(1.06)` over 400ms

### Brand card
- White 92px-tall logo panel on top (real logo for Smart Line, else IBM Plex Mono uppercase name + tint-colored underline bar as placeholder), name + category list + count/›browse row below
- Hover: border → `#1B62E5`, shadow, `translateY(-3px)`

### Buttons
| Variant | Height | Radius | Colors |
|---|---|---|---|
| Primary (cart CTA) | 52px | 12px | bg `#1B62E5` → hover `#1550C4`, text `#fff` |
| Primary (standard) | 44px | 11px | same |
| Primary (small) | 36px | 9px | same |
| Disabled | 44px | 11px | bg `#C7D9F6`, text `#fff`, `cursor:not-allowed` |
| Deep blue | 44px | 11px | bg `#0B3C82` |
| Secondary (outline) | 44px | 11px | white bg, border `#D6E0EC`, hover border/text `#1B62E5` |
| WhatsApp (solid) | 44–56px | 11–12px | bg `#12A150` → hover `#0E8843` |
| WhatsApp (light/outline) | 44–50px | 11–12px | bg `#F0FAF4`, text `#0E7A3E`, border `#CFE9DA` → hover solid `#12A150` |
| Icon-only square | 40–52px (min 44px touch target) | 9–12px | white bg, border `#E3E9F0`/`#E4E9F1`, hover tint per context (red for remove/wishlist, blue for compare) |

Rule: cart CTA is always royal blue `#1B62E5`; WhatsApp green `#12A150` is reserved exclusively for WhatsApp actions, never used as a generic button color. Minimum touch target on mobile: **44px**.

### Badges & stock states — see color tables above (Section 1)

### Tabs / pills / chips
- Active pill: bg `#EEF4FE`, border `#1B62E5` (1px), text `#0B3C82`, weight 600, radius 999px
- Inactive pill: bg `#fff`, border `#E3E9F0`, text `#3B4A5F`
- Underline tabs: 2px bottom border, active `#1B62E5` / text `#0B3C82` 600; inactive transparent border / text `#64748B`

### Filters (desktop sidebar / mobile bottom sheet)
- Desktop: sticky sidebar, 282px wide, white card `#fff` border `#E6EBF2` radius 15px, sectioned with `1px solid #EEF2F7` dividers — category checkboxes, brand search + checkboxes, dual-handle price range slider (track `#E9EEF4`, active fill `#1B62E5`, handles white/blue 18–20px circles), availability radio group, feature chip cloud, sticky "تطبيق التصفية" button (`#0B3C82`)
- Mobile: bottom sheet, drag handle `44×4px #D6DEE9`, slides up `cubic-bezier(.2,.8,.25,1)` 300ms, header with "مسح الكل", footer with "إلغاء" (secondary, flex 0 0 110px) + "عرض N منتجاً" (primary, flex 1)

### Admin table/form patterns
- Sidebar: dark navy `#08213F` bg, 262px wide, grouped nav sections (labels `10.5px #5E7CA4` uppercase-tracking), active item bg `#1B62E5` text `#fff`, inactive text `#A9C2E0` hover bg `#0E2E52`
- Header bar: sticky, 64px tall, white, search box with `⌘K` kbd hint, WhatsApp-orders quick link (green outline → solid green hover), notification bell with red count badge, "عرض المتجر" outline link
- Login screen: split layout, left panel dark gradient `linear-gradient(160deg,#0B3C82,#062A5C)` marketing copy, right panel white form; 2FA note references WhatsApp verification
- Bottom dev-only screen switcher (floating pill bar, `rgba(8,18,31,.96)` bg) — internal prototype nav only, not for production

### Toasts
- White card, left/RTL `border-inline-start:3px solid #12A150` accent, icon chip 30×30 bg `#E8F7EE`, shadow `0 8px 20px -12px rgba(8,18,31,.3)`, CTA button `#0B3C82`. Duration ~2.6s (per motion notes).

### Skeletons
- 4:3 shimmer block `linear-gradient(90deg,#EEF2F7 25%,#F7FAFD 50%,#EEF2F7 75%)`, `background-size:200% 100%`, `animation: 1.4s linear infinite` (keyframes `ivShimmer`, defined in PageHome `<style>`)

### Empty state
- Centered card, `#F8FAFD` bg, 48×48 icon chip, heading 14.5px/600, helper text 12.5px `#64748B` max-width 300px

### WhatsApp order message pattern (core purchase flow — no accounts, no forms beyond contact/address)
Plain-text template assembled client-side and sent via `wa.me` deep link, structure (from PageCart/PageMobile):
```
السلام عليكم، أرغب بطلب المنتجات التالية من متجر Smart Line:

1. <name> — الكمية: <qty> — <total> د.أ
...
المجموع الفرعي: X د.أ
الخصم: X د.أ
التوصيل: <method> — <area> (<fee> د.أ)
الإجمالي التقديري: X د.أ
طريقة الدفع: <method>

الاسم: <name>
رقم الهاتف: <phone>
العنوان: <address>
ملاحظات: <notes>
```
Rendered live in a `<pre>` block with dark navy bg `#0B1F38`, text `#CFE3FA`, IBM Plex Mono, as an editable preview before send.

## 8. RTL-specific notes

- Root direction is `rtl` everywhere; English/LTR is the exception, applied selectively (`direction:ltr`) to: model/brand names, phone numbers, price numerals, mono-font technical fields, route paths.
- Logical CSS properties are implied throughout (e.g. `margin-inline-start`, `border-inline-start`) — production Tailwind should use logical utilities (`ms-*`, `me-*`, `border-s-*`) rather than left/right physical ones so the layout would flip correctly if English/LTR is ever added.
- Icons that imply direction (back/forward chevrons) point left-to-right visually flipped for RTL (e.g. "back" chevron points right `path d="m14 6-6 6 6 6"` which is a left-pointing arrow used for "forward" in RTL reading order).
- Breadcrumb separators use a left-pointing chevron consistent with RTL reading order (rightmost = home).

## 9. Mobile-specific (from `PageMobile.dc.html`, 390px reference)

### Bottom navigation (5 items, fixed, `grid-template-columns: repeat(5,1fr)`, white bg, border-top `#E9EEF4`, padding `8px 10px 14px`, min-height 48px per item)
1. الرئيسية (Home)
2. الأقسام (Categories/grid)
3. السلة (Cart)
4. المفضلة (Wishlist)
5. الدعم (Support/headset)

Active item color `#1B62E5` weight 600; inactive `#8595AA` weight 500.

### Category drawer (side menu)
- Full-height panel, dark blue header (logo + title + close), scrollable list of menu items with icon chip + count + chevron, WhatsApp CTA pinned at bottom (`#12A150`)

### Search (full-screen overlay/modal)
- Modal card 340px wide sliding down (`ivPop` animation), input with live cursor caret, "الأكثر بحثاً" pill cloud, "منتجات مقترحة" result rows (46×46 thumb + name/category + price)

### Filter bottom sheet
- See Section 7 "Filters" above — drag handle, sort chips, dual-handle price slider, brand checkboxes, sticky footer with cancel/apply

### Product detail sticky checkout bar
- Fixed bottom bar: total price block (flex 0 0 auto) + primary "أضف إلى السلة" button (flex:1, 50px) + square 50×50 WhatsApp button, white bg, shadow `0 -6px 20px -10px rgba(15,27,45,.2)`, border-top `#E9EEF4`

### Cart / review-order sticky footer
- Cart: primary "إتمام الطلب" (checkout) full-width + WhatsApp-light "الطلب عبر واتساب" full-width, stacked
- Review order: single full-width green "إرسال الطلب عبر واتساب" (54px, 15px/700) + disclaimer caption below

### Review-order stepper
- 3-step progress bar (السلة → مراجعة الطلب → واتساب), 4px bars, filled `#1B62E5` for completed/current, `#DDE5EF` for pending

## 10. Motion / interaction

| Element | Motion |
|---|---|
| Product card | lift 3px + shadow-md + border tint, 180ms; image zoom 1.07× 350ms `cubic-bezier(.2,.7,.3,1)` |
| Category card | lift 3px + image zoom 1.06× 400ms |
| Buttons | color transition 150ms; active-press scale `.98` |
| Dropdowns/menus | slide-in 10px, 160ms, fade out on mouse leave |
| Add-to-cart | bottom toast 2.6s + header cart-count update |
| Loading | 4:3 skeleton shimmer 1.4s linear infinite (not spinners, in grids) |
| Bottom sheet (mobile) | slide up `cubic-bezier(.2,.8,.25,1)` 300ms; scrim fade 220ms |
| Modal/dialog | scrim fade 200ms + pop-in `cubic-bezier(.2,.8,.3,1)` 260ms |

## 11. Map to Tailwind v4 CSS variables (proposed)

```css
@theme {
  /* Brand */
  --color-brand-950: #062A5C;
  --color-brand-900: #0B3C82;
  --color-brand-800: #08213F;
  --color-brand-700: #0E4A9E;
  --color-action-600: #1B62E5;
  --color-action-600-hover: #1550C4;
  --color-action-100: #EEF4FE;
  --color-accent-cyan: #0891B2;

  /* Neutrals */
  --color-ink-900: #0F1B2D;
  --color-slate-600: #4A5B70;
  --color-slate-400: #8595AA;
  --color-border: #E4E9F1;
  --color-border-light: #EDF1F7;
  --color-surface-input: #F7F9FC;
  --color-surface-page: #F5F7FA;
  --color-surface-panel: #F8FAFD;
  --color-image-grad-top: #FBFCFE;
  --color-image-grad-base: #F1F5FA;

  /* Semantic */
  --color-success: #12A150;
  --color-success-text: #0E7A3E;
  --color-success-bg: #E8F7EE;
  --color-whatsapp: #12A150;
  --color-whatsapp-hover: #0E8843;
  --color-warning: #E9A100;
  --color-warning-fg: #20170A;
  --color-low-stock: #B27700;
  --color-error: #E03131;
  --color-error-bg: #FFF5F5;
  --color-muted: #64748B;
  --color-featured: #5B5BD6;

  /* Typography */
  --font-sans: 'IBM Plex Sans Arabic', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, monospace;

  /* Radii */
  --radius-badge: 5px;
  --radius-btn-sm: 9px;
  --radius-btn: 11px;
  --radius-card-image: 12px;
  --radius-card: 14px;
  --radius-section: 18px;
  --radius-sheet-top: 20px;
  --radius-pill: 999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(15,27,45,.06);
  --shadow-card: 0 16px 32px -16px rgba(11,60,130,.26);
  --shadow-hero: 0 30px 60px -26px rgba(3,20,45,.6);
  --shadow-sticky-bar: 0 -6px 20px -10px rgba(15,27,45,.2);

  /* Layout */
  --container-max: 1320px;
  --breakpoint-mobile-ref: 390px;
}
```

## 12. Additional tokens surfaced from page-level review (Admin + secondary store pages)

### Confirmed recurring hover shades (promote to first-class tokens)
- Action blue hover: `#1550C4` (darker shade of `#1B62E5`) — used on every primary button across store + admin.
- WhatsApp hover: `#0E8843` (darker shade of `#12A150`) — used on every WhatsApp CTA.

### Admin-only additions
- Admin surface dark navy (sidebar/login bg gradient): `#08213F`, gradient `linear-gradient(160deg,#0B3C82,#062A5C)`.
- Toggle switch (standard): track 40×23px / knob 19px, radius 12px, knob shadow `0 1px 3px rgba(15,27,45,.25)`; **payments-page variant is larger**: track 44×25px / knob 21px — inconsistency to normalize to one size in production.
- Danger-zone (maintenance mode) card: bg `#FFF5F5`, border `#F5C2C2`, title `#C92A2A`, body text `#7A2B2B`, toggle-off track `#F0C9C9` (distinct red-tinted off-state, unique to this one control — elsewhere off-state track is `#DDE5EF`/`#EDF1F7`).
- WhatsApp template editor: dark textarea `#0B1F38` bg / border `#14375F` / text `#CFE3FA`; variable-token chips `#EEF4FE` bg / `#C7D9F6` border / `#0B3C82` text.
- WhatsApp chat-bubble preview: outgoing bubble bg `#12A150`, radius `14px 14px 4px 14px`; incoming bubble `rgba(255,255,255,.92)`, radius `14px 14px 14px 4px`.
- Warning/caution box (CliQ & bank-transfer disclaimers, both admin and PageDocs): bg `#FFF9EC`, border `#F3E0B5`, text `#5A4708` — a *darker-text* amber pairing distinct from the `#E9A100`/`#20170A` badge pairing; confirm with design whether this is a second "caution" semantic tone or should collapse into the existing warning token.
- User role badges (admin Users table): مدير عام `#EEF4FE`/`#0B3C82`; محرّر منتجات `#EAF7FB`/`#0E7490`; موظّف طلبات `#F0FAF4`/`#0E7A3E`.
- Category-placeholder gradient tints (AdminTaxonomy, prototype placeholders pending real photos — do not treat as final): `#0E4A9E`, `#0F3E6E`, `#1B4F8A`, `#2A4E7C`, `#3E5A8A`, `#1D5FA8`, `#166534`, all fading to `#062A5C`.
- Admin data-table conventions: header stripe bg `#F8FAFD`, header text `11.5px/600 #64748B`, row divider `#F1F5F9`, row thumbnail sizes vary by context (48×42 to 76×56) — standardize to one `DataTable` thumbnail size in production.
- Stock-quantity color coding (AdminProducts table): 0 → `#E03131`, ≤5 → `#B27700`, else default ink `#0F1B2D`.

### Secondary store-page additions
- Fake WhatsApp chat-bubble preview (PageContact hero) reuses the same bubble radius/colors as the admin template preview — confirms this is a shared `ChatBubble` pattern, not admin-only.
- Online/live status pill (PageContact): bg `rgba(18,161,80,.22)`, border `rgba(124,224,168,.4)`, text `#B6F0CD`, dot `#4ADE80` — a distinct lighter/saturated green for "online now" indicators, separate from the standard success green `#12A150`.
- Social platform brand colors (PageContact — real third-party brand colors, not part of the Smart Line palette, only needed if social links ship): Instagram `#C13584` (bg `#FDF4FA`/border `#F0D8E8`), Facebook `#1877F2` (bg `#F4F8FF`/border `#D8E6FB`).
- "Closed" business-hours text color (PageContact, Friday row): `#FFC9C9` on the dark `#0B3C82` hours card.
- Policy-callout accent pattern (PageDocs returns policy): `border-inline-start:3px solid #1B62E5` on `#F5F9FF` panel — an RTL-safe logical-property callout border, reusable as a generic "info/policy callout" variant.
- Gradient hero band angle/texture is inconsistent across About/Support/Contact/Brands (100°/105°/110° angle, 22px/24px dot-texture spacing) — production should standardize on one `GradientHero` component with fixed angle (recommend 100°) and fixed 22px dot spacing rather than replicating per-page.
- Image-placeholder diagonal stripe pitch varies (6/7/8/9px) across Product thumbnails, Cart line items, About, Contact — standardize to a single `ImagePlaceholder` component (recommend 8px pitch, matching ProductCard's default).
- Real business data hardcoded in the prototype that must become CMS/config values, not literal strings: phone `+962 79 571 8978`, address "عمّان — مرج الحمام، إسكان عالية، مقابل شركة أورنج", hours (Sat–Wed 10:00–21:00, Thu 10:00–22:00, Fri closed), delivery fees by zone (عمّان 3, سحاب/عين الباشا/البقعة 4, غير ذلك 5, اليوم التالي 2 د.أ ثابت).

## 13. Ambiguities / notes for follow-up (not guessed)

- The "Display/H1" size in `PageSystem.dc.html`'s own type-scale table is labeled `44/1.36·700` but the rendered sample uses `font-size:30px`; the real homepage `<h1>` uses 44px. Production should treat 44px as Display and clarify whether PageSystem's own `<h2>` "نظام تصميم Smart Line" (30px) is a distinct "Page Title" size — both exist and aren't unified in the source.
- Brand tint colors for placeholder logos (QUBIT `#0E7490`, MAXSOUND `#1B4F8A`/`#1B4F8A`, NOVALINK `#155E75`, ORYX `#2A4E7C`, "BETA HOME" `#0B3C82`, SEREEN `#0891B2`, NEOTEC `#3E5A8A`) are prototype placeholders pending real logo files — do not hardcode these as final brand identity colors.
- Admin panel layout is fixed-width 1440px with a CSS-zoom scale-to-fit hack, not a real responsive grid — production admin should get genuine responsive breakpoints (not covered by this design system since the prototype never designed one).
