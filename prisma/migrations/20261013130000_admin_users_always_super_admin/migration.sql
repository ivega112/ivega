-- All dashboard users now share the same full administrative permission level.
UPDATE "store"."AdminUser" SET "role" = 'SUPER_ADMIN', "isActive" = true;
ALTER TABLE "store"."AdminUser" ALTER COLUMN "role" SET DEFAULT 'SUPER_ADMIN';
