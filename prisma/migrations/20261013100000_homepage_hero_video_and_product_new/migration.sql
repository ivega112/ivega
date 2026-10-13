-- Review and apply explicitly with: pnpm prisma migrate deploy
-- Adds independently managed "New arrivals" placement and video hero support.
ALTER TABLE "store"."Product" ADD COLUMN "isNew" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "store"."HeroSlide" ALTER COLUMN "imageUrl" DROP NOT NULL;
CREATE TYPE "store"."HeroMediaType" AS ENUM ('IMAGE', 'VIDEO');
ALTER TABLE "store"."HeroSlide" ADD COLUMN "mediaType" "store"."HeroMediaType" NOT NULL DEFAULT 'IMAGE';
ALTER TABLE "store"."HeroSlide" ADD COLUMN "videoUrl" TEXT;

CREATE INDEX "Product_isNew_isVisible_isArchived_idx"
  ON "store"."Product"("isNew", "isVisible", "isArchived");
