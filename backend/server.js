import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDb } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import doctorRoutes from './routes/doctor.routes.js';
import availabilityRoutes from './routes/availability.routes.js';
import slotRoutes from './routes/slot.routes.js';
import otpRoutes from './routes/otp.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import { errorHandler } from './middleware/error.js';
import { ensureAdminUser } from './services/admin.service.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const origins = (process.env.FRONTEND_ORIGIN || '').split(',').map((item) => item.trim()).filter(Boolean);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: origins.length ? origins : true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(rateLimit({ windowMs: 60_000, max: 240 }));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'quickbook-api' }));
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/bookings', bookingRoutes);
app.use(errorHandler);

const port = process.env.PORT || 5000;

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

async function startServer() {
  try {
    await connectDb();
    await ensureAdminUser();
    app.listen(port, () => console.log(`QuickBook API running on ${port}`));
  } catch (error) {
    console.error('Startup failed:', error?.message || error);
    if (error?.stack) console.error(error.stack);
    process.exit(1);
  }
}

startServer();
