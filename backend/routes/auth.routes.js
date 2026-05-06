import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { Admin } from '../models/Admin.js';

const router = express.Router();
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

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

export default router;
