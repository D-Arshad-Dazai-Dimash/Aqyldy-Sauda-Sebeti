ALTER TABLE products
    ADD COLUMN barcode varchar(64) UNIQUE;

ALTER TABLE products
    ADD COLUMN stock integer DEFAULT 0 NOT NULL;

ALTER TABLE products
    ADD COLUMN discount numeric(5,2);