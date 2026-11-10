// Só aceita imagens do próprio site: fotos fixas (/assets) ou enviadas pelo painel (/media).
export function isSiteImage(value: unknown): value is string {
  return typeof value === "string" && /^\/(assets|media)\/[\w./-]+$/.test(value) && !value.includes("..");
}
