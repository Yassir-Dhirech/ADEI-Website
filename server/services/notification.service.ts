import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER || 'adei.ensafes@gmail.com',
    pass: process.env.SMTP_PASS
  }
});

const ADMIN_EMAIL = process.env.ADEI_ADMIN_EMAIL || process.env.SMTP_USER || 'adei.ensafes@gmail.com';
const PORTAL_URL = process.env.FRONTEND_URL || 'https://adei-ensaf.ma';

function getEmailTemplate(title: string, bodyContent: string, actionButton?: { label: string; url: string }) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);">
      <!-- En-tête officiel -->
      <div style="background-color: #0b0f19; padding: 28px 24px; text-align: center; border-bottom: 1px solid #1e293b;">
        <p style="margin: 0; font-size: 10px; font-weight: 600; letter-spacing: 2.5px; color: #94a3b8; text-transform: uppercase;">
          École Nationale des Sciences Appliquées de Fès
        </p>
        <h1 style="margin: 8px 0 0; font-size: 18px; font-weight: 700; letter-spacing: 1.5px; color: #ffffff;">
          ADEI ENSA FÈS
        </h1>
        <p style="margin: 4px 0 0; font-size: 11px; color: #64748b;">
          Portail Numérique Officiel — Modération
        </p>
      </div>

      <!-- Corps du message -->
      <div style="padding: 32px 28px; color: #1e293b;">
        <h2 style="margin: 0 0 16px; font-size: 16px; font-weight: 700; color: #0f172a; letter-spacing: -0.2px;">
          ${title}
        </h2>
        
        <div style="font-size: 14px; line-height: 1.65; color: #475569;">
          ${bodyContent}
        </div>

        ${
          actionButton
            ? `
          <div style="text-align: center; margin: 30px 0 10px;">
            <a href="${actionButton.url}" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 13px 26px; border-radius: 10px; letter-spacing: 0.3px;">
              ${actionButton.label}
            </a>
          </div>
        `
            : ''
        }
      </div>

      <!-- Pied de page -->
      <div style="background-color: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
        <p style="margin: 0;">Association des Étudiants Ingénieurs — ENSA de Fès</p>
        <p style="margin: 4px 0 0;">Ce message a été généré automatiquement par le portail de l'ADEI.</p>
      </div>
    </div>
  `;
}

/**
 * 1. Notification vers l'Admin ADEI : Nouvel événement soumis
 */
export async function notifyAdminNewEventSubmission(data: {
  eventTitle: string;
  eventDate: string;
  clubName: string;
  presidentName: string;
  presidentEmail: string;
}): Promise<boolean> {
  if (!process.env.SMTP_PASS) return false;
  try {
    const content = `
      <p>Le président du <strong>${data.clubName}</strong> (${data.presidentName} - ${data.presidentEmail}) a soumis une nouvelle proposition d'événement :</p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0 0 6px; font-weight: 600; color: #0f172a;">Titre : ${data.eventTitle}</p>
        <p style="margin: 0; color: #64748b; font-size: 13px;">Date prévue : ${data.eventDate}</p>
      </div>
      <p>Cet événement est actuellement au statut <strong>En attente</strong> et ne sera pas affiché publiquement tant qu'il n'aura pas été validé.</p>
    `;

    await transporter.sendMail({
      from: `"ADEI ENSA Fès" <${process.env.SMTP_USER}>`,
      to: ADMIN_EMAIL,
      subject: `[ADEI Modération] Nouvel événement proposé par ${data.clubName}`,
      html: getEmailTemplate(
        "Proposition d'événement à valider",
        content,
        { label: "Examiner dans le panneau d'administration", url: `${PORTAL_URL}/admin/events` }
      )
    });
    return true;
  } catch (err) {
    console.error("Erreur notification email admin événement :", err);
    return false;
  }
}

/**
 * 2. Notification vers le Président : Événement approuvé ou refusé
 */
export async function notifyPresidentEventDecision(data: {
  presidentEmail: string;
  presidentName: string;
  eventTitle: string;
  decision: 'approved' | 'rejected';
  rejectionReason?: string;
}): Promise<boolean> {
  if (!process.env.SMTP_PASS) return false;
  try {
    const isApproved = data.decision === 'approved';
    const content = isApproved
      ? `
        <p>Bonjour ${data.presidentName},</p>
        <p>Nous avons le plaisir de vous informer que votre événement <strong>"${data.eventTitle}"</strong> a été formellement validé par le bureau exécutif de l'ADEI.</p>
        <p>Il est désormais publié en ligne sur la plateforme officielle, dans la rubrique Événements et synchronisé avec l'agenda Google du campus.</p>
      `
      : `
        <p>Bonjour ${data.presidentName},</p>
        <p>Votre proposition d'événement <strong>"${data.eventTitle}"</strong> n'a pas pu être retenue par le bureau de l'ADEI.</p>
        ${
          data.rejectionReason
            ? `<div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 14px; margin: 16px 0; color: #991b1b; font-size: 13px;">
                <strong>Motif indiqué :</strong> ${data.rejectionReason}
              </div>`
            : ''
        }
        <p>Vous pouvez corriger les détails ou contacter directement le bureau pour réajuster la date.</p>
      `;

    await transporter.sendMail({
      from: `"ADEI ENSA Fès" <${process.env.SMTP_USER}>`,
      to: data.presidentEmail,
      subject: isApproved
        ? `[ADEI] Votre événement "${data.eventTitle}" a été approuvé`
        : `[ADEI] Statut de votre proposition d'événement`,
      html: getEmailTemplate(
        isApproved ? "Événement validé avec succès" : "Décision concernant votre événement",
        content,
        { label: "Consulter l'Espace Club", url: `${PORTAL_URL}/president/dashboard` }
      )
    });
    return true;
  } catch (err) {
    console.error("Erreur notification email président événement :", err);
    return false;
  }
}

