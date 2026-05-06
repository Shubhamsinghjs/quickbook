import bcrypt from 'bcryptjs';
import { Admin } from '../models/Admin.js';

export async function ensureAdminUser() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const existing = await Admin.findOne({ email: email.toLowerCase() });
  if (existing) return;

  const passwordHash = await bcrypt.hash(password, 12);
  await Admin.create({ email: email.toLowerCase(), passwordHash });
}
