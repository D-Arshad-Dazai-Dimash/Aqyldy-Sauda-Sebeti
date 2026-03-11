CREATE TABLE users (
                       id UUID PRIMARY KEY,
                       email VARCHAR(255) UNIQUE NOT NULL,
                       password_hash VARCHAR(255) NOT NULL,
                       role VARCHAR(20) NOT NULL,
                       enabled BOOLEAN NOT NULL DEFAULT true,
                       created_at TIMESTAMP NOT NULL,
                       updated_at TIMESTAMP
);

CREATE TABLE stores (
                        id UUID PRIMARY KEY,
                        name VARCHAR(200) NOT NULL,
                        address VARCHAR(300),
                        active BOOLEAN NOT NULL DEFAULT true,
                        created_at TIMESTAMP NOT NULL,
                        updated_at TIMESTAMP
);

CREATE TABLE categories (
                            id UUID PRIMARY KEY,
                            name VARCHAR(150) NOT NULL
);

CREATE TABLE products (
                          id UUID PRIMARY KEY,
                          title VARCHAR(180) NOT NULL,
                          description TEXT,
                          price DECIMAL(12,2) NOT NULL,
                          barcode VARCHAR(64) UNIQUE,
                          stock INT NOT NULL DEFAULT 0,
                          discount DECIMAL(5,2),
                          image_url TEXT,
                          active BOOLEAN NOT NULL DEFAULT true,
                          created_at TIMESTAMP NOT NULL,
                          updated_at TIMESTAMP
);

CREATE TABLE product_categories (
                                    product_id UUID NOT NULL,
                                    category_id UUID NOT NULL,

                                    PRIMARY KEY (product_id, category_id),

                                    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                                    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE inventory (
                           store_id UUID NOT NULL,
                           product_id UUID NOT NULL,
                           quantity INT NOT NULL,
                           updated_at TIMESTAMP,

                           PRIMARY KEY (store_id, product_id),

                           FOREIGN KEY (store_id) REFERENCES stores(id),
                           FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE carts (
                       id UUID PRIMARY KEY,
                       user_id UUID NOT NULL,
                       store_id UUID NOT NULL,

                       FOREIGN KEY (user_id) REFERENCES users(id),
                       FOREIGN KEY (store_id) REFERENCES stores(id)
);

CREATE TABLE cart_items (
                            id UUID PRIMARY KEY,
                            cart_id UUID NOT NULL,
                            product_id UUID NOT NULL,
                            quantity INT NOT NULL,
                            created_at TIMESTAMP NOT NULL,
                            updated_at TIMESTAMP,

                            FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
                            FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE orders (
                        id UUID PRIMARY KEY,
                        user_id UUID NOT NULL,
                        store_id UUID NOT NULL,
                        status VARCHAR(50) NOT NULL,
                        total_amount DECIMAL(12,2) NOT NULL,
                        comment TEXT,
                        created_at TIMESTAMP NOT NULL,
                        updated_at TIMESTAMP,

                        FOREIGN KEY (user_id) REFERENCES users(id),
                        FOREIGN KEY (store_id) REFERENCES stores(id)
);

CREATE TABLE order_items (
                             id UUID PRIMARY KEY,
                             order_id UUID NOT NULL,
                             product_id UUID NOT NULL,
                             quantity INT NOT NULL,
                             price DECIMAL(12,2) NOT NULL,
                             line_total DECIMAL(12,2) NOT NULL,
                             created_at TIMESTAMP NOT NULL,

                             FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                             FOREIGN KEY (product_id) REFERENCES products(id)
);

INSERT INTO stores (id, name, address, active, created_at)
VALUES
    (gen_random_uuid(), 'Magnum', 'Almaty', true, now()),
    (gen_random_uuid(), 'Small', 'Almaty', true, now()),
    (gen_random_uuid(), 'FixPrice', 'Almaty', true, now());

INSERT INTO categories (id, name)
VALUES
    (gen_random_uuid(), 'Dairy'),
    (gen_random_uuid(), 'Meat'),
    (gen_random_uuid(), 'Fruits'),
    (gen_random_uuid(), 'Vegetables'),
    (gen_random_uuid(), 'Drinks');

INSERT INTO products (id, title, description, price, barcode, stock, created_at)
VALUES
    (gen_random_uuid(), 'Milk 1L', 'Fresh milk', 450, '111111', 100, now()),
    (gen_random_uuid(), 'Bread', 'White bread', 250, '222222', 100, now()),
    (gen_random_uuid(), 'Apple', 'Red apple', 600, '333333', 100, now()),
    (gen_random_uuid(), 'Chicken', 'Chicken meat', 1800, '444444', 100, now()),
    (gen_random_uuid(), 'Cola', 'Coca cola', 550, '555555', 100, now());

INSERT INTO inventory (store_id, product_id, quantity)
SELECT s.id, p.id, 50
FROM stores s
         CROSS JOIN products p;

