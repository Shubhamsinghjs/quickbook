import mongoose from 'mongoose';

const slotLockSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

slotLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
slotLockSchema.index({ doctor: 1, date: 1, time: 1 }, { unique: true });

export const SlotLock = mongoose.model('SlotLock', slotLockSchema);
