export const categories = [
  { slug: "vestidos", label: "Vestidos", description: "Vestidos para momentos leves, elegantes e especiais.", image: "/assets/look-06-960.webp" },
  { slug: "croppeds", label: "Croppeds", description: "Modelagens atuais para criar novas combinações.", image: "/assets/look-03-960.webp" },
  { slug: "blusas", label: "Blusas & Camisas", description: "Bases versáteis para todos os momentos.", image: "/assets/look-08-960.webp" },
  { slug: "shorts", label: "Shorts & Saias", description: "Peças frescas e femininas para completar o closet.", image: "/assets/look-01-960.webp" },
  { slug: "jeans", label: "Jeans & Calças", description: "Modelagens que acompanham a rotina com estilo.", image: "/assets/look-09-960.webp" },
  { slug: "conjuntos", label: "Conjuntos", description: "Produções completas sem complicar a escolha.", image: "/assets/look-01-960.webp" },
] as const;

export function getCategory(slug: string) {
  return categories.find(category => category.slug === slug);
}
