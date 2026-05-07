import express from 'express';
import { z } from 'zod';
import { requireAdmin } from '../middleware/auth.js';
import { Booking } from '../models/Booking.js';
import { Doctor } from '../models/Doctor.js';
import { Otp } from '../models/Otp.js';
import { SlotLock } from '../models/SlotLock.js';
import { getDashboardStats } from '../controllers/dashboard.controller.js';
import { bookingSummaryHtml, sendEmail } from '../services/email.service.js';
import { clearExpiredLocks } from '../services/slot.service.js';

const router = express.Router();
const bookingSchema = z.object({
  doctor: z.string().min(1),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  date: z.string().min(10),
  time: z.string().min(4),
  lockToken: z.string().min(10)
});

router.get('/stats', requireAdmin, getDashboardStats);

router.post('/', async (req, res, next) => {
  try {
    await clearExpiredLocks();
    const input = bookingSchema.parse(req.body);
    const [doctor, lock] = await Promise.all([
      Doctor.findById(input.doctor),
      SlotLock.findOne({ doctor: input.doctor, date: input.date, time: input.time, token: input.lockToken, expiresAt: { $gt: new Date() } })
    ]);

    if (!doctor) throw Object.assign(new Error('Doctor not found'), { status: 404 });
    if (!lock) throw Object.assign(new Error('Slot lock expired. Please select the slot again'), { status: 409 });

    const existing = await Booking.exists({ doctor: input.doctor, date: input.date, time: input.time, status: 'booked' });
    if (existing) throw Object.assign(new Error('This slot is already booked'), { status: 409 });

    const booking = await Booking.create({
      doctor: input.doctor,
      name: input.name,
      email: input.email,
      phone: input.phone,
      date: input.date,
      time: input.time,
      status: 'booked',
      paymentMode: 'COD'
    });
    await SlotLock.deleteOne({ _id: lock._id });

    const html = bookingSummaryHtml(booking, doctor);
    // Send emails in background without blocking the response, but with proper error logging
    sendEmail({ to: input.email, subject: 'QuickBook appointment confirmed', html }).catch(err => console.error('Booking Confirmation Email Error:', err.message));
    if (process.env.ADMIN_NOTIFY_EMAIL) {
      sendEmail({ to: process.env.ADMIN_NOTIFY_EMAIL, subject: 'New QuickBook appointment', html }).catch(err => console.error('Admin Notification Email Error:', err.message));
    }

    res.status(201).json(await booking.populate('doctor'));
  } catch (err) {
    if (err?.code === 11000) err = Object.assign(new Error('This slot is already booked'), { status: 409 });
    next(err);
  }
});

router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const query = {};
    if (req.query.doctor) query.doctor = req.query.doctor;
    if (req.query.date) query.date = req.query.date;
    if (req.query.status) query.status = req.query.status;
    res.json(await Booking.find(query).populate('doctor').sort({ date: -1, time: -1 }));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { status } = z.object({ status: z.enum(['booked', 'completed', 'cancelled']) }).parse(req.body);
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('doctor');
    
    if (booking) {
      let statusHtml = `<h2>Appointment Status Updated</h2><p>Your appointment with ${booking.doctor.name} on ${booking.date} at ${booking.time} is now <strong>${status}</strong>.</p>`;
      await sendEmail({ to: booking.email, subject: `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}`, html: statusHtml }).catch(console.error);
    }
    
    res.json(booking);
  } catch (err) {
    next(err);
  }
});

router.post('/test-email', requireAdmin, async (req, res, next) => {
  try {
    const { to } = z.object({ to: z.string().email() }).parse(req.body);
    await sendEmail({ 
      to, 
      subject: 'QuickBook Email Test', 
      html: '<h1>Success!</h1><p>If you see this, your email configuration is working correctly.</p>' 
    });
    res.json({ message: 'Test email sent successfully. Please check your inbox (and spam folder).' });
  } catch (err) {
    res.status(500).json({ message: 'Email test failed: ' + err.message });
  }
});

export default router;
