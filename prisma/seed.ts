import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES = [
  { id: "receivers", nameAr: "رسيفرات وأجهزة استقبال", tintColor: "#0B3C82", imageUrl: "/assets/categories/cat-receivers.jpg" },
  { id: "androidtv", nameAr: "أجهزة أندرويد TV", tintColor: "#0E4A9E" },
  { id: "screens", nameAr: "تلفزيونات وشاشات", tintColor: "#0F3E6E" },
  { id: "remotes", nameAr: "ريموتات", tintColor: "#12557E", imageUrl: "/assets/categories/cat-mini.jpg" },
  { id: "tvacc", nameAr: "حوامل وإكسسوارات تلفزيون", tintColor: "#0E7490" },
  { id: "cables", nameAr: "كيبلات ومحوّلات", tintColor: "#155E75" },
  { id: "audio", nameAr: "سماعات وصوتيات", tintColor: "#1B4F8A" },
  { id: "cooling", nameAr: "مراوح وتبريد ومكيفات", tintColor: "#0891B2" },
  { id: "home", nameAr: "أجهزة منزلية صغيرة", tintColor: "#2A4E7C" },
  { id: "care", nameAr: "أجهزة العناية الشخصية", tintColor: "#3E5A8A" },
  { id: "clocks", nameAr: "ساعات رقمية وراديو", tintColor: "#1D5FA8" },
  { id: "pest", nameAr: "أجهزة مكافحة الحشرات", tintColor: "#166534" },
];

const BRANDS = [
  { id: "smart-line", nameAr: "Smart Line", description: "رسيفرات · ريموتات · ملحقات" },
  { id: "qubit", nameAr: "QUBIT", description: "أندرويد TV · إكسسوارات" },
  { id: "maxsound", nameAr: "MAXSOUND", description: "سماعات · ساوند بار" },
  { id: "novalink", nameAr: "NOVALINK", description: "كيبلات · محوّلات" },
  { id: "oryx", nameAr: "ORYX", description: "ريموتات · أجهزة صغيرة" },
  { id: "betahome", nameAr: "BETA HOME", description: "إلكترونيات منزلية" },
  { id: "sereen", nameAr: "SEREEN", description: "مراوح · تبريد" },
  { id: "neotec", nameAr: "NEOTEC", description: "أجهزة صغيرة" },
];

interface SeedProduct {
  id: string;
  nameAr: string;
  brand: string;
  catId: string;
  spec: string;
  price: number;
  old?: number;
  badge?: "OFFER" | "HOT" | "NEW" | "LOW" | "OUT" | "PICK";
  quantity: number;
  hasImage: boolean;
}

