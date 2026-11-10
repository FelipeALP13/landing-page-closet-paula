CREATE TABLE `product_details` (
	`product_id` text PRIMARY KEY NOT NULL,
	`price` text DEFAULT '' NOT NULL,
	`sizes` text DEFAULT '[]' NOT NULL,
	`gallery` text DEFAULT '[]' NOT NULL,
	`details` text DEFAULT '' NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text NOT NULL
);
