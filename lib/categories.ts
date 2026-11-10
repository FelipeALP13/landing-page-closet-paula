export const categories = [
  { slug: "vestidos", label: "Vestidos", description: "Vestidos para momentos leves, elegantes e especiais.", image: "/assets/look-06-960.webp" },
  { slug: "croppeds", label: "Croppeds", description: "Modelagens atuais para criar novas combinações.", image: "/assets/look-03-960.webp" },
  { slug: "blusas", label: "Blusas & Camisas", description: "Bases versáteis para todos os momentos.", image: "/assets/look-08-960.webp" },
  { slug: "shorts", label: "Shorts & Saias", description: "Peças frescas e femininas para completar o closet.", image: "/assets/look-01-960.webp" },
  { slug: "jeans", label: "Jeans & Calças", description: "Modelagens que acompanham a rotina com estilo.", image: "/assets/look-09-960.webp" },
  { slug: "conjuntos", label: "Conjuntos", description: "Produções completas sem complicar a escolha.", image: "/assets/look-01-960.webp" },
] as const;

export type Category = { slug: string; label: string; description: string; image: string };

// Chaves usadas no painel para a foto e a descrição de cada categoria.
export const categoryImageKey = (slug: string) => `cat_${slug}_image` as const;
export const categoryDescriptionKey = (slug: string) => `cat_${slug}_description` as const;

export function getCategory(slug: string) {
  return categories.find(category => category.slug === slug);
}

// Categoria com a foto e a descrição definidas no painel (ou as padrão, se vazias).
export function resolveCategory(slug: string, content: Record<string, string>): Category | undefined {
  const category = getCategory(slug);
  if (!category) return undefined;
  return {
    ...category,
    image: content[categoryImageKey(slug)] || category.image,
    description: content[categoryDescriptionKey(slug)] || category.description,
  };
}

export function resolveCategories(content: Record<string, string>): Category[] {
  return categories.map(category => resolveCategory(category.slug, content)!);
}
