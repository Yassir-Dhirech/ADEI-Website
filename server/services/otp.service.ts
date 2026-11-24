import nodemailer from 'nodemailer';
import { Op } from 'sequelize';
import { Otp } from '../models';

export async function generateAndSendOtp(email: string): Promise<{ success: boolean; message: string; devOtp?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Supprimer les anciens codes non vérifiés pour cette adresse
  await Otp.destroy({
    where: {
      email: normalizedEmail,
      verified: false
    }
  });

  // Sauvegarder le nouveau code dans Neon PostgreSQL
  await Otp.create({
    email: normalizedEmail,
    code,
    expires_at: expiresAt,
    verified: false
  });

  const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

  if (hasSmtp) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: (process.env.SMTP_PASS || '').replace(/\s+/g, '')
        }
      });

      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);">
          <!-- En-tête sobre et institutionnel -->
          <div style="background-color: #0b0f19; padding: 30px 24px; text-align: center; border-bottom: 1px solid #1e293b;">
            <p style="margin: 0; font-size: 10px; font-weight: 600; letter-spacing: 2.5px; color: #94a3b8; text-transform: uppercase;">
              École Nationale des Sciences Appliquées de Fès
            </p>
            <h1 style="margin: 8px 0 0; font-size: 19px; font-weight: 700; letter-spacing: 1.5px; color: #ffffff;">
              ADEI ENSA FÈS
            </h1>
            <p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">
              Portail Numérique Officiel
            </p>
          </div>

          <!-- Contenu du message -->
          <div style="padding: 36px 30px; color: #1e293b;">
            <h2 style="margin: 0 0 14px; font-size: 17px; font-weight: 700; color: #0f172a; letter-spacing: -0.2px;">
              Bienvenue dans la communauté des ingénieurs
            </h2>
            <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.65; color: #475569;">
              Vous y êtes presque. Pour finaliser la création de votre profil sur le portail de l'ADEI et accéder aux ressources académiques, à la vie de club et aux services du campus, veuillez renseigner votre clé d'authentification temporaire :
            </p>

            <!-- Boîte de code minimaliste & architecturale -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 22px 20px; text-align: center; margin: 0 0 24px;">
              <div style="font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: #64748b; margin-bottom: 8px;">
                Clé de validation temporaire
              </div>
              <span style="font-size: 34px; font-weight: 700; letter-spacing: 12px; color: #0f172a; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; display: inline-block; padding-left: 12px;">
                ${code}
              </span>
            </div>

            <!-- Note de sécurité sobre -->
            <p style="margin: 0 0 10px; font-size: 12px; line-height: 1.6; color: #64748b; text-align: center;">
              Ce code expire dans <strong>10 minutes</strong>. Par mesure de confidentialité, ne le transmettez à personne. Aucun membre de l'ADEI ne vous demandera votre code de confirmation.
            </p>

            <!-- Signature & Pied de page -->
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #f1f5f9; font-size: 11px; line-height: 1.6; color: #94a3b8; text-align: center;">
              Association des Étudiants Ingénieurs — ENSA de Fès<br/>
              Bâtissons ensemble l'expérience étudiante de demain.<br/>
              Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer ce message en toute tranquillité.
            </div>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"ADEI ENSA Fès" <${process.env.SMTP_USER}>`,
        to: normalizedEmail,
        subject: `${code} — Votre code de confirmation ADEI ENSA Fès`,
        html: htmlContent
      });

      return { success: true, message: 'Code de vérification envoyé avec succès !' };
    } catch (err) {
      console.error("Erreur lors de l'envoi de l'email SMTP :", err);
      // Fallback gracieux pour ne pas bloquer si le serveur SMTP a un problème réseau
      return {
        success: true,
        message: 'Code généré (vérifiez vos emails ou la console en mode local)',
        devOtp: process.env.NODE_ENV !== 'production' ? code : undefined
      };
    }
  }

  // Mode local / Développement sans identifiants SMTP
  console.log(`\n==================================================`);
  console.log(`[TEST MODE] Code OTP pour ${normalizedEmail} : ${code}`);
  console.log(`==================================================\n`);

  return {
    success: true,
    message: 'Code envoyé ! (Visible en mode test / logs du serveur)',
    devOtp: code
  };
}

export async function verifyOtpCode(email: string, code: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedCode = code.trim();

  const record = await Otp.findOne({
    where: {
      email: normalizedEmail,
      code: trimmedCode,
      verified: false,
      expires_at: { [Op.gt]: new Date() }
    },
    order: [['createdAt', 'DESC']]
  });

  if (!record) {
    return false;
  }

  // Marquer comme vérifié pour éviter les réutilisations de code
  await record.update({ verified: true });
  return true;
}
