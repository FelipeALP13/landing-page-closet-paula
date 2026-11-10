import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const siteContent = sqliteTable("site_content", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
  updatedBy: text("updated_by").notNull(),
});

// Dados extras da página de produto. Ficam numa tabela separada para que, se ela ainda
// não existir no banco, a vitrine continue funcionando só com a tabela `products`.
export const productDetails = sqliteTable("product_details", {
  productId: text("product_id").primaryKey(),
  price: text("price").notNull().default(""),
  sizes: text("sizes").notNull().default("[]"),
  gallery: text("gallery").notNull().default("[]"),
  details: text("details").notNull().default(""),
  updatedAt: text("updated_at").notNull(),
  updatedBy: text("updated_by").notNull(),
});

// Contagem anônima de toques nos botões de WhatsApp, por peça e por dia (product_id "" = contato geral).
// Não guarda nada sobre quem clicou.
export const whatsappClicks = sqliteTable("whatsapp_clicks", {
  productId: text("product_id").notNull(),
  day: text("day").notNull(),
  clicks: integer("clicks").notNull().default(0),
}, table => [primaryKey({ columns: [table.productId, table.day] })]);

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
