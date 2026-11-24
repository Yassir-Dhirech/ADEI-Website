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
          pass: process.env.SMTP_PASS
        }
      });

      const htmlContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; background-color: #ffffff; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
          <div style="background: linear-gradient(135deg, #991b1b 0%, #dc2626 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">ADEI ENSA FÈS</h1>
            <p style="margin: 6px 0 0; font-size: 13px; color: #fecaca;">Association des Étudiants Ingénieurs</p>
          </div>
          <div style="padding: 32px 28px; color: #1e293b;">
            <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 700; color: #0f172a;">Vérification de votre compte</h2>
            <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #64748b;">
              Bonjour, vous avez initié une demande d'inscription sur le portail officiel de l'ADEI. Utilisez le code de vérification ci-dessous pour confirmer votre adresse email :
            </p>
            <div style="background-color: #fef2f2; border: 2px dashed #f87171; border-radius: 14px; padding: 20px; text-align: center; margin: 0 0 24px;">
              <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #dc2626; font-family: monospace;">${code}</span>
            </div>
            <p style="margin: 0 0 12px; font-size: 12px; color: #94a3b8; text-align: center;">
              ⏳ Ce code est valable pendant <strong>10 minutes</strong>. Ne le partagez avec personne.
            </p>
            <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; text-align: center;">
              Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.
            </div>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"ADEI ENSA Fès" <${process.env.SMTP_USER}>`,
        to: normalizedEmail,
        subject: `🔑 ${code} est votre code de vérification ADEI ENSA Fès`,
        html: htmlContent
      });

      return { success: true, message: 'Code OTP envoyé par email avec succès !' };
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
  console.log(`🔑 [SIMULATION EMAIL OTP] Code pour ${normalizedEmail} : ${code}`);
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
