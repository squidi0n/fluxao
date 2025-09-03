// Legacy Kategorie-Funktionen für FluxAO Magazin
// Diese Datei wird schrittweise abgebaut - alle neuen Features nutzen die dynamische API

export type Category = {
  slug: string;
  title: string;
  description: string;
  optional?: boolean;
  seoTitle?: string;
  seoDescription?: string;
};

/**
 * @deprecated Wird durch dynamische API ersetzt - nur noch für Kompatibilität
 * Nutze stattdessen getServerCategoryBySlug() aus @/lib/server-categories
 */
export function getCategory(slug: string): Category | null {
  // Fallback für Legacy-Code - sollte nicht mehr verwendet werden
  console.warn('getCategory() ist deprecated. Nutze getServerCategoryBySlug() stattdessen.');
  return null;
}

/**
 * @deprecated Wird durch dynamische Routen ersetzt
 */
export function getCategoryUrl(slug: string): string {
  return `/news/${slug}`;
}

// Note: CATEGORIES Array wurde entfernt - alle Kategorien kommen jetzt aus der Datenbank
// Nutze getServerCategories() aus @/lib/server-categories für Server Components
// Nutze useCategories() Hook für Client Components