import { categories } from "@/lib/categories";
import { getStoreData } from "@/lib/store-data";
import { productPath } from "@/lib/store-info";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const { products } = await getStoreData();
  const paths = ["/", ...categories.map(category => `/categoria/${category.slug}`), ...products.map(product => productPath(product.id)), "/informacoes"];
  const urls = paths.map(path => `  <url><loc>${origin}${path}</loc></url>`).join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(body, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
