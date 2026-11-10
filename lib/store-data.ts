import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { productDetails as productDetailsTable, products as productsTable, siteContent } from "@/db/schema";

export type StoreContent = {
  heroEyebrow: string;
  heroTitle: string;
  heroAccent: string;
  heroDescription: string;
  curadoriaTitle: string;
  curadoriaDescription: string;
  announcement: string;
  themeAccent: string;
  themeBackground: string;
  themeSurface: string;
};

export type StoreProduct = {
  id: string;
  sku: string;
  name: string;
  category: string;
  tag: string;
  description: string;
  imageUrl: string;
  keywords: string;
  occasions: string[];
  sortOrder: number;
  active: boolean;
} & ProductExtras;

// Campos da página de produto (tabela product_details). Vazios = "sob consulta".
export type ProductExtras = {
  price: string;
  sizes: string[];
  gallery: string[];
  details: string;
};


const emptyExtras: ProductExtras = { price: "", sizes: [], gallery: [], details: "" };

export const defaultContent: StoreContent = {
  heroEyebrow: "Coleção Paula Miranda",
  heroTitle: "Vista a sua",
  heroAccent: "melhor versão.",
  heroDescription: "Uma curadoria feminina, elegante e descomplicada para todos os seus momentos.",
  curadoriaTitle: "Conte o que você procura. A gente monta o caminho.",
  curadoriaDescription: "Em menos de um minuto, descubra as peças da coleção que mais combinam com seu pedido.",
  announcement: "Atendimento personalizado pelo WhatsApp • Retire em São José dos Campos • Envio combinado com a equipe",
  themeAccent: "#d6a2aa",
  themeBackground: "#f8f5ef",
  themeSurface: "#e8dfd1",
};

const adminEditableContentKeys = new Set<keyof StoreContent>([
  "heroEyebrow",
  "heroTitle",
  "heroAccent",
  "heroDescription",
  "curadoriaTitle",
  "curadoriaDescription",
  "announcement",
  "themeAccent",
  "themeBackground",
  "themeSurface",
]);

const colorContentKeys = new Set<keyof StoreContent>(["themeAccent", "themeBackground", "themeSurface"]);

const baseProducts: Omit<StoreProduct, keyof ProductExtras>[] = [
  { id: "cacau", sku: "CPM-01", name: "Conjunto Cacau & Areia", category: "conjuntos", tag: "Look completo", description: "Uma composição feminina em tons terrosos para um visual marcante.", imageUrl: "/assets/look-01-960.webp", keywords: "marrom bege saia conjunto", occasions: ["dia", "especial"], sortOrder: 1, active: true },
  { id: "rosa", sku: "CPM-02", name: "Cropped Rosa Halter", category: "croppeds", tag: "Novidade", description: "Um cropped de presença para renovar combinações com jeans e alfaiataria.", imageUrl: "/assets/look-03-960.webp", keywords: "rosa top cropped jeans", occasions: ["dia", "especial"], sortOrder: 2, active: true },
  { id: "preto", sku: "CPM-04", name: "Blusa Essential Preta", category: "blusas", tag: "Mais escolhido", description: "Uma base preta versátil para produções do trabalho ao encontro.", imageUrl: "/assets/look-05-960.webp", keywords: "preto blusa basica calca", occasions: ["trabalho", "especial"], sortOrder: 3, active: true },
  { id: "solar", sku: "CPM-05", name: "Vestido Amarelo Solar", category: "vestidos", tag: "Destaque", description: "Vestido longo com movimento para ocasiões que pedem presença.", imageUrl: "/assets/look-06-960.webp", keywords: "vestido longo amarelo festa", occasions: ["especial"], sortOrder: 4, active: true },
  { id: "marinho", sku: "CPM-07", name: "Blusa Laço Marinho", category: "blusas", tag: "Elegante", description: "Blusa marinho com detalhe de laço para uma elegância atual.", imageUrl: "/assets/look-08-960.webp", keywords: "azul marinho blusa laco", occasions: ["trabalho", "especial"], sortOrder: 5, active: true },
  { id: "denim", sku: "CPM-08", name: "Jeans Azul Atual", category: "jeans", tag: "Curadoria CPM", description: "Jeans de modelagem atual para multiplicar as combinações do closet.", imageUrl: "/assets/look-09-960.webp", keywords: "calca jeans azul denim", occasions: ["dia", "trabalho"], sortOrder: 6, active: true },
  { id: "laise", sku: "CPM-10", name: "Blusa Laise Azul Céu", category: "blusas", tag: "Detalhes", description: "Textura em laise e tom azul claro para produções leves.", imageUrl: "/assets/look-12-960.webp", keywords: "azul claro laise bordado blusa", occasions: ["dia", "especial"], sortOrder: 7, active: true },
];

