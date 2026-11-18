import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { JWT_SECRET } from '../middleware/auth';

export interface AuthResult {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: 'user' | 'admin';
  };
}

export async function authenticate(email: string, password: string): Promise<AuthResult | null> {
  const user = await User.findOne({ where: { email: email.trim() } });
  if (!user) return null;

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return null;

  const token = jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return {
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role }
  };
}
