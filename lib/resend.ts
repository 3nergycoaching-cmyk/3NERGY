/**
 * lib/resend.ts — Email helper via Resend (server-side only)
 * From address: contact@3nergy.be
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = "3NERGY <contact@3nergy.be>";

// ── Invitation email to the athlete ───────────────────────────────────────

export async function sendInvitationEmail({
  to,
  prenom,
  nom,
  coachPrenom,
  coachNom,
  formUrl,
}: {
  to: string;
  prenom: string;
  nom: string;
  coachPrenom: string;
  coachNom: string;
  formUrl: string;
}): Promise<void> {
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenue chez 3NERGY</title>
</head>
<body style="margin:0;padding:0;background:#fdf8f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf8f8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header bordeaux -->
          <tr>
            <td style="background:#7c1d35;padding:36px 40px;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">3NERGY</h1>
              <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.75);letter-spacing:2px;text-transform:uppercase;">Coaching sportif</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 8px;font-size:22px;color:#1a1218;font-weight:700;">
                Bienvenue chez 3NERGY, ${prenom}&nbsp;!
              </h2>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                Nous sommes ravis de t'accueillir dans la famille 3NERGY. Ton coach <strong style="color:#1a1218;">${coachPrenom} ${coachNom}</strong> t'a envoyé cette invitation pour finaliser ton dossier d'inscription.
              </p>

              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                Le formulaire d'inscription te prendra environ <strong style="color:#1a1218;">5 à 10 minutes</strong>. Il couvre ta formule de coaching, tes informations personnelles, ton profil sportif et les engagements contractuels 3NERGY.
              </p>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" style="margin:32px 0;">
                <tr>
                  <td style="background:#7c1d35;border-radius:12px;">
                    <a href="${formUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:-0.2px;">
                      Compléter mon dossier d'inscription →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">
                Ce lien est valable <strong>7 jours</strong>. Au-delà, contacte ton coach pour recevoir une nouvelle invitation.
              </p>
              <p style="margin:0;font-size:11px;color:#d1d5db;word-break:break-all;">
                ${formUrl}
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #f3e8eb;margin:0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                3NERGY ASBL · <a href="https://www.3nergy.be" style="color:#7c1d35;text-decoration:none;">www.3nergy.be</a><br/>
                contact@3nergy.be
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Bienvenue chez 3NERGY — Complète ton dossier d'inscription",
    html,
  });
}

// ── Notification email to the coach / admin ───────────────────────────────

export async function sendCompletionNotification({
  athletePrenom,
  athleteNom,
  formule,
  optionVisio,
  licenceLF3,
}: {
  athletePrenom: string;
  athleteNom: string;
  formule: string;
  optionVisio: boolean;
  licenceLF3: "oui" | "non";
}): Promise<void> {
  const formuleLabel: Record<string, string> = {
    basic: "Basic — 69€/mois",
    performance: "Performance — 99€/mois",
    pro: "Pro — 109€/mois",
  };

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#fdf8f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf8f8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#7c1d35;padding:28px 36px;">
              <h1 style="margin:0;font-size:20px;font-weight:800;color:#ffffff;">3NERGY — Nouveau dossier complété</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 36px;">
              <p style="margin:0 0 16px;font-size:15px;color:#1a1218;">
                <strong>${athletePrenom} ${athleteNom}</strong> a finalisé son dossier d'inscription.
              </p>
              <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #f3e8eb;border-radius:10px;overflow:hidden;">
                <tr style="background:#fdf8f8;">
                  <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;border-bottom:1px solid #f3e8eb;">Formule</td>
                  <td style="padding:10px 16px;font-size:13px;color:#1a1218;font-weight:700;border-bottom:1px solid #f3e8eb;">${formuleLabel[formule] ?? formule}</td>
                </tr>
                <tr>
                  <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;border-bottom:1px solid #f3e8eb;">Appel visio</td>
                  <td style="padding:10px 16px;font-size:13px;color:#1a1218;font-weight:700;border-bottom:1px solid #f3e8eb;">${optionVisio ? "Oui (+30€/30min)" : "Non"}</td>
                </tr>
                <tr style="background:#fdf8f8;">
                  <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;">Licence LF3</td>
                  <td style="padding:10px 16px;font-size:13px;color:#1a1218;font-weight:700;">${licenceLF3 === "oui" ? "Oui" : "Non"}</td>
                </tr>
              </table>
              <p style="margin:20px 0 0;font-size:13px;color:#9ca3af;">
                Connecte-toi au CRM 3NERGY pour consulter le dossier complet.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from: FROM,
    to: "contact@3nergy.be",
    subject: `Nouveau dossier complété : ${athletePrenom} ${athleteNom}`,
    html,
  });
}
