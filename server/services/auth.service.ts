import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { JWT_SECRET } from '../middleware/auth';
import { RegisterInput } from '../validators/schemas';

export interface SafeAuthUser {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  status: 'pending' | 'active' | 'rejected';
  phone?: string | null;
  filiere?: string | null;
  classe?: string | null;
  requested_role?: 'user' | 'president' | 'delegue' | 'alumni';
  is_president: boolean;
  is_representant: boolean;
  is_membre_adei: boolean;
  is_bureau_adei: boolean;
}

export type AuthResult =
  | { success: true; token: string; user: SafeAuthUser }
  | { success: false; code: 'INVALID_CREDENTIALS' | 'ACCOUNT_PENDING' | 'ACCOUNT_REJECTED' };

export async function authenticate(email: string, password: string): Promise<AuthResult> {
  const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
  if (!user) return { success: false, code: 'INVALID_CREDENTIALS' };

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return { success: false, code: 'INVALID_CREDENTIALS' };

  if (user.status === 'pending') {
    return { success: false, code: 'ACCOUNT_PENDING' };
  }

  if (user.status === 'rejected') {
    return { success: false, code: 'ACCOUNT_REJECTED' };
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      is_president: user.is_president,
      is_representant: user.is_representant
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return {
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone,
      filiere: user.filiere,
      classe: user.classe,
      requested_role: user.requested_role,
      is_president: user.is_president,
      is_representant: user.is_representant,
      is_membre_adei: user.is_membre_adei,
      is_bureau_adei: user.is_bureau_adei
    }
  };
}

export async function register(data: RegisterInput): Promise<
  | { success: true; user: SafeAuthUser }
  | { success: false; code: 'EMAIL_EXISTS' | 'USERNAME_EXISTS' }
> {
  const normalizedEmail = data.email.trim().toLowerCase();
  const normalizedUsername = data.username.trim();

  const existingEmail = await User.findOne({ where: { email: normalizedEmail } });
  if (existingEmail) return { success: false, code: 'EMAIL_EXISTS' };

  const existingUsername = await User.findOne({ where: { username: normalizedUsername } });
  if (existingUsername) return { success: false, code: 'USERNAME_EXISTS' };

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await User.create({
    username: normalizedUsername,
    email: normalizedEmail,
    password: hashedPassword,
    role: 'user',
    status: 'pending', // En attente de validation ADEI
    phone: data.phone.trim(),
    filiere: data.filiere.trim(),
    classe: data.classe.trim(),
    requested_role: data.requested_role,
    is_president: false,
    is_representant: false,
    is_membre_adei: false,
    is_bureau_adei: false
  });

  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone,
      filiere: user.filiere,
      classe: user.classe,
      requested_role: user.requested_role,
      is_president: user.is_president,
      is_representant: user.is_representant,
      is_membre_adei: user.is_membre_adei,
      is_bureau_adei: user.is_bureau_adei
    }
  };
}
