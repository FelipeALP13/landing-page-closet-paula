import { recordClick } from "@/lib/click-stats";
import { defaultProducts, productExists } from "@/lib/store-data";
import { isProductId } from "@/lib/validation";

// Recebe um toque em botão de WhatsApp. Público e anônimo: só aceita o id de uma peça que existe (ou vazio).
export async function POST(request: Request) {
  try {
    const body = await request.json() as { productId?: unknown };
    const productId = typeof body.productId === "string" ? body.productId : "";
    if (productId) {
      if (!isProductId(productId)) return new Response(null, { status: 400 });
      // Evita que alguém encha a tabela com ids inventados.
      const known = defaultProducts.some(product => product.id === productId) || await productExists(productId);
      if (!known) return new Response(null, { status: 404 });
    }
    await recordClick(productId);
  } catch (error) {
    // Se a tabela não existir ainda, o site segue normal; só não conta.
    console.error("Click not recorded", error);
  }
  return new Response(null, { status: 204 });
}