/**
 * 3. Notification vers l'Admin ADEI : Mise à jour de fiche club soumise
 */
export async function notifyAdminClubUpdateSubmission(data: {
  clubName: string;
  presidentName: string;
  presidentEmail: string;
}): Promise<boolean> {
  if (!process.env.SMTP_PASS) return false;
  try {
    const content = `
      <p>Le président du <strong>${data.clubName}</strong> (${data.presidentName} - ${data.presidentEmail}) a soumis des modifications sur la fiche descriptive de son club (activités, contacts, réseaux ou présentation).</p>
      <p>Ces modifications sont actuellement en attente et n'écraseront la fiche publique qu'après votre validation formelle.</p>
    `;

    await transporter.sendMail({
      from: `"ADEI ENSA Fès" <${process.env.SMTP_USER}>`,
      to: ADMIN_EMAIL,
      subject: `[ADEI Modération] Fiche mise à jour pour le club ${data.clubName}`,
      html: getEmailTemplate(
        "Mise à jour de fiche Club à valider",
        content,
        { label: "Examiner dans le panneau Clubs", url: `${PORTAL_URL}/admin/clubs` }
      )
    });
    return true;
  } catch (err) {
    console.error("Erreur notification email admin club :", err);
    return false;
  }
}

/**
 * 4. Notification vers le Président : Fiche club approuvée ou refusée
 */
export async function notifyPresidentClubUpdateDecision(data: {
  presidentEmail: string;
  presidentName: string;
  clubName: string;
  decision: 'approved' | 'rejected';
  rejectionReason?: string;
}): Promise<boolean> {
  if (!process.env.SMTP_PASS) return false;
  try {
    const isApproved = data.decision === 'approved';
    const content = isApproved
      ? `
        <p>Bonjour ${data.presidentName},</p>
        <p>Les modifications apportées à la fiche de votre club <strong>${data.clubName}</strong> ont été approuvées par le bureau de l'ADEI.</p>
        <p>La page publique de votre club a été mise à jour automatiquement.</p>
      `
      : `
        <p>Bonjour ${data.presidentName},</p>
        <p>Les modifications proposées pour le club <strong>${data.clubName}</strong> n'ont pas été validées par le bureau de l'ADEI.</p>
        ${
          data.rejectionReason
            ? `<div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 14px; margin: 16px 0; color: #991b1b; font-size: 13px;">
                <strong>Motif :</strong> ${data.rejectionReason}
              </div>`
            : ''
        }
      `;

    await transporter.sendMail({
      from: `"ADEI ENSA Fès" <${process.env.SMTP_USER}>`,
      to: data.presidentEmail,
      subject: isApproved
        ? `[ADEI] Fiche du club ${data.clubName} mise à jour`
        : `[ADEI] Décision concernant la fiche du club ${data.clubName}`,
      html: getEmailTemplate(
        isApproved ? "Mise à jour validée" : "Décision concernant votre club",
        content,
        { label: "Consulter l'Espace Club", url: `${PORTAL_URL}/president/dashboard` }
      )
    });
    return true;
  } catch (err) {
    console.error("Erreur notification email président club :", err);
    return false;
  }
}