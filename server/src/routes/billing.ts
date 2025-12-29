import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware';

const router = express.Router();
const prisma = new PrismaClient();

// Get Billing Stats (Current Month)
router.get('/stats', authenticateToken, async (req, res) => {
    const user = (req as AuthRequest).user;
    if (!user) return res.sendStatus(403);

    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const where: any = {
            date: { gte: startOfMonth, lte: endOfMonth }
        };

        if (user.role === 'PARTNER') {
            const partnerProfile = await prisma.partner.findUnique({ where: { userId: user.id } });
            if (partnerProfile) where.partnerId = partnerProfile.id;
        } else if (user.role === 'STAFF') {
            where.enteredById = user.id;
        }

        const couriers = await prisma.courier.findMany({ where });

        let totalAmount = 0;
        if (user.role === 'PARTNER') {
            // Partners invoice for Courier Cost (Service Fee)
            totalAmount = couriers.reduce((sum, c) => sum + (c.courierCost || 0), 0);
        } else {
            // Staff/Others invoice for Total Paid (Cash Collected)
            totalAmount = couriers.reduce((sum, c) => sum + (c.totalPaid || 0), 0);
        }

        res.json({
            ordersCount: couriers.length,
            totalAmount,
            month: startOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' })
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch billing stats' });
    }
});

export default router;
