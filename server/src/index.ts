import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRouter from './routes/auth.routes.js';
import eventRouter from './routes/event.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

import { eventSessionRouter, sessionRouter } from './routes/session.routes.js';
import registrationRouter from './routes/registration.routes.js';
import meRouter from './routes/me.routes.js';
import { startExpirationJob } from './utils/jobs.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy' });
});

import dashboardRouter from './routes/dashboard.routes.js';
import alertRouter from './routes/alert.routes.js';

app.use('/api/auth', authRouter);
app.use('/api/events', eventRouter);
app.use('/api/events/:eventId/sessions', eventSessionRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/registrations', registrationRouter);
app.use('/api/me', meRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/alerts', alertRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startExpirationJob();
  });
}

export default app;
