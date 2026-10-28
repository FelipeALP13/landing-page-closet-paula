CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`sku` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`tag` text NOT NULL,
	`description` text NOT NULL,
	`image_url` text NOT NULL,
	`keywords` text NOT NULL,
	`occasions` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_content` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text NOT NULL
);
