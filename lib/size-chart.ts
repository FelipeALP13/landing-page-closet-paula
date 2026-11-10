// Tabela de medidas da loja (busto, cintura, quadril por tamanho), editada no painel.
// Guardada como JSON na chave "sizeChart". Vazia = não aparece no site (nada de medidas inventadas).
import { productSizes } from "@/lib/store-info";

export const sizeMeasures = [
  { key: "bust", label: "Busto" },
  { key: "waist", label: "Cintura" },
  { key: "hip", label: "Quadril" },
] as const;

export type SizeMeasure = (typeof sizeMeasures)[number]["key"];
export type SizeRow = Record<SizeMeasure, string>;
export type SizeChart = { rows: Record<string, SizeRow>; note: string };

const emptyRow = (): SizeRow => ({ bust: "", waist: "", hip: "" });

export function emptySizeChart(): SizeChart {
  return { rows: Object.fromEntries(productSizes.map(size => [size, emptyRow()])), note: "" };
}

export function parseSizeChart(value: string | undefined): SizeChart {
  const chart = emptySizeChart();
  try {
    const parsed = JSON.parse(value || "{}");
    for (const size of productSizes) {
      for (const { key } of sizeMeasures) {
        const cell = parsed?.rows?.[size]?.[key];
        if (typeof cell === "string") chart.rows[size][key] = cell;
      }
    }
    if (typeof parsed?.note === "string") chart.note = parsed.note;
  } catch {}
  return chart;
}

// A tabela só aparece no site se tiver pelo menos uma medida preenchida.
export function hasSizeChart(chart: SizeChart) {
  return productSizes.some(size => sizeMeasures.some(({ key }) => chart.rows[size][key].trim()));
}

// Limpa a tabela vinda do painel: só os tamanhos e medidas conhecidos, textos curtos.
export function sanitizeSizeChart(value: string): string | null {
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return null;
    const chart = parseSizeChart(value);
    for (const size of productSizes) {
      for (const { key } of sizeMeasures) chart.rows[size][key] = chart.rows[size][key].trim().slice(0, 20);
    }
    chart.note = chart.note.trim().slice(0, 300);
    return JSON.stringify(chart);
  } catch {
    return null;
  }
}
