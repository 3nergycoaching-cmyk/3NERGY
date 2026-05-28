import { Metadata } from "next";
import OnboardingForm from "./OnboardingForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inscription 3NERGY — Dossier d'adhésion",
  description: "Complète ton dossier d'inscription au coaching 3NERGY",
};

export default async function OnboardingPage({
  params,
}: {
  params: { token: string };
}) {
  return (
    <div className="min-h-screen bg-[#fdf8f8]">
      <OnboardingForm token={params.token} />
    </div>
  );
}