const PRODUCTS: SeedProduct[] = [
  { id: "k800", nameAr: "رسيفر Smart Line HYPER K800 5G", brand: "smart-line", catId: "receivers", spec: "Full HD · واي فاي 5G مدمج · IPTV", price: 42, old: 49, badge: "OFFER", quantity: 40, hasImage: true },
  { id: "k000", nameAr: "رسيفر Smart Line HYPER K000 5G", brand: "smart-line", catId: "receivers", spec: "ميني · واي فاي 5G · مخرج HDMI", price: 24.5, badge: "HOT", quantity: 35, hasImage: true },
  { id: "k300", nameAr: "رسيفر Smart Line HYPER K300", brand: "smart-line", catId: "receivers", spec: "ميني · USB WiFi · 1080p", price: 21, old: 24, badge: "OFFER", quantity: 30, hasImage: true },
  { id: "k220s", nameAr: "رسيفر Smart Line HYPER K220-S", brand: "smart-line", catId: "receivers", spec: "ميني · منفذَي USB · IPTV", price: 19.75, badge: "NEW", quantity: 22, hasImage: true },
  { id: "k220", nameAr: "رسيفر Smart Line HYPER K220", brand: "smart-line", catId: "receivers", spec: "ميني · 1080p · قارئ بطاقات", price: 18.5, quantity: 18, hasImage: true },
  { id: "k150", nameAr: "رسيفر Smart Line HYPER K150", brand: "smart-line", catId: "receivers", spec: "تصميم مدمج · USB WiFi · 1080p", price: 16.9, badge: "HOT", quantity: 26, hasImage: true },
  { id: "k100", nameAr: "رسيفر Smart Line HYPER K100", brand: "smart-line", catId: "receivers", spec: "ميني · HDMI · مشغّل وسائط USB", price: 15.5, badge: "LOW", quantity: 4, hasImage: true },
  { id: "k2", nameAr: "رسيفر Smart Line K2", brand: "smart-line", catId: "receivers", spec: "ميني · 1080p · تحديث USB", price: 13.9, old: 16, badge: "OFFER", quantity: 15, hasImage: true },
  { id: "k3", nameAr: "رسيفر Smart Line K3", brand: "smart-line", catId: "receivers", spec: "ميني · 1080p · مخرج AV", price: 14.5, badge: "OUT", quantity: 0, hasImage: true },
  { id: "rc-org", nameAr: "ريموت أصلي بديل لأجهزة Smart Line", brand: "smart-line", catId: "remotes", spec: "متوافق مع سلسلة HYPER كاملة", price: 4.5, badge: "HOT", quantity: 80, hasImage: false },
  { id: "rc-uni", nameAr: "ريموت يونيفرسال للتلفزيونات", brand: "oryx", catId: "remotes", spec: "يدعم أكثر من ٢٠٠ موديل", price: 3.9, quantity: 60, hasImage: false },
  { id: "hdmi", nameAr: "كيبل HDMI 4K بطول ٣ متر", brand: "novalink", catId: "cables", spec: "نحاس مجدول · 2.0 · 18Gbps", price: 3.25, old: 4.5, badge: "OFFER", quantity: 100, hasImage: false },
  { id: "rg6", nameAr: "كيبل ساتلايت RG6 — لفة ١٠ متر", brand: "novalink", catId: "cables", spec: "عزل مزدوج · مع وصلات F", price: 6.5, quantity: 70, hasImage: false },
  { id: "psu", nameAr: "محوّل طاقة 12V — 2A", brand: "novalink", catId: "cables", spec: "حماية من التماس · مناسب للرسيفرات", price: 5, quantity: 90, hasImage: false },
  { id: "box", nameAr: "جهاز أندرويد TV بذاكرة 4/32", brand: "qubit", catId: "androidtv", spec: "4K · أندرويد 12 · واي فاي مزدوج", price: 55, old: 62, badge: "OFFER", quantity: 20, hasImage: false },
  { id: "spk", nameAr: "سماعة بلوتوث محمولة 10W", brand: "maxsound", catId: "audio", spec: "بطارية ٨ ساعات · مقاومة للرشّ", price: 22, badge: "NEW", quantity: 33, hasImage: false },
  { id: "sound", nameAr: "ساوند بار للتلفزيون 60W", brand: "maxsound", catId: "audio", spec: "بلوتوث · HDMI ARC · ريموت", price: 78, quantity: 12, hasImage: false },
  { id: "mount", nameAr: "حمّالة تلفزيون ثابتة 32–65 بوصة", brand: "betahome", catId: "tvacc", spec: "حديد مقوّى · تتحمل حتى ٤٥ كغم", price: 8.75, quantity: 40, hasImage: false },
  { id: "fan", nameAr: "مروحة عمودية 16 بوصة — ٣ سرعات", brand: "sereen", catId: "cooling", spec: "تحكّم بالارتفاع · هزّاز أوتوماتيكي", price: 27.5, badge: "NEW", quantity: 24, hasImage: false },
  { id: "cooler", nameAr: "مبرّد هواء منزلي 60 لتر", brand: "sereen", catId: "cooling", spec: "خزان ماء · ريموت · موفّر للطاقة", price: 119, old: 135, badge: "OFFER", quantity: 8, hasImage: false },
  { id: "kettle", nameAr: "غلاية كهربائية 1.8 لتر", brand: "betahome", catId: "home", spec: "ستانلس ستيل · فصل تلقائي", price: 12.9, quantity: 45, hasImage: false },
  { id: "blend", nameAr: "خلاط كهربائي 500 واط", brand: "betahome", catId: "home", spec: "وعاء زجاجي · سرعتان + نبض", price: 24, badge: "LOW", quantity: 3, hasImage: false },
  { id: "trim", nameAr: "ماكينة حلاقة وتنعيم قابلة للشحن", brand: "neotec", catId: "care", spec: "شفرات ستانلس · ٤ أمشاط", price: 16.5, badge: "HOT", quantity: 28, hasImage: false },
  { id: "clock", nameAr: "ساعة رقمية بمنبّه وراديو FM", brand: "oryx", catId: "clocks", spec: "شاشة LED · بطارية احتياطية", price: 8.9, quantity: 36, hasImage: false },
  { id: "pest", nameAr: "جهاز طارد للحشرات كهربائي", brand: "oryx", catId: "pest", spec: "تغطية حتى ٤٠ م² · بدون روائح", price: 6.75, quantity: 50, hasImage: false },
  { id: "tv43", nameAr: "شاشة سمارت 43 بوصة Full HD", brand: "qubit", catId: "screens", spec: "أندرويد · واي فاي · ٣ مداخل HDMI", price: 195, badge: "PICK", quantity: 10, hasImage: false },
];

