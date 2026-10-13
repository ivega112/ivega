import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    await prisma.heroSlide.create({
        data: {
            titleAr: "مرحباً بكم في Smart Line",
            subtitleAr: "أفضل الأجهزة والإلكترونيات بين يديك",
            ctaLabel: "تسوّق الآن",
            ctaUrl: "/shop",
            isActive: true,
            displayOrder: 1,
            imageUrl: "/images/logo/smart-line-logo.png"
        }
    });
    console.log("Hero slide created.");
}
main();
