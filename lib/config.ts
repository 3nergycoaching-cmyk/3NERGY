/**
 * Prix mensuels par défaut (€/mois) — pré-remplissage du champ prixMensuel.
 * Le prixMensuel reste modifiable manuellement sur chaque athlète.
 *
 * Grille tarifaire 3NERGY :
 *   basic       69 €  — Plan d'entrée
 *   performance 99 €  — Coaching performance
 *   pro        109 €  — Coaching pro complet
 *   autre        0 €  — Prix libre / personnalisé
 *   gratuit      0 €  — Gratuit (fixe)
 */
export const SERVICE_TARIFS: Record<string, number> = {
  pro:         109,
  performance:  99,
  basic:        69,
  gratuit:       0,
  autre:         0,
};

/** Labels d'affichage pour les services */
export const SERVICE_LABELS: Record<string, string> = {
  pro:         "Pro",
  performance: "Performance",
  basic:       "Basic",
  gratuit:     "Gratuit",
  autre:       "Autre",
};

/** Ordre d'affichage pour les listes */
export const SERVICE_ORDER = ["pro", "performance", "basic", "gratuit", "autre"] as const;
