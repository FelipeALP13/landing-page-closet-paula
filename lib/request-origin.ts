import "server-only";
import { headers } from "next/headers";

// Domínio do site a partir da requisição, para montar links absolutos (compartilhamento, WhatsApp, SEO).
// Usa só o Host: o X-Forwarded-Host pode ser enviado por qualquer visitante e apontaria os links para outro site.
export async function getRequestOrigin() {
  const host = (await headers()).get("host") ?? "localhost";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  return `${protocol}://${host}`;
}
