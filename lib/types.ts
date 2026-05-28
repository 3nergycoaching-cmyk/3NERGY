export interface Coach {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  couleur: string;
  role: string;
}

export type Discipline = "triathlon" | "cyclisme" | "course_a_pied" | "autre";
export type StatutAthlete = "actif" | "pause" | "archive" | "en_attente";
export type Service = "basic" | "performance" | "pro" | "gratuit" | "autre";

// ── Objectifs ──────────────────────────────────────────────────────────────
export type DistanceObjectif =
  | "Sprint" | "Olympic" | "70.3" | "Ironman"
  | "5km" | "10km" | "Semi" | "Marathon" | "Autre";
export type PrioriteObjectif = "A" | "B" | "C";

export interface Objectif {
  id: string;
  titre: string;
  date: string;
  distance: DistanceObjectif;
  priorite?: PrioriteObjectif;   // optionnel — plus affiché en UI
  source?: "nolio";              // présent si importé depuis Nolio
}

// ── Performances ───────────────────────────────────────────────────────────
export interface Chrono {
  valeur: string;   // time "1:23:45" or watts "280" for FTP
  date: string;
  contexte: "competition" | "entrainement";
}

export type NatationDistance  = "400m" | "750m" | "1500m" | "1900m" | "3800m";
// cp is calculated (not stored); cp_coach is manually entered
export type CyclismeDistance  = "p5min" | "p20min" | "cp_coach";
// cv is calculated (not stored); cv_coach is manually entered
export type CapDistance       = "v5min" | "v20min" | "cv_coach" | "5km" | "10km" | "semi" | "marathon";
export type TriathlonDistance = "sprint" | "olympic" | "703" | "ironman";

export interface CustomEntry {
  id: string;
  discipline: string;
  distance: string;
  valeur: string;
  date: string;
  contexte: "competition" | "entrainement";
}

export interface Performances {
  natation:  Partial<Record<NatationDistance,   Chrono>>;
  cyclisme:  Partial<Record<CyclismeDistance,   Chrono>>;
  cap:       Partial<Record<CapDistance,        Chrono>>;
  triathlon: Partial<Record<TriathlonDistance,  Chrono>>;
  custom?:   CustomEntry[];
}

// ── Athlete ────────────────────────────────────────────────────────────────
export interface Athlete {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse?: string;
  discipline: Discipline;
  coachId: string;
  statut: StatutAthlete;
  objectif: string;
  planJusquAu?: string;
  offreSouscrite?: string;
  lienNolio?: string;
  service: Service;
  prixMensuel: number;
  notes: string;
  createdAt: string;
  nolioId?: number;           // Nolio athlete ID for manual linking
  nolioToken?: NolioToken;    // @deprecated — use db.nolioCoachToken instead
  objectifs?: Objectif[];
  performances?: Performances;
}

export type SourceLead = "instagram" | "bouche_a_oreille" | "site_web" | "autre";
export type StatutLead =
  | "a_contacter"
  | "appel_effectue"
  | "en_reflexion"
  | "demarches_admin"
  | "acompte_recu"
  | "coaching_demarre"
  | "perdu";

export interface Lead {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  source: SourceLead;
  discipline: Discipline;
  statut: StatutLead;
  notes: string;
  createdAt: string;
  coachId?: string;
  dateDebutCoaching?: string;
  converti?: boolean;
}

export type StatutProjet = "en_cours" | "termine" | "en_pause";

export interface Projet {
  id: string;
  nom: string;
  responsable: string;
  deadline: string;
  progression: number;
  statut: StatutProjet;
  description: string;
}

export type StatutTache = "a_faire" | "en_cours" | "termine";
export type PrioriteTache = "haute" | "moyenne" | "basse";

export interface Tache {
  id: string;
  titre: string;
  projetId: string;
  athleteId?: string;
  responsable: string;
  deadline: string;
  statut: StatutTache;
  priorite: PrioriteTache;
}

export type StatutTodo = "a_faire" | "en_cours" | "fait";
export type PrioriteTodo = "haute" | "moyenne" | "basse";

export interface Todo {
  id: string;
  titre: string;
  responsable: string;   // coachId
  priorite: PrioriteTodo;
  deadline?: string;
  statut: StatutTodo;
  projetId?: string;
  notes?: string;
  createdAt: string;
}

