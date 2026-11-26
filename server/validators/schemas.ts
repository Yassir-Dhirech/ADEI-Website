import { z } from 'zod';

const optionalStr = z.string().trim().optional().nullable();
const optionalUrl = z.string().trim().url('URL invalide').or(z.literal('')).optional().nullable();

// Auth & Users
export const loginSchema = z.object({
  email: z.string().trim().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis')
});

export const sendOtpSchema = z.object({
  email: z.string().trim().email('Adresse email invalide')
});

export const registerSchema = z.object({
  username: z.string().trim().min(2, "Nom d'utilisateur requis (min 2)").max(50),
  email: z.string().trim().email('Email invalide'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une lettre majuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  phone: z.string().trim().min(8, 'Numéro de téléphone requis (min 8 caractères)'),
  filiere: z.string().trim().min(2, 'Filière requise'),
  classe: z.string().trim().min(2, 'Classe requise'),
  requested_role: z.enum(['user', 'president', 'delegue', 'alumni']),
  otp: z.string().trim().min(4, 'Code OTP requis (au moins 4 chiffres)')
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères')
});

export const createUserSchema = z.object({
  username: z.string().trim().min(2, "Nom d'utilisateur requis (min 2)"),
  email: z.string().trim().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  role: z.enum(['user', 'admin']).optional(),
  status: z.enum(['pending', 'active', 'rejected']).optional(),
  phone: optionalStr,
  filiere: optionalStr,
  classe: optionalStr,
  requested_role: z.enum(['user', 'president', 'delegue', 'alumni']).optional(),
  is_president: z.coerce.boolean().optional(),
  is_representant: z.coerce.boolean().optional(),
  is_membre_adei: z.coerce.boolean().optional(),
  is_bureau_adei: z.coerce.boolean().optional()
});

export const updateUserSchema = createUserSchema.partial().extend({
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères').optional().or(z.literal(''))
});

// News & Events
export const newsCreateSchema = z.object({
  title: z.string().trim().min(2, 'Titre requis'),
  content: z.string().trim().min(2, 'Contenu requis'),
  date: z.string().min(4, 'Date requise'),
  clubId: z.union([z.string(), z.number()]).optional().nullable(),
  organizer: optionalStr,
  link: optionalUrl,
  category: optionalStr,
  order_display: z.coerce.number().int().optional()
});
export const newsUpdateSchema = newsCreateSchema.partial();

export const eventCreateSchema = z.object({
  title: z.string().trim().min(2, 'Titre requis'),
  description: z.string().trim().min(2, 'Description requise'),
  date: z.string().min(4, 'Date requise'),
  time: z
    .string()
    .trim()
    .min(1, 'Heure requise')
    .transform((val) => val.replace(/h/i, ':').replace(/^(\d):/, '0$1:'))
    .refine((val) => /^([01]\d|2[0-3]):[0-5]\d$/.test(val), {
      message: "L'heure doit être au format HH:MM (ex: 14:30)"
    }),
  location: z.string().trim().min(1, 'Lieu requis'),
  category: optionalStr,
  clubId: z.union([z.string(), z.number()]).optional().nullable(),
  organizer: optionalStr,
  link: optionalUrl,
  order_display: z.coerce.number().int().optional()
});
export const eventUpdateSchema = eventCreateSchema.partial();

// Clubs
export const clubCreateSchema = z.object({
  club: z.string().trim().min(2, 'Le nom du club doit contenir au moins 2 caractères').max(100, 'Le nom du club ne peut pas dépasser 100 caractères'),
  president: optionalStr,
  presidentId: z.union([z.string(), z.number()]).optional().nullable(),
  annees_etude: z.string().trim().regex(/^(\d{4}[\/-]\d{4})$/, 'Le mandat doit être au format AAAA/AAAA (ex: 2026/2027)').optional().or(z.literal('')).nullable(),
  tel: optionalStr,
  email: z.union([z.string().trim().email('Adresse email invalide'), z.literal('')]).optional().nullable(),
  website: optionalUrl,
  description: optionalStr,
  activities: z.union([z.string(), z.array(z.string())]).optional(),
  achievements: z.union([z.string(), z.array(z.string())]).optional(),
  members: z.coerce.number().int().min(0, 'Le nombre de membres doit être supérieur ou égal à 0').optional(),
  facebook: optionalUrl,
  instagram: optionalUrl,
  linkedin: optionalUrl
});
export const clubUpdateSchema = clubCreateSchema.partial();

// Feedbacks
export const feedbackCreateSchema = z.object({
  name: z.string().trim().min(2, 'Nom requis'),
  email: z.string().trim().email('Email invalide'),
  type: z.enum(['avis', 'recommandation', 'autre']),
  message: z.string().trim().min(2, 'Message requis')
});

// Partners, ADEI Members, Filières, Roles
export const partnerCreateSchema = z.object({
  name: z.string().trim().min(2, 'Nom requis'),
  description: optionalStr,
  website: optionalUrl,
  facebook: optionalUrl,
  instagram: optionalUrl,
  whatsapp: optionalStr,
  isActive: z.coerce.boolean().optional(),
  order_display: z.coerce.number().int().optional()
});
export const partnerUpdateSchema = partnerCreateSchema.partial();

export const adeiMemberCreateSchema = z.object({
  name: z.string().trim().min(2, 'Nom requis'),
  role: z.string().trim().min(2, 'Rôle requis'),
  roleId: z.coerce.number().int().optional().nullable(),
  mandate: z.string().trim().min(4, 'Mandat requis (ex: 2025/2026)').max(20).optional(),
  email: z.string().trim().email('Email invalide')
});
export const adeiMemberUpdateSchema = adeiMemberCreateSchema.partial();

const filiereBaseSchema = z.object({
  name: z.string().trim().min(2, 'Le nom de la filière doit contenir au moins 2 caractères'),
  abbreviation: z.string().trim().min(1, "L'abréviation est requise"),
  type: z.enum(['filiere', 'prepa']).default('filiere'),
  documentation: optionalUrl,
  drive: optionalUrl,
  drives: z.union([z.record(z.string(), z.array(z.object({ label: z.string().trim(), url: z.string().trim() }))), z.string()]).optional().nullable(),
  description: optionalStr,
  isActive: z.coerce.boolean().optional(),
  order_display: z.coerce.number().int().optional(),
  responsable_pedagogique: optionalStr,
  responsable_contact: optionalStr,
  delegue_cp1_a: optionalStr,
  tel_delegue_cp1_a: optionalStr,
  delegue_cp1_b: optionalStr,
  tel_delegue_cp1_b: optionalStr,
  delegue_cp1_c: optionalStr,
  tel_delegue_cp1_c: optionalStr,
  delegue_cp2_a: optionalStr,
  tel_delegue_cp2_a: optionalStr,
  delegue_cp2_b: optionalStr,
  tel_delegue_cp2_b: optionalStr,
  delegue_cp2_c: optionalStr,
  tel_delegue_cp2_c: optionalStr,
  delegue_annee1: optionalStr,
  tel_delegue_annee1: optionalStr,
  delegue_annee2: optionalStr,
  tel_delegue_annee2: optionalStr,
  delegue_annee3: optionalStr,
  tel_delegue_annee3: optionalStr
});
export const filiereCreateSchema = filiereBaseSchema.passthrough();
export const filiereUpdateSchema = filiereBaseSchema.partial().passthrough();

export const adeiRoleCreateSchema = z.object({
  name: z.string().trim().min(2, 'Nom du rôle requis'),
  tier: z.coerce.number().int().min(1).max(10).optional(),
  position: z.coerce.number().int().min(0).optional()
});
export const adeiRoleUpdateSchema = adeiRoleCreateSchema.partial();

// Types TypeScript dérivés directement des schémas Zod (Single Source of Truth)
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type NewsCreateInput = z.infer<typeof newsCreateSchema>;
export type NewsUpdateInput = z.infer<typeof newsUpdateSchema>;
export type EventCreateInput = z.infer<typeof eventCreateSchema>;
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;
export type ClubCreateInput = z.infer<typeof clubCreateSchema>;
export type ClubUpdateInput = z.infer<typeof clubUpdateSchema>;
export type FeedbackCreateInput = z.infer<typeof feedbackCreateSchema>;
export type PartnerCreateInput = z.infer<typeof partnerCreateSchema>;
export type PartnerUpdateInput = z.infer<typeof partnerUpdateSchema>;
export type AdeiMemberCreateInput = z.infer<typeof adeiMemberCreateSchema>;
export type AdeiMemberUpdateInput = z.infer<typeof adeiMemberUpdateSchema>;
export type FiliereCreateInput = z.infer<typeof filiereCreateSchema>;
export type FiliereUpdateInput = z.infer<typeof filiereUpdateSchema>;
export type AdeiRoleCreateInput = z.infer<typeof adeiRoleCreateSchema>;
export type AdeiRoleUpdateInput = z.infer<typeof adeiRoleUpdateSchema>;
