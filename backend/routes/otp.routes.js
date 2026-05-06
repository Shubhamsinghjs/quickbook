import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { Otp } from '../models/Otp.js';
import { sendEmail } from '../services/email.service.js';

const router = express.Router();
const emailSchema = z.object({ email: z.string().email() });
const verifySchema = z.object({ email: z.string().email(), code: z.string().min(4).max(8) });

router.post('/send', async (req, res, next) => {
  try {
    const { email } = emailSchema.parse(req.body);
    const code = crypto.randomInt(100000, 999999).toString();
    await Otp.deleteMany({ email: email.toLowerCase() });
    await Otp.create({
      email: email.toLowerCase(),
      codeHash: await bcrypt.hash(code, 10),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });
    await sendEmail({
      to: email,
      subject: 'Your QuickBook verification code',
      html: `<p>Your QuickBook OTP is <strong>${code}</strong>. It expires in 5 minutes.</p>`
    });
    res.json({ ok: true, message: 'OTP sent to email' });
  } catch (err) {
    next(err);
  }
});

router.post('/verify', async (req, res, next) => {
  try {
    const { email, code } = verifySchema.parse(req.body);
    const record = await Otp.findOne({ email: email.toLowerCase(), expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
    if (!record || record.attempts >= 5 || !(await bcrypt.compare(code, record.codeHash))) {
      if (record) {
        record.attempts += 1;
        await record.save();
      }
      throw Object.assign(new Error('Invalid OTP'), { status: 400 });
    }
    record.verified = true;
    await record.save();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
