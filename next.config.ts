import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // Cabeçalhos de segurança básicos. Sem X-Frame-Options porque a pré-visualização da hospedagem pode abrir o site em iframe.
  async headers() {
    // "/" fica explícito porque o vinext não aplica "/:path*" na página inicial.
    return ["/", "/:path*"].map(source => ({ source, headers: securityHeaders }));
  },
};

export default nextConfig;
