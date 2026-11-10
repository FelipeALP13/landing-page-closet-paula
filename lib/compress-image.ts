// Reduz fotos do celular (4–8 MB) para um arquivo leve antes do envio, sem a dona da loja precisar fazer nada.
const maxSide = 1600;
const quality = 0.82;

export async function compressImage(file: File): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Formato que o navegador não abre (ex.: HEIC no Chrome): envia o original e o servidor decide.
    return file;
  }

  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return file;
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // WebP é o mais leve; se o navegador não gerar WebP (Safari antigo), usa JPEG.
  for (const type of ["image/webp", "image/jpeg"]) {
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality));
    if (blob && blob.type === type) {
      if (blob.size >= file.size && ["image/jpeg", "image/png", "image/webp"].includes(file.type)) return file;
      const extension = type === "image/webp" ? "webp" : "jpg";
      return new File([blob], file.name.replace(/\.[^.]+$/, "") + `.${extension}`, { type });
    }
  }
  return file;
}
