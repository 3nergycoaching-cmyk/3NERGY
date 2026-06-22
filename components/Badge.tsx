import { Discipline, StatutAthlete, StatutLead, StatutProjet, StatutTache, PrioriteTache, Service } from "@/lib/types";
import { SERVICE_LABELS } from "@/lib/config";

type BadgeVariant = "discipline" | "statut_athlete" | "statut_lead" | "statut_projet" | "statut_tache" | "priorite" | "service";

const disciplineMap: Record<Discipline, { label: string; class: string }> = {
  triathlon:     { label: "Triathlon",     class: "bg-blue-100 text-blue-800" },
  cyclisme:      { label: "Cyclisme",      class: "bg-green-100 text-green-800" },
  course_a_pied: { label: "Course à pied", class: "bg-orange-100 text-orange-800" },
  autre:         { label: "Autre",         class: "bg-gray-100 text-gray-600" },
};

const statutAthleteMap: Record<StatutAthlete, { label: string; class: string }> = {
  actif:      { label: "Actif",       class: "bg-emerald-100 text-emerald-800" },
  pause:      { label: "Pause",       class: "bg-yellow-100 text-yellow-800" },
  arret:      { label: "Arrêt",       class: "bg-red-100 text-red-700" },
  archive:    { label: "Archivé",     class: "bg-gray-100 text-gray-600" },
  en_attente: { label: "En attente",  class: "bg-amber-100 text-amber-700" },
};

const statutLeadMap: Record<StatutLead, { label: string; class: string }> = {
  a_contacter:      { label: "À contacter",           class: "bg-gray-100 text-gray-700" },
  appel_effectue:   { label: "Appel effectué",        class: "bg-blue-100 text-blue-700" },
  en_reflexion:     { label: "En réflexion",          class: "bg-amber-100 text-amber-700" },
  demarches_admin:  { label: "Démarches admin",       class: "bg-violet-100 text-violet-700" },
  acompte_recu:     { label: "Acompte reçu",          class: "bg-orange-100 text-orange-700" },
  coaching_demarre: { label: "Coaching démarré",      class: "bg-emerald-100 text-emerald-700" },
  perdu:            { label: "Perdu",                 class: "bg-red-100 text-red-700" },
};

const statutProjetMap: Record<StatutProjet, { label: string; class: string }> = {
  en_cours: { label: "En cours", class: "bg-blue-100 text-blue-800" },
  termine: { label: "Terminé", class: "bg-emerald-100 text-emerald-800" },
  en_pause: { label: "En pause", class: "bg-yellow-100 text-yellow-800" },
};

const statutTacheMap: Record<StatutTache, { label: string; class: string }> = {
  a_faire: { label: "À faire", class: "bg-gray-100 text-gray-700" },
  en_cours: { label: "En cours", class: "bg-blue-100 text-blue-700" },
  termine: { label: "Terminé", class: "bg-emerald-100 text-emerald-700" },
};

const prioriteMap: Record<PrioriteTache, { label: string; class: string }> = {
  haute: { label: "Haute", class: "bg-red-100 text-red-700" },
  moyenne: { label: "Moyenne", class: "bg-yellow-100 text-yellow-700" },
  basse: { label: "Basse", class: "bg-gray-100 text-gray-600" },
};

const serviceMap: Record<Service, { label: string; class: string }> = {
  basic:       { label: SERVICE_LABELS.basic,       class: "bg-gray-100 text-gray-700" },
  performance: { label: SERVICE_LABELS.performance, class: "bg-indigo-100 text-indigo-700" },
  pro:         { label: SERVICE_LABELS.pro,         class: "bg-[#7c1d35]/10 text-[#7c1d35]" },
  gratuit:     { label: SERVICE_LABELS.gratuit,     class: "bg-sky-100 text-sky-700" },
  autre:       { label: SERVICE_LABELS.autre,       class: "bg-slate-100 text-slate-600" },
};

interface BadgeProps {
  value: string;
  type: BadgeVariant;
}

export default function Badge({ value, type }: BadgeProps) {
  let info: { label: string; class: string } | undefined;

  if (type === "discipline") info = disciplineMap[value as Discipline];
  else if (type === "statut_athlete") info = statutAthleteMap[value as StatutAthlete];
  else if (type === "statut_lead") info = statutLeadMap[value as StatutLead];
  else if (type === "statut_projet") info = statutProjetMap[value as StatutProjet];
  else if (type === "statut_tache") info = statutTacheMap[value as StatutTache];
  else if (type === "priorite") info = prioriteMap[value as PrioriteTache];
  else if (type === "service") info = serviceMap[value as Service];

  if (!info) return <span className="text-xs text-gray-500">{value}</span>;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${info.class}`}>
      {info.label}
    </span>
  );
}

export { disciplineMap, statutAthleteMap, statutLeadMap, statutProjetMap, statutTacheMap, prioriteMap, serviceMap };
