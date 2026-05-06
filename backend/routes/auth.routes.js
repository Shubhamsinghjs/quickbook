import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { Admin } from '../models/Admin.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
});

router.post('/login', async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const admin = await Admin.findOne({ email: input.email.toLowerCase() });
    if (!admin || !(await bcrypt.compare(input.password, admin.passwordHash))) {
      throw Object.assign(new Error('Invalid email or password'), { status: 401 });
    }
    const token = jwt.sign({ sub: admin._id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: '12h' });
    res.json({ token, admin: { email: admin.email } });
  } catch (err) {
    next(err);
  }
});

router.patch('/change-password', requireAdmin, async (req, res, next) => {
  try {
    const input = changePasswordSchema.parse(req.body);
    const admin = await Admin.findById(req.admin.sub);
    if (!admin) throw Object.assign(new Error('Admin not found'), { status: 404 });
    const ok = await bcrypt.compare(input.currentPassword, admin.passwordHash);
    if (!ok) throw Object.assign(new Error('Current password is incorrect'), { status: 400 });
    admin.passwordHash = await bcrypt.hash(input.newPassword, 12);
    await admin.save();
    res.json({ ok: true, message: 'Password updated' });
  } catch (err) {
    next(err);
  }
});

export default router;
