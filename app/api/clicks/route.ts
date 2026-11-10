import { recordClick } from "@/lib/click-stats";

// Recebe um toque em botão de WhatsApp. Público e anônimo: só aceita o id da peça (ou vazio).
export async function POST(request: Request) {
  try {
    const body = await request.json() as { productId?: unknown };
    const productId = typeof body.productId === "string" ? body.productId : "";
    if (productId && !/^[a-z0-9][a-z0-9-]{0,79}$/.test(productId)) return new Response(null, { status: 400 });
    await recordClick(productId);
  } catch (error) {
    // Se a tabela não existir ainda, o site segue normal; só não conta.
    console.error("Click not recorded", error);
  }
  return new Response(null, { status: 204 });
}
