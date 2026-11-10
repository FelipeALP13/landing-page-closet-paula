CREATE TABLE `whatsapp_clicks` (
	`product_id` text NOT NULL,
	`day` text NOT NULL,
	`clicks` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`product_id`, `day`)
);
