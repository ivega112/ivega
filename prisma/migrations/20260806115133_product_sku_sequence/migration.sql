-- Concurrency-safe SKU generation: Postgres SEQUENCE objects are inherently safe under
-- concurrent access (each nextval() call is atomic at the DB level, unlike "count + 1"
-- which can race under simultaneous requests). Used by src/lib/sku.ts to build
-- "IV-P-000001"-style SKUs. Does not touch any existing product row or existing SKU value.
CREATE SEQUENCE IF NOT EXISTS product_sku_seq START WITH 1 INCREMENT BY 1;