export const defaultProducts: StoreProduct[] = baseProducts.map(product => ({ ...product, ...emptyExtras }));

// O painel usa includeInactive para listar produtos desativados e permitir reativá-los.
export async function getStoreData({ includeInactive = false } = {}): Promise<{ content: StoreContent; products: StoreProduct[] }> {
  try {
    const db = getDb();
    const [contentRows, productRows] = await Promise.all([
      db.select().from(siteContent),
      // Busca também os inativos: eles precisam sobrescrever os produtos padrão de mesmo id.
      db.select().from(productsTable).orderBy(asc(productsTable.sortOrder)),
    ]);
    const content = { ...defaultContent };
    for (const row of contentRows) {
      if (row.key in content) (content as Record<string, string>)[row.key] = row.value;
    }
    const productMap = new Map(defaultProducts.map(product => [product.id, product]));
    for (const row of productRows) {
      productMap.set(row.id, { ...row, ...emptyExtras, occasions: parseList(row.occasions) });
    }
    const extras = await getProductExtras();
    for (const [id, extra] of extras) {
      const product = productMap.get(id);
      if (product) productMap.set(id, { ...product, ...extra });
    }
    const products = [...productMap.values()].filter(product => includeInactive || product.active).sort((a, b) => a.sortOrder - b.sortOrder);
    return { content, products };
  } catch (error) {
    console.error("Store data fallback", error);
    return { content: defaultContent, products: defaultProducts.filter(product => includeInactive || product.active) };
  }
}

export async function saveContent(values: Partial<StoreContent>, userId: string) {
  const db = getDb();
  const now = new Date().toISOString();
  for (const [key, value] of Object.entries(values)) {
    const typedKey = key as keyof StoreContent;
    if (!adminEditableContentKeys.has(typedKey) || typeof value !== "string") continue;
    if (colorContentKeys.has(typedKey) && !/^#[0-9a-fA-F]{6}$/.test(value)) continue;
    await db.insert(siteContent).values({ key, value: value.slice(0, 600), updatedAt: now, updatedBy: userId })
      .onConflictDoUpdate({ target: siteContent.key, set: { value: value.slice(0, 600), updatedAt: now, updatedBy: userId } });
  }
}

// Lê a tabela product_details. Se ela ainda não existir no banco, devolve vazio e a loja segue normal.
async function getProductExtras(): Promise<Map<string, ProductExtras>> {
  const extras = new Map<string, ProductExtras>();
  try {
    const rows = await getDb().select().from(productDetailsTable);
    for (const row of rows) {
      extras.set(row.productId, { price: row.price, sizes: parseList(row.sizes), gallery: parseList(row.gallery), details: row.details });
    }
  } catch (error) {
    console.error("Product details unavailable", error);
  }
  return extras;
}

function parseList(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(item => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export async function getProduct(id: string) {
  const { products, content } = await getStoreData();
  return { product: products.find(product => product.id === id), products, content };
}

// Devolve false se só os dados principais foram salvos (tabela product_details indisponível).
export async function saveProduct(product: StoreProduct, userId: string): Promise<boolean> {
  const db = getDb();
  const now = new Date().toISOString();
  const { price, sizes, gallery, details, ...core } = product;
  const coreValues = { ...core, occasions: JSON.stringify(core.occasions), updatedAt: now, updatedBy: userId };
  await db.insert(productsTable).values(coreValues).onConflictDoUpdate({ target: productsTable.id, set: coreValues });
  try {
    const extraValues = { price, sizes: JSON.stringify(sizes), gallery: JSON.stringify(gallery), details, updatedAt: now, updatedBy: userId };
    await db.insert(productDetailsTable).values({ productId: product.id, ...extraValues })
      .onConflictDoUpdate({ target: productDetailsTable.productId, set: extraValues });
    return true;
  } catch (error) {
    console.error("Product details not saved", error);
    return false;
  }
}
