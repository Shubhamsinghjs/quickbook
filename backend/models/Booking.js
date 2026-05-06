import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, enum: ['booked', 'completed', 'cancelled'], default: 'booked' },
  paymentMode: { type: String, default: 'COD' }
}, { timestamps: true });

bookingSchema.index(
  { doctor: 1, date: 1, time: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'booked' } }
);

export const Booking = mongoose.model('Booking', bookingSchema);
