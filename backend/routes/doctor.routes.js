import express from 'express';
import multer from 'multer';
import path from 'path';
import { z } from 'zod';
import { requireAdmin } from '../middleware/auth.js';
import { Doctor } from '../models/Doctor.js';

const router = express.Router();
const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads',
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`)
  })
});

const doctorSchema = z.object({
  name: z.string().min(2),
  experience: z.string().min(1),
  price: z.coerce.number().min(0),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  specializations: z.union([z.string(), z.array(z.string())]).optional(),
  description: z.string().optional(),
  locationName: z.string().optional(),
  address: z.string().optional(),
  isActive: z.coerce.boolean().optional()
});

function normalize(input, file) {
  const parsed = doctorSchema.parse(input);
  const specializations = parsed.specializations || parsed.tags || [];
  const normalizedSpecializations = typeof specializations === 'string'
    ? specializations.split(',').map((tag) => tag.trim()).filter(Boolean)
    : specializations;
  return {
    ...parsed,
    tags: normalizedSpecializations,
    specializations: normalizedSpecializations,
    ...(file ? { image: `/uploads/${file.filename}` } : {})
  };
}

router.get('/', async (_req, res, next) => {
  try {
    const doctors = await Doctor.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(doctors);
  } catch (err) {
    next(err);
  }
});

router.get('/admin/all', requireAdmin, async (_req, res, next) => {
  try {
    res.json(await Doctor.find().sort({ createdAt: -1 }));
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAdmin, upload.single('image'), async (req, res, next) => {
  try {
    res.status(201).json(await Doctor.create(normalize(req.body, req.file)));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireAdmin, upload.single('image'), async (req, res, next) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, normalize(req.body, req.file), { new: true });
    res.json(doctor);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    await Doctor.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
