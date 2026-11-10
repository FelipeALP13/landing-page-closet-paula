// Avisos da faixa do topo e banner de campanha. Sem dependência de servidor: usado na vitrine e no painel.

export type Announcement = { text: string; link: string };
export type CampaignStatus = "off" | "scheduled" | "live" | "ended";

export const maxAnnouncements = 6;

// Links aceitos: páginas do próprio site ("/categoria/vestidos", "/#curadoria") ou endereços https.
export function isSafeLink(value: unknown): value is string {
  if (typeof value !== "string" || !value) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return !/[\s<>"']/.test(value);
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function isExternalLink(link: string) {
  return link.startsWith("https:");
}

// Lê os avisos salvos no painel. Se ainda não houver lista, usa a faixa antiga dividida por "•".
export function parseAnnouncements(content: { announcements?: string; announcement?: string }): Announcement[] {
  try {
    const parsed = JSON.parse(content.announcements || "null");
    if (Array.isArray(parsed)) {
      return parsed
        .filter(item => item && typeof item.text === "string" && item.text.trim())
        .map(item => ({ text: String(item.text).trim(), link: isSafeLink(item.link) ? item.link : "" }));
    }
  } catch {}
  return (content.announcement || "").split("•").map(text => text.trim()).filter(Boolean).map(text => ({ text, link: "" }));
}

// Limpa a lista vinda do painel antes de gravar: textos curtos, links seguros, no máximo 6 avisos.
export function sanitizeAnnouncements(value: string): string | null {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;
    const clean = parsed
      .filter(item => item && typeof item.text === "string" && item.text.trim())
      .slice(0, maxAnnouncements)
      .map(item => ({ text: String(item.text).trim().slice(0, 160), link: isSafeLink(item.link) ? String(item.link).slice(0, 300) : "" }));
    return JSON.stringify(clean);
  } catch {
    return null;
  }
}

// Data de hoje no horário de Brasília, no formato AAAA-MM-DD.
export function todayInBrazil(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

// A campanha aparece se estiver ligada e hoje estiver entre o início e o fim (os dois dias inclusos).
export function campaignStatus(content: { campaignEnabled: string; campaignStart: string; campaignEnd: string }, now = new Date()): CampaignStatus {
  if (content.campaignEnabled !== "1") return "off";
  const today = todayInBrazil(now);
  if (content.campaignStart && today < content.campaignStart) return "scheduled";
  if (content.campaignEnd && today > content.campaignEnd) return "ended";
  return "live";
}