// ── Licenciés ──────────────────────────────────────────────────────────────
export type StatutLicencie = "actif" | "expire";

export interface Licencie {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  adresse?: string;
  dateLicence: string; // ISO date "YYYY-MM-DD"
  numeroLicence?: string;
  discipline?: Discipline;
  statut: StatutLicencie;
  createdAt: string;
}

// ── Academy ────────────────────────────────────────────────────────────────
export type StatutJeune = "actif" | "inactif";

export interface YoungAthlete {
  id: string;
  prenom: string;
  nom: string;
  dateNaissance: string;   // ISO date "YYYY-MM-DD"
  discipline: Discipline;
  contactParent: string;   // prénom + nom du parent
  telephoneParent: string;
  emailParent?: string;
  urgence?: string;        // contact urgence libre (ex: "Dupont 0476/000000")
  statut: StatutJeune;
  createdAt: string;
}

export interface AcademySession {
  id: string;
  date: string; // ISO date "YYYY-MM-DD"
  entraineurId: string; // coachId
  discipline: Discipline;
  lieu: string;
  presents: string[]; // YoungAthlete IDs
  notes?: string;
}

// ── Calendrier ─────────────────────────────────────────────────────────────
export type TypeEvenement = "stage" | "competition" | "academy" | "structure" | "autre";

export interface CalendarEvent {
  id: string;
  titre: string;
  type: TypeEvenement;
  dateDebut: string; // ISO date
  dateFin?: string;
  responsable?: string; // coachId
  description?: string;
  participants?: string[]; // coachIds or athleteIds
  source?: "manual" | "objectif" | "academy" | "nolio";
  refId?: string; // ID of source object (or nolio training ID)
  athleteId?: string; // CRM athlete ID for Nolio events
}

// ── Nolio OAuth token ──────────────────────────────────────────────────────
export interface NolioToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;       // Unix timestamp ms
  nolioUserId?: number;    // Nolio internal user ID
}

// ── Onboarding ─────────────────────────────────────────────────────────────

export interface OnboardingData {
  // Étape 1 — Formule
  discipline: "triathlon" | "cyclisme" | "course_a_pied";
  formule: "basic" | "performance" | "pro";
  optionVisio: boolean;
  confirmNolio: boolean;
  // Étape 2 — Cadre contractuel
  confirmAcompte: boolean;
  confirmRetractation1: boolean;
  confirmRetractation2: boolean;
  confirmCommencementImmediat: boolean;
  // Étape 3 — Infos personnelles
  nom: string;
  prenom: string;
  nationalite: string;
  dateNaissance: string;
  adresse: string;
  codePostal: string;
  localite: string;
  pays: string;
  email: string;
  telephone: string;
  contactUrgence: string;
  // Étape 4 — Infos sportives
  objectifsSportifs: string;
  contraintes: string;
  historiquesBlessures: string;
  // Étape 5 — Santé
  sante1: boolean;
  sante2: boolean;
  sante3: boolean;
  sante4: boolean;
  // Étape 6 — Licence LF3
  licenceLF3: "oui" | "non";
  // Étape 7 — Encadrement & éthique
  ethique1: boolean;
  ethique2: boolean;
  ethique3: boolean;
  ethique4: boolean;
  ethique5: boolean;
  // Étape 8 — Documents
  confirmDocuments: boolean;
  // Étape 9 — Photos/vidéos
  acceptPhotos: "oui" | "non";
  // Étape 10 — Validation finale
  certifie: boolean;
}

export interface OnboardingInvitation {
  token: string;        // UUID v4
  athleteId: string;    // CRM athlete ID (pre-created with statut "en_attente")
  prenom: string;
  nom: string;
  email: string;
  coachId: string;
  createdAt: string;    // ISO date
  expiresAt: string;    // ISO date (+7 jours)
  completedAt?: string; // ISO date when submitted
  statut: "pending" | "completed" | "expired";
}

export interface Database {
  coaches: Coach[];
  athletes: Athlete[];
  leads: Lead[];
  projets: Projet[];
  taches: Tache[];
  todos: Todo[];
  licencies: Licencie[];
  youngAthletes: YoungAthlete[];
  academySessions: AcademySession[];
  events: CalendarEvent[];
  invitations: OnboardingInvitation[];
  /** Global coach OAuth token for Nolio — NOT stored on individual athletes */
  nolioCoachToken?: NolioToken;
}
