import "server-only";
import { gte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { whatsappClicks } from "@/db/schema";
import { todayInBrazil } from "@/lib/campaign";

export type ClickStats = {
  available: boolean; // false = tabela ainda não existe no banco
  days: number;
  total: number;
  general: number;
  byProduct: { productId: string; clicks: number }[];
};

// Soma 1 toque no dia de hoje (horário de Brasília). productId "" = contato geral.
export async function recordClick(productId: string) {
  const day = todayInBrazil();
  await getDb().insert(whatsappClicks).values({ productId, day, clicks: 1 })
    .onConflictDoUpdate({ target: [whatsappClicks.productId, whatsappClicks.day], set: { clicks: sql`${whatsappClicks.clicks} + 1` } });
}

export async function getClickStats(days = 30): Promise<ClickStats> {
  const [y, m, d] = todayInBrazil().split("-").map(Number);
  const since = new Date(Date.UTC(y, m - 1, d - (days - 1))).toISOString().slice(0, 10);
  try {
    const rows = await getDb()
      .select({ productId: whatsappClicks.productId, clicks: sql<number>`sum(${whatsappClicks.clicks})` })
      .from(whatsappClicks)
      .where(gte(whatsappClicks.day, since))
      .groupBy(whatsappClicks.productId);
    const general = rows.find(row => row.productId === "")?.clicks ?? 0;
    const byProduct = rows.filter(row => row.productId !== "").map(row => ({ productId: row.productId, clicks: Number(row.clicks) })).sort((a, b) => b.clicks - a.clicks);
    return { available: true, days, general: Number(general), total: Number(general) + byProduct.reduce((sum, row) => sum + row.clicks, 0), byProduct };
  } catch (error) {
    console.error("Click stats unavailable", error);
    return { available: false, days, total: 0, general: 0, byProduct: [] };
  }
}
