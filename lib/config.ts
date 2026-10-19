/**
 * Prix mensuels par défaut (€/mois) — pré-remplissage du champ prixMensuel.
 * Le prixMensuel reste modifiable manuellement sur chaque athlète.
 *
 * Grille tarifaire 3NERGY :
 *   basic       69 €  — Plan d'entrée
 *   performance 99 €  — Coaching performance
 *   pro        109 €  — Coaching pro complet
 *   indiv_200  200 €  — Formule individuelle 200€/mois (growth operator)
 *   indiv_300  300 €  — Formule individuelle 300€/mois (growth operator)
 *   autre        0 €  — Prix libre / personnalisé
 *   gratuit      0 €  — Gratuit (fixe)
 */
export const SERVICE_TARIFS: Record<string, number> = {
  indiv_300:   300,
  indiv_200:   200,
  pro:         109,
  performance:  99,
  basic:        69,
  gratuit:       0,
  autre:         0,
};

/** Labels d'affichage pour les services */
export const SERVICE_LABELS: Record<string, string> = {
  indiv_300:   "Individuel 300€",
  indiv_200:   "Individuel 200€",
  pro:         "Pro",
  performance: "Performance",
  basic:       "Basic",
  gratuit:     "Gratuit",
  autre:       "Autre",
};

/** Ordre d'affichage pour les listes */
export const SERVICE_ORDER = ["indiv_300", "indiv_200", "pro", "performance", "basic", "gratuit", "autre"] as const;
