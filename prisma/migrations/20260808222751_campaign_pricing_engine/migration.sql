/*
  Warnings:

  - You are about to drop the column `discountLabel` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `displayLocation` on the `Campaign` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Campaign` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Campaign` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CampaignDiscountMode" AS ENUM ('PERCENTAGE', 'FINAL_PRICE');

-- CreateEnum
CREATE TYPE "CampaignPlacement" AS ENUM ('HOMEPAGE_HERO', 'HOMEPAGE_SECTION', 'SHOP', 'CATEGORY_PAGE', 'BRAND_PAGE', 'PRODUCT_PAGE', 'BANNER');

-- AlterTable
ALTER TABLE "Campaign" DROP COLUMN "discountLabel",
DROP COLUMN "displayLocation",
DROP COLUMN "isActive",
ADD COLUMN     "badgeText" TEXT,
ADD COLUMN     "bannerImageUrl" TEXT,
ADD COLUMN     "ctaLabel" TEXT,
ADD COLUMN     "ctaUrl" TEXT,
ADD COLUMN     "discountMode" "CampaignDiscountMode" NOT NULL DEFAULT 'PERCENTAGE',
ADD COLUMN     "discountPercentage" DECIMAL(5,2),
ADD COLUMN     "isEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mobileBannerImageUrl" TEXT,
ADD COLUMN     "placements" "CampaignPlacement"[],
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "promoTextAr" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "CampaignBrand" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,

    CONSTRAINT "CampaignBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignProductPrice" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "finalPrice" DECIMAL(10,3) NOT NULL,

    CONSTRAINT "CampaignProductPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CampaignBrand_campaignId_brandId_key" ON "CampaignBrand"("campaignId", "brandId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignProductPrice_campaignId_productId_key" ON "CampaignProductPrice"("campaignId", "productId");

-- CreateIndex
CREATE INDEX "Campaign_isEnabled_startsAt_endsAt_idx" ON "Campaign"("isEnabled", "startsAt", "endsAt");

-- AddForeignKey
ALTER TABLE "CampaignCategory" ADD CONSTRAINT "CampaignCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignBrand" ADD CONSTRAINT "CampaignBrand_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignBrand" ADD CONSTRAINT "CampaignBrand_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignProductPrice" ADD CONSTRAINT "CampaignProductPrice_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignProductPrice" ADD CONSTRAINT "CampaignProductPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
