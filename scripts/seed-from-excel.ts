import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

function generateSlug(text: string): string {
    return text.toString().toLowerCase().trim().replace(/[\s\W-]+/g, "-").replace(/^-+|-+$/g, "");
}

async function main() {
    console.log("Reading excel JSON data...");
    const data = JSON.parse(fs.readFileSync("/home/moayad/Desktop/smart-line/excel-data.json", "utf-8"));
    
    // 1. Seed Brands
    console.log("Seeding Brands...");
    const brandsMap = new Map();
    for (const b of data['شركات']) {
        if (!b['اسم الشركة']) continue;
        const name = String(b['اسم الشركة']);
        const slug = b['Slug'] || generateSlug(name);
        // Map the old asset path to the new one
        let logoUrl = b['اللوغو الحالي'];
        if (logoUrl && logoUrl.startsWith('/assets/brands/')) {
            logoUrl = logoUrl.replace('/assets/brands/', '/images/brands/');
        }

        const brand = await prisma.brand.create({
            data: {
                nameAr: name,
                slug: slug,
                logoUrl: logoUrl !== "—" ? logoUrl : null,
                isVisible: true
            }
        });
        brandsMap.set(name, brand.id);
        console.log(`Created Brand: ${name}`);
    }

    // 2. Seed Categories
    console.log("Seeding Categories...");
    const categoriesMap = new Map();
    for (const c of data['أقسام']) {
        if (!c['اسم القسم'] || String(c['اسم القسم']).includes('إجمالي') || String(c['اسم القسم']).includes('ناقصها') || String(c['اسم القسم']).includes('الأرقام')) continue;
        const name = String(c['اسم القسم']);
        const slug = c['Slug'] || generateSlug(name);
        
        let imageUrl = c['الصورة الحالية'];
        if (imageUrl && imageUrl.startsWith('/assets/categories/')) {
            imageUrl = imageUrl.replace('/assets/categories/', '/images/categories/');
        }

        const category = await prisma.category.create({
            data: {
                nameAr: name,
                slug: slug,
                imageUrl: imageUrl !== "—" ? imageUrl : null,
                isVisible: true
            }
        });
        categoriesMap.set(name, category.id);
        console.log(`Created Category: ${name}`);
    }

    // 3. Seed Products
    console.log("Seeding Products...");
    for (const p of data['منتجات']) {
        if (!p['الاسم'] || String(p['الاسم']).includes('إجمالي') || String(p['الاسم']).includes('ناقصها') || String(p['الاسم']).includes('الأرقام')) continue;
        
        const name = String(p['الاسم']);
        const sku = String(p['SKU']);
        const categoryName = String(p['القسم']);
        const brandName = String(p['الشركة']);
        
        const price = parseFloat(p['السعر (د.أ)']) || 0;
        const oldPrice = parseFloat(p['السعر قبل الخصم']) || undefined;
        const shortDesc = String(p['الوصف المختصر']) !== "nan" ? String(p['الوصف المختصر']) : null;
        
        let imageUrl = p['الصورة الحالية'];
        if (imageUrl && imageUrl.startsWith('/assets/products/')) {
            imageUrl = imageUrl.replace('/assets/products/', '/images/products/');
        }

        await prisma.product.create({
            data: {
                nameAr: name,
                slug: generateSlug(sku),
                sku: sku,
                categoryId: categoriesMap.get(categoryName),
                brandId: brandsMap.get(brandName),
                price: price,
                oldPrice: oldPrice,
                shortSpec: shortDesc,
                images: imageUrl !== "—" ? { create: { url: imageUrl, isPrimary: true } } : undefined,
                isVisible: true
            }
        });
        console.log(`Created Product: ${name}`);
    }
    
    // 4. Update Site Settings Hero
    console.log("Seeding Site Settings Hero...");
    await prisma.storeSetting.create({
        data: {
            data: {
                storeNameAr: "Smart Line",
                homepageMetaTitle: "أجهزة استقبال وإلكترونيات",
                homepageMetaDescription: "أفضل الأجهزة والإلكترونيات من Smart Line",
                logoUrl: "/images/logo/smart-line-logo.png",
                heroImage: "/images/logo/hero-current.jpg"
            }
        }
    });

    console.log("Seeding Completed Successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
