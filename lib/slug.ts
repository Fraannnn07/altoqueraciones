/** "Bio Fresh Adultos 15 kg" -> "bio-fresh-adultos-15-kg" (sin tildes, solo a-z 0-9 y guiones). */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}
