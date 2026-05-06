import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema({
  doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  isBooked: { type: Boolean, default: false },
  isLocked: { type: Boolean, default: false },
  lockToken: { type: String, default: '' },
  lockExpiresAt: { type: Date, default: null }
}, { timestamps: true });

slotSchema.index({ doctor_id: 1, date: 1, time: 1 }, { unique: true });

export const Slot = mongoose.model('Slot', slotSchema);
