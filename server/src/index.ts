import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRouter from './auth';
import statsRouter from './stats';
import adminRoutes from './routes/admin';
import partnersRouter from './routes/partners';
import courierRoutes from './routes/couriers';
import billingRoutes from './routes/billing';
// import billingV2Routes from './routes/billing_v2';
import invoiceRoutes from './routes/invoices';
import salesRoutes from './routes/sales';
import productRoutes from './routes/products';

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options(/(.*)/, cors()); // Explicitly handle preflight using regex for Express 5 compatibility
app.use(express.json());

// Auth & Stats Routes
app.get('/api/health', (req, res) => res.send('OK')); // Simple Health Check
app.use('/api/auth', authRouter);
app.use('/api', statsRouter);
app.use('/api/admin', adminRoutes);
app.use('/api/partners', partnersRouter);

// Domain Routes
app.use('/api/couriers', courierRoutes);
app.use('/api/billing', billingRoutes);
// app.use('/api/billing-v2', billingV2Routes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/sales-executives', salesRoutes);
app.use('/api/products', productRoutes);

// Vercel Serverless Function support
export default app;

if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}
