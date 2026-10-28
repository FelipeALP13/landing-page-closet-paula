import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Closet Paula Miranda | Moda feminina",
  description: "Vestidos, croppeds, blusas, jeans e conjuntos com Curadoria CPM e atendimento pelo WhatsApp.",
  icons: { icon: "/assets/logo.jpg", shortcut: "/assets/logo.jpg" },
  openGraph: {
    title: "Closet Paula Miranda",
    description: "Descubra sua categoria, use a Curadoria CPM e finalize pelo WhatsApp.",
    images: ["/assets/look-06-960.webp"],
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
