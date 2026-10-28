import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const siteContent = sqliteTable("site_content", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
  updatedBy: text("updated_by").notNull(),
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  sku: text("sku").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  tag: text("tag").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  keywords: text("keywords").notNull(),
  occasions: text("occasions").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  updatedAt: text("updated_at").notNull(),
  updatedBy: text("updated_by").notNull(),
});