async function main() {
  console.log("Seeding categories...");
  const categoryMap = new Map<string, string>();
  for (const [i, c] of CATEGORIES.entries()) {
    const row = await prisma.category.upsert({
      where: { slug: c.id },
      create: { slug: c.id, nameAr: c.nameAr, tintColor: c.tintColor, imageUrl: c.imageUrl, displayOrder: i },
      update: { nameAr: c.nameAr, tintColor: c.tintColor, imageUrl: c.imageUrl, displayOrder: i },
    });
    categoryMap.set(c.id, row.id);
  }

  console.log("Seeding brands...");
  const brandMap = new Map<string, string>();
  for (const [i, b] of BRANDS.entries()) {
    const row = await prisma.brand.upsert({
      where: { slug: b.id },
      create: { slug: b.id, nameAr: b.nameAr, nameEn: b.id.toUpperCase(), description: b.description, isFeatured: i < 4, displayOrder: i },
      update: { nameAr: b.nameAr, description: b.description, displayOrder: i },
    });
    brandMap.set(b.id, row.id);
  }

  console.log("Seeding products...");
  for (const [i, p] of PRODUCTS.entries()) {
    const categoryId = categoryMap.get(p.catId)!;
    const brandId = brandMap.get(p.brand)!;
    const product = await prisma.product.upsert({
      where: { sku: `IV-${p.id.toUpperCase()}` },
      create: {
        nameAr: p.nameAr,
        slug: p.id,
        sku: `IV-${p.id.toUpperCase()}`,
        categoryId,
        brandId,
        shortSpec: p.spec,
        description: p.spec,
        price: p.price,
        oldPrice: p.old ?? null,
        quantity: p.quantity,
        badge: p.badge ?? "NONE",
        needsImage: !p.hasImage,
        displayOrder: i,
        isFeatured: i < 8,
      },
      update: {
        nameAr: p.nameAr,
        shortSpec: p.spec,
        price: p.price,
        oldPrice: p.old ?? null,
        quantity: p.quantity,
        badge: p.badge ?? "NONE",
        needsImage: !p.hasImage,
      },
    });

    if (p.hasImage) {
      const existing = await prisma.productImage.findFirst({ where: { productId: product.id } });
      if (!existing) {
        await prisma.productImage.create({
          data: { productId: product.id, url: `/assets/products/${p.id}.png`, isPrimary: true, sortOrder: 0 },
        });
      }
    }
  }

  console.log("Seeding delivery methods & zones...");
  const deliveryMethod = await prisma.deliveryMethod.upsert({
    where: { id: "delivery-standard" },
    create: { id: "delivery-standard", kind: "DELIVERY", nameAr: "توصيل عادي", estimatedTimeAr: "1-2 يوم عمل" },
    update: {},
  });
  const pickupMethod = await prisma.deliveryMethod.upsert({
    where: { id: "pickup-store" },
    create: {
      id: "pickup-store",
      kind: "PICKUP",
      nameAr: "استلام من المتجر",
      pickupAddress: "عمّان — مرج الحمام، إسكان عالية — مقابل شركة أورنج",
      pickupPrepMinutes: 60,
    },
    update: {},
  });

  const zones = [
    { name: "عمّان", fee: 3 },
    { name: "سحاب / عين الباشا / البقعة", fee: 4 },
    { name: "باقي المحافظات", fee: 5 },
  ];
  for (const [i, z] of zones.entries()) {
    await prisma.deliveryZone.upsert({
      where: { id: `zone-${i}` },
      create: { id: `zone-${i}`, deliveryMethodId: deliveryMethod.id, nameAr: z.name, fee: z.fee, displayOrder: i },
      update: { nameAr: z.name, fee: z.fee },
    });
  }
  await prisma.deliveryZone.upsert({
    where: { id: "zone-pickup" },
    create: { id: "zone-pickup", deliveryMethodId: pickupMethod.id, nameAr: "استلام من المتجر", fee: 0, displayOrder: 99 },
    update: {},
  });

  console.log("Seeding payment methods...");
  const payments = [
    { id: "cod", nameAr: "الدفع عند الاستلام", description: "ادفع نقداً عند استلام الطلب" },
    { id: "cliq", nameAr: "تحويل CliQ", description: "حوّل المبلغ عبر خدمة CliQ" },
    { id: "bank", nameAr: "تحويل بنكي", description: "تحويل مباشر إلى حساب المتجر" },
  ];
  for (const [i, p] of payments.entries()) {
    await prisma.paymentMethod.upsert({
      where: { id: p.id },
      create: { id: p.id, nameAr: p.nameAr, description: p.description, displayOrder: i },
      update: { nameAr: p.nameAr, description: p.description },
    });
  }

  console.log("Seeding opening hours...");
  const hours = [
    { day: 0, closed: false, opens: "10:00", closes: "21:00" }, // Sunday
    { day: 1, closed: false, opens: "10:00", closes: "21:00" },
    { day: 2, closed: false, opens: "10:00", closes: "21:00" },
    { day: 3, closed: false, opens: "10:00", closes: "21:00" },
    { day: 4, closed: false, opens: "10:00", closes: "22:00" }, // Thursday
    { day: 5, closed: true, opens: null, closes: null }, // Friday
    { day: 6, closed: false, opens: "10:00", closes: "21:00" },
  ];
  for (const h of hours) {
    const existing = await prisma.openingHour.findFirst({ where: { dayOfWeek: h.day } });
    if (!existing) {
      await prisma.openingHour.create({ data: { dayOfWeek: h.day, isClosed: h.closed, opensAt: h.opens, closesAt: h.closes } });
    }
  }

  console.log("Seeding policies...");
  const policies = [
    { slug: "delivery", titleAr: "سياسة التوصيل", bodyAr: "نوفر توصيلاً لجميع مناطق المملكة خلال 1-2 يوم عمل. يمكن أيضاً الاستلام من المتجر." },
    { slug: "payment", titleAr: "طرق الدفع", bodyAr: "الدفع عند الاستلام، تحويل CliQ، أو تحويل بنكي مباشر." },
    { slug: "returns", titleAr: "سياسة الاستبدال والإرجاع", bodyAr: "يمكن استبدال أو إرجاع المنتج خلال 7 أيام من الاستلام بشرط أن يكون بحالته الأصلية." },
    { slug: "privacy", titleAr: "سياسة الخصوصية", bodyAr: "نحافظ على خصوصية بيانات عملائنا ولا نشاركها مع أي طرف ثالث دون موافقة." },
    { slug: "terms", titleAr: "الشروط والأحكام", bodyAr: "باستخدامك لموقع Smart Line فإنك توافق على الشروط والأحكام العامة للتسوق." },
  ];
  for (const p of policies) {
    await prisma.policyPage.upsert({ where: { slug: p.slug }, create: p, update: { titleAr: p.titleAr, bodyAr: p.bodyAr } });
  }

  console.log("Seeding FAQs...");
  const faqs = [
    { q: "كم مدة التوصيل؟", a: "عادة يوم إلى يومي عمل داخل الأردن." },
    { q: "هل يوجد ضمان على الأجهزة؟", a: "نعم، جميع أجهزة Smart Line مشمولة بضمان الوكيل." },
    { q: "هل يمكن الدفع عند الاستلام؟", a: "نعم، بالإضافة إلى CliQ والتحويل البنكي." },
  ];
  for (const [i, f] of faqs.entries()) {
    const existing = await prisma.faqItem.findFirst({ where: { questionAr: f.q } });
    if (!existing) {
      await prisma.faqItem.create({ data: { questionAr: f.q, answerAr: f.a, displayOrder: i } });
    }
  }

  console.log("Seeding hero slide & store settings...");
  const existingHero = await prisma.heroSlide.findFirst();
  if (!existingHero) {
    await prisma.heroSlide.create({
      data: {
        titleAr: "أجهزة استقبال وإلكترونيات منزلية بأفضل الأسعار",
        subtitleAr: "توصيل لجميع مناطق المملكة، وضمان الوكيل على جميع أجهزة Smart Line",
        ctaLabel: "تسوّق الآن",
        ctaUrl: "/shop",
        imageUrl: "/assets/smart-line-receivers-group.jpg",
        displayOrder: 0,
      },
    });
  }

  console.log("Seeding homepage sections...");
  const sections = [
    { key: "categories", titleAr: "تسوّق حسب القسم", isEnabled: true, displayOrder: 1, config: { limit: 12 } },
    { key: "featured_products", titleAr: "منتجات مميزة", isEnabled: true, displayOrder: 2, config: { limit: 8, mode: "auto" } },
    { key: "banners", titleAr: "عروض وبانرات", isEnabled: true, displayOrder: 3, config: {} },
    { key: "campaigns", titleAr: "حملات وعروض موسمية", isEnabled: true, displayOrder: 4, config: {} },
    { key: "reviews", titleAr: "آراء عملائنا", isEnabled: true, displayOrder: 5, config: { limit: 6 } },
  ];
  for (const s of sections) {
    await prisma.homepageSection.upsert({
      where: { key: s.key },
      create: s,
      update: { titleAr: s.titleAr, displayOrder: s.displayOrder },
    });
  }

  console.log("Seeding sample reviews...");
  const existingReview = await prisma.review.findFirst();
  if (!existingReview) {
    await prisma.review.createMany({
      data: [
        { authorName: "محمد العلي", rating: 5, bodyAr: "خدمة ممتازة وتوصيل سريع، الرسيفر يعمل بشكل رائع.", isApproved: true, isFeatured: true },
        { authorName: "سارة أحمد", rating: 4, bodyAr: "جودة جيدة وأسعار مناسبة، تجربة شراء موثوقة.", isApproved: true },
      ],
    });
  }

  await prisma.storeSetting.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      data: {
        storeNameAr: "آي فيغا",
        storeNameEn: "Smart Line",
        whatsappNumber: "962795718978",
        whatsappDisplayNumber: "+962 79 571 8978",
        contactPhoneInternational: "+962795718978",
        contactPhoneDisplay: "+962 79 571 8978",
        addressAr: "عمّان — مرج الحمام، إسكان عالية — مقابل شركة أورنج",
      },
    },
    update: {},
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
