export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: PaginationMeta;
  error?: { code: string; message: string; details?: Array<{ field?: string; message: string }> };
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  status?: 'pending' | 'active' | 'rejected';
  phone?: string | null;
  filiere?: string | null;
  classe?: string | null;
  requested_role?: 'user' | 'president' | 'delegue' | 'alumni';
  is_president?: boolean;
  is_representant?: boolean;
  is_membre_adei?: boolean;
  is_bureau_adei?: boolean;
  lastPasswordChange?: string | null;
  createdAt?: string;
}

export interface NewsItem {
  id: number;
  title: string;
  content: string;
  date: string;
  organizer?: string | null;
  category?: string | null;
  image?: string | null;
  document?: string | null;
  link?: string | null;
  clubId?: number | null;
}

export interface EventItem {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category?: string;
  organizer?: string | null;
  image?: string | null;
  link?: string | null;
  status?: 'draft' | 'pending' | 'approved' | 'rejected';
  rejectionReason?: string | null;
  submittedBy?: number | null;
  clubId?: number | null;
  submitter?: { id: number; username: string; email: string } | null;
  club?: { id: number; club: string; president: string } | null;
}

export interface ClubItem {
  id: number;
  club: string;
  president: string;
  annees_etude: string;
  tel: string;
  email: string;
  website: string;
  image: string;
  description: string;
  activities: string[];
  achievements: string[];
  members: number;
  facebook: string;
  instagram: string;
  linkedin: string;
  pendingUpdates?: Record<string, unknown> | null;
  pendingUpdatesAt?: string | null;
  pendingUpdatesSubmittedBy?: number | null;
  presidentId?: number | null;
  presidentUser?: { id: number; username: string; email: string } | null;
}

export interface DriveLink {
  label: string;
  url: string;
}

export interface FiliereItem {
  id: number;
  name: string;
  abbreviation: string;
  type: 'filiere' | 'prepa';
  description?: string | null;
  documentation?: string | null;
  drive?: string | null;
  drives?: Record<string, DriveLink[]> | null;
  isActive?: boolean;
  order_display?: number;
  responsable_pedagogique?: string | null;
  responsable_contact?: string | null;
  delegue_cp1_a?: string | null;
  tel_delegue_cp1_a?: string | null;
  delegue_cp1_b?: string | null;
  tel_delegue_cp1_b?: string | null;
  delegue_cp1_c?: string | null;
  tel_delegue_cp1_c?: string | null;
  delegue_cp2_a?: string | null;
  tel_delegue_cp2_a?: string | null;
  delegue_cp2_b?: string | null;
  tel_delegue_cp2_b?: string | null;
  delegue_cp2_c?: string | null;
  tel_delegue_cp2_c?: string | null;
  delegue_annee1?: string | null;
  tel_delegue_annee1?: string | null;
  delegue_annee2?: string | null;
  tel_delegue_annee2?: string | null;
  delegue_annee3?: string | null;
  tel_delegue_annee3?: string | null;
}

export interface PartnerItem {
  id: number;
  name: string;
  description?: string | null;
  website?: string | null;
  logo?: string | null;
}

export interface AdeiMemberItem {
  id: number;
  name: string;
  role: string;
  roleId?: number | null;
  mandate?: string;
  email: string;
  photo?: string | null;
  roleInfo?: {
    id: number;
    name: string;
    tier: number;
    position: number;
  } | null;
}

export interface FeedbackItem {
  id: number;
  name: string;
  email?: string;
  type: 'avis' | 'recommandation' | 'autre';
  message: string;
  read?: boolean;
  isPublished?: boolean;
  createdAt: string;
}

