import express from 'express';
import { z } from 'zod';
import { requireAdmin } from '../middleware/auth.js';
import { Availability } from '../models/Availability.js';

const router = express.Router();
const schema = z.object({
  workingDays: z.array(z.coerce.number().min(0).max(6)).default([]),
  slotDurationMinutes: z.coerce.number().min(5).max(240).default(30),
  slots: z.array(z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/)
  })).default([]),
  blockedDates: z.array(z.string()).default([])
});

router.get('/:doctorId', async (req, res, next) => {
  try {
    const availability = await Availability.findOne({ doctor: req.params.doctorId });
    res.json(availability || {
      doctor: req.params.doctorId,
      workingDays: [],
      slotDurationMinutes: 30,
      slots: [],
      blockedDates: []
    });
  } catch (err) {
    next(err);
  }
});

router.put('/:doctorId', requireAdmin, async (req, res, next) => {
  try {
    const input = schema.parse(req.body);
    const availability = await Availability.findOneAndUpdate(
      { doctor: req.params.doctorId },
      { doctor: req.params.doctorId, ...input },
      { upsert: true, new: true }
    );
    res.json(availability);
  } catch (err) {
    next(err);
  }
});

export default router;
