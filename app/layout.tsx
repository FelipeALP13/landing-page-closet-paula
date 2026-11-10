import type { Metadata, Viewport } from "next";
import { getRequestOrigin } from "@/lib/request-origin";
import "./globals.css";

// Aplica o tema salvo (ou o do sistema) antes da primeira pintura, para a página não piscar.
const themeScript = `(function(){try{var t=localStorage.getItem("cpm-theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}})()`;

export async function generateMetadata(): Promise<Metadata> {
  // Usa o domínio da requisição para gerar URLs absolutas (imagem de compartilhamento, canonical).
  return {
    metadataBase: new URL(await getRequestOrigin()),
    title: "Closet Paula Miranda | Moda feminina em São José dos Campos",
    description: "Vestidos, croppeds, blusas, jeans e conjuntos com Curadoria CPM e atendimento pelo WhatsApp. Loja na Rua Planura, 204, em São José dos Campos.",
    icons: { icon: "/assets/logo.jpg", shortcut: "/assets/logo.jpg", apple: "/assets/logo.jpg" },
    alternates: { canonical: "/" },
    openGraph: {
      title: "Closet Paula Miranda",
      description: "Descubra sua categoria, use a Curadoria CPM e finalize pelo WhatsApp.",
      images: [{ url: "/assets/look-06-960.webp", alt: "Vestido longo amarelo da Closet Paula Miranda" }],
      locale: "pt_BR",
      type: "website",
      siteName: "Closet Paula Miranda",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#11100f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>{children}</body>
    </html>
  );
}
