import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp = mongoose.model('Otp', otpSchema);
