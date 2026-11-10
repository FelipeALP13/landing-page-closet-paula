// Seção "Elas usam": fotos de clientes usando peças da loja (só com autorização delas).
// Guardadas como lista JSON na chave "customerPhotos" da tabela de textos.
import { isSiteImage } from "@/lib/validation";

export type CustomerPhoto = { image: string; caption: string };

export const maxCustomerPhotos = 12;

export function parseCustomerPhotos(value: string | undefined): CustomerPhoto[] {
  try {
    const parsed = JSON.parse(value || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(item => item && isSiteImage(item.image))
      .map(item => ({ image: item.image, caption: typeof item.caption === "string" ? item.caption : "" }));
  } catch {
    return [];
  }
}

// Limpa a lista vinda do painel antes de gravar: só fotos do próprio site, legendas curtas, no máximo 12.
export function sanitizeCustomerPhotos(value: string): string | null {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;
    if (parsed.some(item => !item || !isSiteImage(item.image))) return null;
    return JSON.stringify(parsed.slice(0, maxCustomerPhotos).map(item => ({
      image: item.image,
      caption: typeof item.caption === "string" ? item.caption.trim().slice(0, 80) : "",
    })));
  } catch {
    return null;
  }
}
