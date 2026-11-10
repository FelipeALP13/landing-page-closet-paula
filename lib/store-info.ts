// Dados fixos da loja usados em todo o site.
export const storeInfo = {
  name: "Closet Paula Miranda",
  whatsappNumber: "5512997196086",
  whatsappDisplay: "(12) 99719-6086",
  addressLine: "Rua Planura, 204",
  cityLine: "São José dos Campos — SP",
  hours: ["Seg a sex: 09h às 18h", "Sábado: 09h às 15h"],
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Rua+Planura+204+S%C3%A3o+Jos%C3%A9+dos+Campos+SP",
  instagramUrl: "https://www.instagram.com/closetpaulamiranda/",
  facebookUrl: "https://www.facebook.com/people/Closet-Paula-Miranda/61557378347822/",

  // Obrigatórios por lei (Decreto 7.962/2013) antes da abertura pública.
  // Preencha com os dados confirmados pela loja; campos vazios não aparecem no site.
  legalName: "",
  document: "", // CNPJ ou CPF, já formatado
  email: "",
};

export const productSizes = ["PP", "P", "M", "G", "GG"];

export const whatsappBase = `https://wa.me/${storeInfo.whatsappNumber}`;

export function whatsappLink(message?: string) {
  return message ? `${whatsappBase}?text=${encodeURIComponent(message)}` : whatsappBase;
}

export function productPath(id: string) {
  return `/produto/${encodeURIComponent(id)}`;
}

// Converte o preço digitado no painel em número ("R$ 1.189,90" → 1189.9). null se não for um valor.
export function parsePrice(price: string): number | null {
  const digits = price.replace(/[^\d,.]/g, "");
  if (!digits) return null;
  // Vírgula é decimal; sem vírgula, "1.189" é milhar e "189.90" é decimal.
  const normalized = digits.includes(",") ? digits.replace(/\./g, "").replace(",", ".")
    : /^\d{1,3}(\.\d{3})+$/.test(digits) ? digits.replace(/\./g, "") : digits;
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : null;
}

// Preço como a cliente vê. Valores numéricos viram "R$ 189,90"; textos livres aparecem como foram escritos.
export function formatPrice(price: string) {
  const trimmed = price.trim();
  if (!trimmed) return "Valor sob consulta";
  const value = parsePrice(trimmed);
  if (value !== null && /^(R\$)?\s*[\d.,]+$/.test(trimmed)) return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return trimmed;
}
