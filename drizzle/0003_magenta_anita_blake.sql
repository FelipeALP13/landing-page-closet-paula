CREATE TABLE `product_status` (
	`product_id` text PRIMARY KEY NOT NULL,
	`on_sale` integer DEFAULT false NOT NULL,
	`sale_price` text DEFAULT '' NOT NULL,
	`sold_out` integer DEFAULT false NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text NOT NULL
);
