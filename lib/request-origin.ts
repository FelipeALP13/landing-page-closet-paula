import "server-only";
import { headers } from "next/headers";

// Domínio do site a partir da requisição, para montar links absolutos (compartilhamento, WhatsApp, SEO).
export async function getRequestOrigin() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  return `${protocol}://${host}`;
}
