"use client";

import { useEffect, useState } from "react";
import { OnboardingData } from "@/lib/types";
import { ChevronLeft, ChevronRight, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────────────────

const STEPS = [
  "Formule de coaching",
  "Cadre contractuel",
  "Informations personnelles",
  "Informations sportives",
  "Santé & responsabilité",
  "Licence LF3",
  "Encadrement & éthique",
  "Acceptation des documents",
  "Photos / Vidéos",
  "Validation finale",
];

const TOTAL = STEPS.length;

const emptyData = (): OnboardingData => ({
  discipline: "triathlon",
  formule: "basic",
  optionVisio: false,
  confirmNolio: false,
  confirmAcompte: false,
  confirmRetractation1: false,
  confirmRetractation2: false,
  confirmCommencementImmediat: false,
  nom: "",
  prenom: "",
  nationalite: "",
  dateNaissance: "",
  adresse: "",
  codePostal: "",
  localite: "",
  pays: "",
  email: "",
  telephone: "",
  contactUrgence: "",
  objectifsSportifs: "",
  contraintes: "",
  historiquesBlessures: "",
  sante1: false,
  sante2: false,
  sante3: false,
  sante4: false,
  licenceLF3: "non",
  ethique1: false,
  ethique2: false,
  ethique3: false,
  ethique4: false,
  ethique5: false,
  confirmDocuments: false,
  acceptPhotos: "oui",
  certifie: false,
});

// ── Sub-components ─────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-[#1a1218] mb-1.5">
      {children}
      {required && <span className="text-[#e8648a] ml-0.5">*</span>}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35] bg-white disabled:bg-gray-50 disabled:text-gray-400"
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35] bg-white resize-none"
    />
  );
}

function RadioCard({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
        checked
          ? "border-[#7c1d35] bg-[#7c1d35]/5"
          : "border-gray-200 bg-white hover:border-[#7c1d35]/40"
      }`}
    >
      <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
        checked ? "border-[#7c1d35]" : "border-gray-300"
      }`}>
        {checked && <div className="w-2 h-2 rounded-full bg-[#7c1d35]" />}
      </div>
      <input type="radio" checked={checked} onChange={onChange} className="sr-only" />
      <span className="text-sm text-[#1a1218] leading-relaxed">{children}</span>
    </label>
  );
}

