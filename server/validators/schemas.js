const { z } = require('zod');

const optionalStr = z.string().trim().optional().nullable();
const optionalUrl = z.string().trim().url('URL invalide').or(z.literal('')).optional().nullable();

// Auth & Users
const loginSchema = z.object({
  email: z.string().trim().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis')
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères')
});

const createUserSchema = z.object({
  username: z.string().trim().min(2, "Nom d'utilisateur requis (min 2)"),
  email: z.string().trim().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  role: z.enum(['user', 'admin']).optional(),
  is_president: z.boolean().optional(),
  is_representant: z.boolean().optional(),
  is_membre_adei: z.boolean().optional(),
  is_bureau_adei: z.boolean().optional()
});

const updateUserSchema = createUserSchema.partial().extend({
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères').optional().or(z.literal(''))
});

// News & Events
const newsCreateSchema = z.object({
  title: z.string().trim().min(2, 'Titre requis'),
  content: z.string().trim().min(2, 'Contenu requis'),
  date: z.string().min(4, 'Date requise'),
  clubId: z.union([z.string(), z.number()]).optional().nullable(),
  organizer: optionalStr,
  link: optionalUrl,
  category: optionalStr,
  order_display: z.coerce.number().int().optional()
});
const newsUpdateSchema = newsCreateSchema.partial();

const eventCreateSchema = z.object({
  title: z.string().trim().min(2, 'Titre requis'),
  description: z.string().trim().min(2, 'Description requise'),
  date: z.string().min(4, 'Date requise'),
  time: z.string().trim().min(1, 'Heure requise'),
  location: z.string().trim().min(1, 'Lieu requis'),
  category: optionalStr,
  clubId: z.union([z.string(), z.number()]).optional().nullable(),
  organizer: optionalStr,
  link: optionalUrl,
  order_display: z.coerce.number().int().optional()
});
const eventUpdateSchema = eventCreateSchema.partial();

// Clubs
const clubCreateSchema = z.object({
  club: z.string().trim().min(2, 'Nom du club requis'),
  president: z.string().trim().min(2, 'Président requis'),
  annees_etude: z.string().trim().min(1, "Année d'étude requise"),
  tel: z.string().trim().min(6, 'Téléphone requis'),
  email: z.string().trim().email('Email invalide'),
  website: optionalUrl,
  description: optionalStr,
  activities: z.union([z.string(), z.array(z.string())]).optional(),
  achievements: z.union([z.string(), z.array(z.string())]).optional(),
  members: z.coerce.number().int().min(0).optional(),
  facebook: optionalUrl,
  instagram: optionalUrl,
  linkedin: optionalUrl
});
const clubUpdateSchema = clubCreateSchema.partial();

// Feedbacks
const feedbackCreateSchema = z.object({
  name: z.string().trim().min(2, 'Nom requis'),
  email: z.string().trim().email('Email invalide'),
  type: z.enum(['avis', 'recommandation', 'autre']),
  message: z.string().trim().min(2, 'Message requis')
});

// Partners, ADEI Members, Filières, Roles
const partnerCreateSchema = z.object({
  name: z.string().trim().min(2, 'Nom requis'),
  description: optionalStr,
  website: optionalUrl,
  facebook: optionalUrl,
  instagram: optionalUrl,
  whatsapp: optionalStr,
  isActive: z.coerce.boolean().optional(),
  order_display: z.coerce.number().int().optional()
});
const partnerUpdateSchema = partnerCreateSchema.partial();

const adeiMemberCreateSchema = z.object({
  name: z.string().trim().min(2, 'Nom requis'),
  role: z.string().trim().min(2, 'Rôle requis'),
  roleId: z.coerce.number().int().optional().nullable(),
  email: z.string().trim().email('Email invalide')
});
const adeiMemberUpdateSchema = adeiMemberCreateSchema.partial();

const filiereBaseSchema = z.object({
  name: z.string().trim().min(2, 'Nom requis'),
  abbreviation: z.string().trim().min(1, 'Abréviation requise'),
  type: z.enum(['filiere', 'prepa']).optional(),
  documentation: optionalUrl,
  drive: optionalUrl,
  description: optionalStr,
  isActive: z.coerce.boolean().optional(),
  order_display: z.coerce.number().int().optional()
});
const filiereCreateSchema = filiereBaseSchema.passthrough();
const filiereUpdateSchema = filiereBaseSchema.partial().passthrough();

const adeiRoleCreateSchema = z.object({
  name: z.string().trim().min(2, 'Nom du rôle requis'),
  tier: z.coerce.number().int().min(1).max(10).optional(),
  position: z.coerce.number().int().min(0).optional()
});
const adeiRoleUpdateSchema = adeiRoleCreateSchema.partial();

module.exports = {
  loginSchema, changePasswordSchema, createUserSchema, updateUserSchema,
  newsCreateSchema, newsUpdateSchema, eventCreateSchema, eventUpdateSchema,
  clubCreateSchema, clubUpdateSchema, feedbackCreateSchema,
  partnerCreateSchema, partnerUpdateSchema, adeiMemberCreateSchema, adeiMemberUpdateSchema,
  filiereCreateSchema, filiereUpdateSchema, adeiRoleCreateSchema, adeiRoleUpdateSchema
};