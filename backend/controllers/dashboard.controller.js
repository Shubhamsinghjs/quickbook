import { Booking } from '../models/Booking.js';
import { Doctor } from '../models/Doctor.js';

export async function getDashboardStats(_req, res, next) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [totalDoctors, totalBookings, upcomingAppointments, completedAppointments] = await Promise.all([
      Doctor.countDocuments({ isActive: true }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'booked', date: { $gte: today } }),
      Booking.countDocuments({ status: 'completed' })
    ]);
    res.json({ totalDoctors, totalBookings, upcomingAppointments, completedAppointments });
  } catch (err) {
    next(err);
  }
}
