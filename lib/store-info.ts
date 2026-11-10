// Dados da loja. O nome é fixo; o resto é editado no painel (seção "Dados da loja").

export const storeName = "Closet Paula Miranda";

// Chaves no banco (tabela site_content) e valores iniciais.
export const storeInfoDefaults = {
  storeWhatsapp: "5512997196086",
  storeAddress: "Rua Planura, 204",
  storeCity: "São José dos Campos — SP",
  storeHours1: "Seg a sex: 09h às 18h",
  storeHours2: "Sábado: 09h às 15h",
  storeInstagram: "https://www.instagram.com/closetpaulamiranda/",
  storeFacebook: "https://www.facebook.com/people/Closet-Paula-Miranda/61557378347822/",
  // Obrigatórios por lei (Decreto 7.962/2013) antes da abertura pública. Vazios não aparecem no site.
  storeLegalName: "",
  storeDocument: "", // só números (CPF com 11 ou CNPJ com 14)
  storeEmail: "",
};

export type StoreInfoKey = keyof typeof storeInfoDefaults;
export const storeInfoKeys = Object.keys(storeInfoDefaults) as StoreInfoKey[];

export type StoreInfo = {
  name: string;
  whatsappNumber: string;
  whatsappDisplay: string;
  addressLine: string;
  cityLine: string;
  hours: string[];
  mapsUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  legalName: string;
  document: string; // já formatado
  email: string;
};

export function resolveStoreInfo(content: Partial<Record<string, string>>): StoreInfo {
  const value = (key: StoreInfoKey) => content[key] ?? storeInfoDefaults[key];
  const whatsappNumber = value("storeWhatsapp") || storeInfoDefaults.storeWhatsapp;
  const addressLine = value("storeAddress");
  const cityLine = value("storeCity");
  return {
    name: storeName,
    whatsappNumber,
    whatsappDisplay: formatPhone(whatsappNumber),
    addressLine,
    cityLine,
    hours: [value("storeHours1"), value("storeHours2")].filter(Boolean),
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${addressLine} ${cityLine.replace("—", "")}`)}`,
    instagramUrl: value("storeInstagram"),
    facebookUrl: value("storeFacebook"),
    legalName: value("storeLegalName"),
    document: formatDocument(value("storeDocument")),
    email: value("storeEmail"),
  };
}

// ---- Validação dos dados (usada pelo servidor ao salvar e pelo painel para avisar antes) ----

// Aceita "(12) 99719-6086", "12997196086" ou "5512997196086". Devolve só números com 55 na frente.
export function normalizeWhatsapp(value: string): string | null {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  return /^55\d{10,11}$/.test(digits) ? digits : null;
}

// "5512997196086" → "(12) 99719-6086"
export function formatPhone(digits: string) {
  const local = digits.replace(/^55/, "");
  const match = local.match(/^(\d{2})(\d{4,5})(\d{4})$/);
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : digits;
}

export function formatDocument(digits: string) {
  if (digits.length === 11) return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  if (digits.length === 14) return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  return digits;
}

// Confere os dígitos verificadores de CPF/CNPJ para pegar erro de digitação. Devolve só os números.
export function normalizeDocument(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (/^(\d)\1+$/.test(digits)) return null;
  const check = (base: string, weights: number[]) => {
    const sum = weights.reduce((total, weight, index) => total + Number(base[index]) * weight, 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  if (digits.length === 11) {
    const first = check(digits, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
    const second = check(digits, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
    return first === Number(digits[9]) && second === Number(digits[10]) ? digits : null;
  }
  if (digits.length === 14) {
    const first = check(digits, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    const second = check(digits, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    return first === Number(digits[12]) && second === Number(digits[13]) ? digits : null;
  }
  return null;
}

export function isValidEmail(value: string) {
  return value === "" || /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);
}

// Só aceita link https do próprio Instagram/Facebook (ou vazio, para esconder).
export function isSocialLink(value: string, host: "instagram.com" | "facebook.com") {
  if (value === "") return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

// Confere e limpa um campo de dados da loja. null = valor recusado.
export function sanitizeStoreInfoValue(key: StoreInfoKey, raw: string): string | null {
  const value = raw.trim();
  switch (key) {
    case "storeWhatsapp": return normalizeWhatsapp(value);
    case "storeDocument": return normalizeDocument(value);
    case "storeEmail": return isValidEmail(value) ? value.slice(0, 120) : null;
    case "storeInstagram": return isSocialLink(value, "instagram.com") ? value.slice(0, 300) : null;
    case "storeFacebook": return isSocialLink(value, "facebook.com") ? value.slice(0, 300) : null;
    default: return value.slice(0, 120);
  }
}

export const productSizes = ["PP", "P", "M", "G", "GG"];

export function whatsappLink(number: string, message?: string) {
  const base = `https://wa.me/${number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
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
