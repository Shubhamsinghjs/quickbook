import express from 'express';
import { z } from 'zod';
import { generateSlots, lockSlot } from '../services/slot.service.js';

const router = express.Router();
const lockSchema = z.object({
  doctor: z.string().min(1),
  date: z.string().min(10),
  time: z.string().min(4)
});

router.get('/:doctorId', async (req, res, next) => {
  try {
    const slots = await generateSlots(req.params.doctorId, req.query.from, req.query.days);
    res.json(slots);
  } catch (err) {
    next(err);
  }
});

router.post('/lock', async (req, res, next) => {
  try {
    const lock = await lockSlot(lockSchema.parse(req.body));
    res.status(201).json({
      token: lock.token,
      expiresAt: lock.expiresAt,
      expiresInSeconds: Math.max(0, Math.round((lock.expiresAt.getTime() - Date.now()) / 1000))
    });
  } catch (err) {
    next(err);
  }
});

export default router;
