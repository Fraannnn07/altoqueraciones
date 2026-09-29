/**
 * Búsqueda en memoria. El catálogo es chico (menos de 100 productos activos), así que se trae entero y
 * se filtra acá: permite ignorar tildes y plurales, juntar palabras ("proplan") y perdonar errores de
 * tipeo ("pedigre") sin depender de extensiones de Postgres.
 */

export const SEARCH_QUERY_MAX_LENGTH = 80;

// Palabras que no distinguen un producto de otro (todo el catálogo es alimento): no se exigen.
const GENERIC_WORDS = new Set([
  'alimento', 'alimentos', 'comida', 'comidas', 'racion', 'raciones', 'balanceado', 'balanceados',
  'bolsa', 'bolsas', 'mascota', 'mascotas',
  'para', 'de', 'del', 'la', 'las', 'el', 'los', 'lo', 'y', 'con', 'en', 'mi', 'mis', 'un', 'una', 'por', 'al',
]);

/** Primer valor de ?q=, sin espacios de más y con largo acotado. */
export function parseSearchQuery(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (value ?? '').trim().replace(/\s+/g, ' ').slice(0, SEARCH_QUERY_MAX_LENGTH);
}

/**
 * Minúsculas y sin tildes; "7,5" → "7.5", "15 kilos" → "15kg", combos "15+3kg" → "15kg 3kg" (así
 * "15kg" también los encuentra); sin signos salvo el punto decimal.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/(\d)\s*(?:kilos?|kgs?|k)\b/g, '$1kg')
    .replace(/\b(?:kilos?|kgs)\b/g, 'kg')
    .replace(/(\d+(?:\.\d+)?)\s*\+\s*(\d+(?:\.\d+)?)kg/g, '$1kg $2kg')
    .replace(/(?<!\d)\.|\.(?!\d)/g, ' ')
    .replace(/[^a-z0-9.]+/g, ' ')
    .trim();
}

/** Plural a singular, lo justo para que "cachorros" encuentre "cachorro" (y viceversa). */
function stem(word: string): string {
  return word.length > 3 && word.endsWith('s') ? word.slice(0, -1) : word;
}

function toWords(text: string): string[] {
  return normalize(text).split(' ').filter(Boolean).map(stem);
}

function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    previous = current;
  }
  return previous[b.length];
}

interface IndexedText {
  words: string[];
  compact: string; // sin espacios, para que "proplan" encuentre "Pro Plan"
}

function indexText(texts: string[]): IndexedText {
  const words = texts.flatMap(toWords);
  return { words, compact: words.join('') };
}

/** Error de tipeo contra una palabra entera o su comienzo ("pedigri" ~ "pedigre|e"). */
function isTypo(token: string, words: string[]): boolean {
  if (token.length < 5) return false;
  const maxDistance = token.length >= 8 ? 2 : 1;
  return words.some(
    (word) =>
      (Math.abs(word.length - token.length) <= maxDistance && editDistance(token, word) <= maxDistance) ||
      (word.length > token.length && editDistance(token, word.slice(0, token.length)) <= maxDistance),
  );
}

export interface SearchFields {
  /** Lo que identifica al ítem (marca, nombre, kilos). Pesa más en el orden. */
  primary: string[];
  /** Contexto (categorías), para que "gato" o "cachorro" encuentren productos que no lo dicen en el nombre. */
  secondary?: string[];
}

/**
 * Ítems que coinciden con todas las palabras de la búsqueda, ordenados por relevancia (empates en el
 * orden original). Si la búsqueda solo tiene palabras genéricas (p. ej. "comida"), devuelve todo.
 */
export function searchItems<T>(items: T[], query: string, fields: (item: T) => SearchFields): T[] {
  const words = normalize(query).split(' ').filter((word) => word && !GENERIC_WORDS.has(word));
  const tokens = [...new Set(words.map(stem))];
  if (tokens.length === 0) return items;

  const scored: { item: T; score: number }[] = [];
  for (const item of items) {
    const { primary, secondary = [] } = fields(item);
    const main = indexText(primary);
    const context = indexText(secondary);
    const everything = [...main.words, ...context.words];

    let score = 0;
    for (const token of tokens) {
      if (main.compact.includes(token)) score += 3;
      else if (context.compact.includes(token)) score += 2;
      else if (isTypo(token, everything)) score += 1;
      else {
        score = 0;
        break;
      }
    }
    if (score > 0) scored.push({ item, score });
  }

  return scored.sort((a, b) => b.score - a.score).map(({ item }) => item);
}
