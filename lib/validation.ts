// Validações compartilhadas entre as rotas da API e o banco.

// Só aceita imagens do próprio site: fotos fixas (/assets) ou enviadas pelo painel (/media).
export function isSiteImage(value: unknown): value is string {
  return typeof value === "string" && /^\/(assets|media)\/[\w./-]+$/.test(value) && !value.includes("..");
}

// O id vira o endereço da peça (/produto/id): só letras minúsculas, números e hífen.
export function isProductId(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9][a-z0-9-]{0,79}$/.test(value);
}