function CheckCard({
  checked,
  onChange,
  children,
  note,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
  note?: React.ReactNode;
}) {
  return (
    <label
      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
        checked
          ? "border-[#7c1d35] bg-[#7c1d35]/5"
          : "border-gray-200 bg-white hover:border-[#7c1d35]/40"
      }`}
    >
      <div
        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          checked ? "bg-[#7c1d35] border-[#7c1d35]" : "border-gray-300"
        }`}
      >
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <div className="flex-1">
        <span className="text-sm text-[#1a1218] leading-relaxed">{children}</span>
        {note && <div className="mt-2 p-3 bg-[#fdf8f8] rounded-lg border border-[#f3e8eb] text-xs text-[#7c1d35] font-medium">{note}</div>}
      </div>
    </label>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-[#1a1218] mb-5 flex items-center gap-2">
      <span className="w-1 h-5 bg-[#7c1d35] rounded-full inline-block" />
      {children}
    </h2>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function OnboardingForm({ token }: { token: string }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(emptyData());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const set = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  // Load invitation
  useEffect(() => {
    fetch(`/api/onboarding/${token}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.error) {
          setError(res.error);
        } else {
          setData((d) => ({
            ...d,
            prenom: res.prenom ?? "",
            nom: res.nom ?? "",
            email: res.email ?? "",
          }));
        }
      })
      .catch(() => setError("Impossible de charger le formulaire."))
      .finally(() => setLoading(false));
  }, [token]);

  // ── Validation per step ──────────────────────────────────────────────────

  const validate = (): string | null => {
    switch (step) {
      case 1:
        if (!data.confirmNolio) return "Veuillez confirmer la prise de connaissance des modalités de suivi (nöliö).";
        return null;
      case 2:
        if (!data.confirmAcompte) return "Veuillez confirmer les modalités de paiement de l'acompte.";
        if (!data.confirmRetractation1) return "Veuillez confirmer le droit de rétractation (1/2).";
        if (!data.confirmRetractation2) return "Veuillez confirmer le droit de rétractation (2/2).";
        if (!data.confirmCommencementImmediat) return "Veuillez confirmer le commencement immédiat du coaching.";
        return null;
      case 3:
        if (!data.nom.trim()) return "Le nom est obligatoire.";
        if (!data.prenom.trim()) return "Le prénom est obligatoire.";
        if (!data.nationalite.trim()) return "La nationalité est obligatoire.";
        if (!data.dateNaissance) return "La date de naissance est obligatoire.";
        if (!data.adresse.trim()) return "L'adresse est obligatoire.";
        if (!data.codePostal.trim()) return "Le code postal est obligatoire.";
        if (!data.localite.trim()) return "La localité est obligatoire.";
        if (!data.pays.trim()) return "Le pays est obligatoire.";
        if (!data.email.trim()) return "L'adresse e-mail est obligatoire.";
        if (!data.telephone.trim()) return "Le numéro de téléphone est obligatoire.";
        if (!data.contactUrgence.trim()) return "Le contact d'urgence est obligatoire.";
        return null;
      case 4:
        if (!data.objectifsSportifs.trim()) return "Les objectifs sportifs sont obligatoires.";
        if (!data.contraintes.trim()) return "Les contraintes sont obligatoires.";
        if (!data.historiquesBlessures.trim()) return "L'historique de blessures est obligatoire.";
        return null;
      case 5:
        if (!data.sante1 || !data.sante2 || !data.sante3 || !data.sante4)
          return "Toutes les déclarations de santé sont obligatoires.";
        return null;
      case 7:
        if (!data.ethique1 || !data.ethique2 || !data.ethique3 || !data.ethique4 || !data.ethique5)
          return "Tous les engagements d'encadrement et éthique sont obligatoires.";
        return null;
      case 8:
        if (!data.confirmDocuments) return "Veuillez confirmer avoir pris connaissance des documents.";
        return null;
      case 10:
        if (!data.certifie) return "Veuillez certifier l'exactitude des informations fournies.";
        return null;
      default:
        return null;
    }
  };

  const handleNext = () => {
    const err = validate();
    if (err) {
      setValidationError(err);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setValidationError(null);
    setStep((s) => Math.min(s + 1, TOTAL));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrev = () => {
    setValidationError(null);
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/onboarding/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setValidationError(json.error ?? "Une erreur est survenue.");
        return;
      }
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setValidationError("Une erreur réseau est survenue. Réessaye.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render states ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-[#7c1d35] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-[#7c1d35] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#1a1218] mb-2">Lien invalide</h2>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-[#7c1d35]/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-9 h-9 text-[#7c1d35]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1a1218] mb-3">Dossier envoyé !</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-2">
            Merci {data.prenom}, ton dossier d'inscription a bien été transmis à l'équipe 3NERGY.
          </p>
          <p className="text-gray-400 text-sm leading-relaxed">
            Tu recevras une confirmation de ton coach dans les prochains jours. Bienvenue chez 3NERGY&nbsp;!
          </p>
          <p className="mt-6 text-xs text-[#7c1d35] font-semibold tracking-widest uppercase">3NERGY</p>
        </div>
      </div>
    );
  }

  // ── Form layout ──────────────────────────────────────────────────────────

  const progress = ((step - 1) / (TOTAL - 1)) * 100;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Logo + Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-[#7c1d35] rounded-2xl mb-4">
          <span className="text-white font-bold text-xl tracking-tight">3N</span>
        </div>
        <h1 className="text-2xl font-bold text-[#1a1218]">Dossier d'inscription</h1>
        <p className="text-gray-500 text-sm mt-1">Coaching sportif en ligne · 3NERGY ASBL</p>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#7c1d35]">
            Étape {step} / {TOTAL}
          </span>
          <span className="text-xs text-gray-400">{STEPS[step - 1]}</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#7c1d35] to-[#e8648a] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Validation error banner */}
      {validationError && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-sm text-red-700">
          <AlertCircle size={16} className="flex-shrink-0" />
          {validationError}
        </div>
      )}

      {/* Step card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">

        {/* ── ÉTAPE 1 ── */}
        {step === 1 && (
          <div className="space-y-6">
            <SectionTitle>Formule de coaching en ligne</SectionTitle>

            <div>
              <FieldLabel required>Discipline sportive</FieldLabel>
              <div className="space-y-2">
                {(["triathlon", "cyclisme", "course_a_pied"] as const).map((d) => (
                  <RadioCard key={d} checked={data.discipline === d} onChange={() => set("discipline", d)}>
                    {d === "triathlon" ? "Triathlon" : d === "cyclisme" ? "Cyclisme" : "Course à pied"}
                  </RadioCard>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel required>Formule de coaching</FieldLabel>
              <div className="space-y-2">
                <RadioCard checked={data.formule === "basic"} onChange={() => set("formule", "basic")}>
                  <span className="font-semibold">Basic</span> — <span className="text-[#7c1d35] font-bold">69€/mois</span>
                </RadioCard>
                <RadioCard checked={data.formule === "performance"} onChange={() => set("formule", "performance")}>
                  <span className="font-semibold">Performance</span> — <span className="text-[#7c1d35] font-bold">99€/mois</span>
                </RadioCard>
                <RadioCard checked={data.formule === "pro"} onChange={() => set("formule", "pro")}>
                  <span className="font-semibold">Pro</span> — <span className="text-[#7c1d35] font-bold">109€/mois</span>
                </RadioCard>
              </div>
              <p className="mt-3 text-xs text-gray-400 leading-relaxed">
                Engagement minimum de 3 mois incompressibles, puis reconduction mensuelle. Les prestations constituent une obligation de moyens et non de résultats.
              </p>
            </div>

            <div>
              <FieldLabel required>Option appel visio</FieldLabel>
              <div className="space-y-2">
                <RadioCard checked={data.optionVisio === true} onChange={() => set("optionVisio", true)}>
                  Je souhaite ajouter l'option appel visio à <span className="font-semibold">30€ pour 30 minutes</span>.
                </RadioCard>
                <RadioCard checked={data.optionVisio === false} onChange={() => set("optionVisio", false)}>
                  Je ne souhaite pas ajouter l'option appel visio.
                </RadioCard>
              </div>
            </div>

            <div>
              <FieldLabel required>Modalités de suivi sportif</FieldLabel>
              <CheckCard checked={data.confirmNolio} onChange={(v) => set("confirmNolio", v)}>
                Je confirme prendre connaissance que le suivi sportif sera réalisé <strong>exclusivement via la plateforme nöliö</strong>.
              </CheckCard>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 2 ── */}
        {step === 2 && (
          <div className="space-y-4">
            <SectionTitle>Cadre contractuel & droit de rétractation</SectionTitle>

            <CheckCard
              checked={data.confirmAcompte}
              onChange={(v) => set("confirmAcompte", v)}
              note={
                <span>
                  IBAN : <strong>BE78 7320 6781 6286</strong> · Bénéficiaire : <strong>3NERGY ASBL</strong> · Communication : <strong>Nom Prénom – Coaching en ligne</strong>
                </span>
              }
            >
              Je confirme avoir pris connaissance des modalités de paiement et m'engage à verser un <strong>acompte de 15€</strong>, déduit de la première facture, afin de valider mon adhésion.
            </CheckCard>

            <CheckCard checked={data.confirmRetractation1} onChange={(v) => set("confirmRetractation1", v)}>
              Je reconnais bénéficier d'un <strong>droit de rétractation de 14 jours calendrier</strong> à compter de la confirmation de mon adhésion.
            </CheckCard>

            <CheckCard checked={data.confirmRetractation2} onChange={(v) => set("confirmRetractation2", v)}>
              Je reconnais que lorsque le dernier jour de ce délai tombe un samedi, un dimanche ou un jour férié, celui-ci est reporté au premier jour ouvrable suivant.
            </CheckCard>

            <CheckCard checked={data.confirmCommencementImmediat} onChange={(v) => set("confirmCommencementImmediat", v)}>
              Je demande expressément le <strong>commencement immédiat du coaching</strong> avant l'expiration du délai de rétractation et reconnais qu'une fois le coaching commencé, je renonce à mon droit de rétractation, conformément aux CGV de 3NERGY ASBL.
            </CheckCard>
          </div>
        )}

        {/* ── ÉTAPE 3 ── */}
        {step === 3 && (
          <div className="space-y-5">
            <SectionTitle>Informations personnelles</SectionTitle>

            <p className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3 leading-relaxed">
              Les données collectées sont utilisées exclusivement dans le cadre de la gestion de l'adhésion, du suivi sportif et de la sécurité des athlètes, conformément à la Politique RGPD de 3NERGY ASBL.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel required>Nom</FieldLabel>
                <TextInput value={data.nom} onChange={(v) => set("nom", v)} required />
              </div>
              <div>
                <FieldLabel required>Prénom</FieldLabel>
                <TextInput value={data.prenom} onChange={(v) => set("prenom", v)} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel required>Nationalité</FieldLabel>
                <TextInput value={data.nationalite} onChange={(v) => set("nationalite", v)} required />
              </div>
              <div>
                <FieldLabel required>Date de naissance</FieldLabel>
                <TextInput type="date" value={data.dateNaissance} onChange={(v) => set("dateNaissance", v)} required />
              </div>
            </div>

            <div>
              <FieldLabel required>Adresse</FieldLabel>
              <TextInput value={data.adresse} onChange={(v) => set("adresse", v)} placeholder="Rue, numéro..." required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel required>Code postal</FieldLabel>
                <TextInput value={data.codePostal} onChange={(v) => set("codePostal", v)} required />
              </div>
              <div>
                <FieldLabel required>Localité</FieldLabel>
                <TextInput value={data.localite} onChange={(v) => set("localite", v)} required />
              </div>
            </div>

            <div>
              <FieldLabel required>Pays</FieldLabel>
              <TextInput value={data.pays} onChange={(v) => set("pays", v)} required />
            </div>

            <div>
              <FieldLabel required>Adresse e-mail</FieldLabel>
              <TextInput type="email" value={data.email} onChange={(v) => set("email", v)} required />
            </div>

            <div>
              <FieldLabel required>Numéro de téléphone</FieldLabel>
              <TextInput type="tel" value={data.telephone} onChange={(v) => set("telephone", v)} required />
            </div>

            <div>
              <FieldLabel required>Contact d'urgence</FieldLabel>
              <TextInput
                value={data.contactUrgence}
                onChange={(v) => set("contactUrgence", v)}
                placeholder="Nom et numéro de téléphone"
                required
              />
            </div>
          </div>
        )}

        {/* ── ÉTAPE 4 ── */}
        {step === 4 && (
          <div className="space-y-5">
            <SectionTitle>Informations sportives</SectionTitle>

            <div>
              <FieldLabel required>Objectifs sportifs court / moyen terme</FieldLabel>
              <Textarea
                value={data.objectifsSportifs}
                onChange={(v) => set("objectifsSportifs", v)}
                placeholder="Décris tes objectifs sportifs..."
                rows={4}
              />
            </div>

            <div>
              <FieldLabel required>Contraintes principales</FieldLabel>
              <Textarea
                value={data.contraintes}
                onChange={(v) => set("contraintes", v)}
                placeholder="Contraintes de temps, matériel, géographiques..."
                rows={3}
              />
            </div>

            <div>
              <FieldLabel required>Historique de blessures ou fragilités</FieldLabel>
              <Textarea
                value={data.historiquesBlessures}
                onChange={(v) => set("historiquesBlessures", v)}
                placeholder='Si aucune, écris "Aucune"'
                rows={3}
              />
            </div>
          </div>
        )}

        {/* ── ÉTAPE 5 ── */}
        {step === 5 && (
          <div className="space-y-4">
            <SectionTitle>Santé & responsabilité</SectionTitle>

            <CheckCard checked={data.sante1} onChange={(v) => set("sante1", v)}>
              Je déclare être <strong>apte à la pratique sportive</strong> et ne présenter aucune contre-indication connue.
            </CheckCard>
            <CheckCard checked={data.sante2} onChange={(v) => set("sante2", v)}>
              Je confirme avoir pris connaissance du <strong>Formulaire de Santé LF3</strong> et m'engage à le compléter et le tenir à jour.
            </CheckCard>
            <CheckCard checked={data.sante3} onChange={(v) => set("sante3", v)}>
              Je m'engage à <strong>informer 3NERGY ASBL de toute modification de mon état de santé</strong>.
            </CheckCard>
            <CheckCard checked={data.sante4} onChange={(v) => set("sante4", v)}>
              Je reconnais que la <strong>déclaration de santé relève de ma responsabilité</strong> et conditionne la sécurité de ma pratique sportive.
            </CheckCard>
          </div>
        )}

        {/* ── ÉTAPE 6 ── */}
        {step === 6 && (
          <div className="space-y-4">
            <SectionTitle>Licence triathlon (LF3)</SectionTitle>

            <FieldLabel required>Souhaitez-vous souscrire une licence triathlon (LF3) via 3NERGY ASBL ?</FieldLabel>
            <div className="space-y-2">
              <RadioCard checked={data.licenceLF3 === "oui"} onChange={() => set("licenceLF3", "oui")}>
                <strong>Oui</strong> — Je souhaite souscrire une licence triathlon (LF3) via 3NERGY ASBL.
              </RadioCard>
              <RadioCard checked={data.licenceLF3 === "non"} onChange={() => set("licenceLF3", "non")}>
                <strong>Non</strong> — Je ne souhaite pas souscrire de licence LF3.
              </RadioCard>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 7 ── */}
        {step === 7 && (
          <div className="space-y-4">
            <SectionTitle>Encadrement, outils & éthique</SectionTitle>

            <CheckCard checked={data.ethique1} onChange={(v) => set("ethique1", v)}>
              Je reconnais que <strong>seuls les entraînements planifiés et validés via la plateforme nöliö</strong> sont considérés comme encadrés.
            </CheckCard>
            <CheckCard checked={data.ethique2} onChange={(v) => set("ethique2", v)}>
              Le <strong>suivi sportif officiel est assuré exclusivement via nöliö</strong>.
            </CheckCard>
            <CheckCard checked={data.ethique3} onChange={(v) => set("ethique3", v)}>
              Les canaux <strong>Discord, Strava et réseaux sociaux</strong> sont proposés à titre informatif et communautaire, <strong>sans valeur contractuelle</strong>.
            </CheckCard>
            <CheckCard checked={data.ethique4} onChange={(v) => set("ethique4", v)}>
              Je m'engage à respecter les <strong>règles antidopage en vigueur</strong> (référence :{" "}
              <a href="https://www.dopage.be" target="_blank" rel="noopener noreferrer" className="text-[#7c1d35] underline" onClick={(e) => e.stopPropagation()}>
                www.dopage.be
              </a>).
            </CheckCard>
            <CheckCard checked={data.ethique5} onChange={(v) => set("ethique5", v)}>
              Je m'engage à respecter les principes de la <strong>Charte éthique de la LF3</strong>.
            </CheckCard>
          </div>
        )}

        {/* ── ÉTAPE 8 ── */}
        {step === 8 && (
          <div className="space-y-4">
            <SectionTitle>Acceptation des documents</SectionTitle>

            <CheckCard checked={data.confirmDocuments} onChange={(v) => set("confirmDocuments", v)}>
              Je confirme avoir pris connaissance et accepté les documents suivants sur les sites référencés :{" "}
              <br /><br />
              <ul className="space-y-1 text-sm">
                {[
                  ["Politique RGPD", "https://www.3nergy.be"],
                  ["Règlement d'Ordre Intérieur (ROI)", "https://www.3nergy.be"],
                  ["Conditions Générales de Vente (CGV)", "https://www.3nergy.be"],
                  ["Guide de sécurité", "https://www.3nergy.be"],
                  ["Charte éthique LF3", "https://www.lf3.be"],
                  ["Formulaire de Santé LF3", "https://www.lf3.be"],
                ].map(([label, url]) => (
                  <li key={label} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7c1d35] flex-shrink-0" />
                    <span>
                      <strong>{label}</strong> —{" "}
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#7c1d35] underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {url.replace("https://", "")}
                      </a>
                    </span>
                  </li>
                ))}
              </ul>
            </CheckCard>
          </div>
        )}

        {/* ── ÉTAPE 9 ── */}
        {step === 9 && (
          <div className="space-y-4">
            <SectionTitle>Photos / Vidéos</SectionTitle>

            <FieldLabel required>Droits à l'image</FieldLabel>
            <div className="space-y-2">
              <RadioCard checked={data.acceptPhotos === "oui"} onChange={() => set("acceptPhotos", "oui")}>
                J'<strong>accepte</strong> l'utilisation de photos et/ou vidéos me concernant ainsi que mon identification.
              </RadioCard>
              <RadioCard checked={data.acceptPhotos === "non"} onChange={() => set("acceptPhotos", "non")}>
                Je <strong>n'accepte pas</strong> l'utilisation de photos et/ou des vidéos me concernant, ni d'être identifié.
              </RadioCard>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 10 ── */}
        {step === 10 && (
          <div className="space-y-6">
            <SectionTitle>Validation finale</SectionTitle>

            {/* Summary */}
            <div className="bg-[#fdf8f8] rounded-xl border border-[#f3e8eb] p-5 space-y-2 text-sm">
              <h3 className="font-semibold text-[#1a1218] mb-3">Récapitulatif</h3>
              <div className="flex justify-between"><span className="text-gray-500">Athlète</span><span className="font-semibold">{data.prenom} {data.nom}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Discipline</span><span className="font-semibold capitalize">{data.discipline.replace("_", " ").replace("course a pied", "Course à pied")}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Formule</span>
                <span className="font-semibold text-[#7c1d35]">
                  {data.formule === "basic" ? "Basic — 69€/mois" : data.formule === "performance" ? "Performance — 99€/mois" : "Pro — 109€/mois"}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-gray-500">Option visio</span><span className="font-semibold">{data.optionVisio ? "Oui (+30€)" : "Non"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Licence LF3</span><span className="font-semibold">{data.licenceLF3 === "oui" ? "Oui" : "Non"}</span></div>
            </div>

            <CheckCard checked={data.certifie} onChange={(v) => set("certifie", v)}>
              Je certifie que les informations fournies sont <strong>exactes et complètes</strong> et accepte les conditions applicables à mon adhésion.
            </CheckCard>
          </div>
        )}

      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 gap-3">
        <button
          type="button"
          onClick={handlePrev}
          disabled={step === 1}
          className="flex items-center gap-2 px-5 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
          Précédent
        </button>

        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i + 1 === step
                  ? "w-6 bg-[#7c1d35]"
                  : i + 1 < step
                  ? "w-2 bg-[#7c1d35]/40"
                  : "w-2 bg-gray-200"
              }`}
            />
          ))}
        </div>

        {step < TOTAL ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 px-5 py-3 bg-[#7c1d35] text-white rounded-xl text-sm font-semibold hover:bg-[#9b2445] transition-colors"
          >
            Suivant
            <ChevronRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-3 bg-[#7c1d35] text-white rounded-xl text-sm font-semibold hover:bg-[#9b2445] transition-colors disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <CheckCircle2 size={15} />
                Envoyer
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
