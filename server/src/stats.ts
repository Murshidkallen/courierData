import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './middleware';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/stats', authenticateToken, async (req: any, res) => {
    try {
        const user = req.user;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let where: any = {};

        if (user.role === 'PARTNER') {
            const partnerProfile = await prisma.partner.findUnique({ where: { userId: user.id } });
            if (partnerProfile) where.partnerId = partnerProfile.id;
            else where.id = -1; // No profile, no data
        } else if (user.role === 'STAFF') {
            where.enteredById = user.id;
        }

        const couriers = await prisma.courier.findMany({ where });

        // Basic KPI
        const totalOrders = couriers.length;

        // Conditional Metrics
        let totalProfit = 0;
        if (user.role === 'PARTNER') {
            // Partners: Profit = My Earnings (Courier Cost)
            totalProfit = couriers.reduce((sum, c) => sum + (c.courierCost || 0), 0);
        } else {
            // Admin/Staff: Profit = (Total Paid - Costs)
            totalProfit = couriers.reduce((sum, c) => sum + (c.profit || 0), 0);
        }

        const todayOrders = couriers.filter(c => new Date(c.date) >= today).length;

        // Partner: Pending Costs = Pending Deliveries?
        // Let's reuse field for "Active Orders" (Status != Delivered/Returned)
        const pendingCosts = couriers.filter(c =>
            c.status !== 'Delivered' && c.status !== 'Returned'
        ).length;

        // Total Sales (Sum of totalPaid)
        const totalSales = couriers.reduce((sum, c) => sum + (c.totalPaid || 0), 0);

        // Chart Data (Last 7 days)
        const chartData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });

            const dayCouriers = couriers.filter(c => {
                const cd = new Date(c.date);
                return cd.getDate() === d.getDate() && cd.getMonth() === d.getMonth();
            });

            chartData.push({
                name: dayStr,
                profit: user.role === 'PARTNER'
                    ? dayCouriers.reduce((sum, c) => sum + (c.courierCost || 0), 0) // Partner Earnings
                    : dayCouriers.reduce((sum, c) => sum + (c.profit || 0), 0),      // Total Profit
                expenses: user.role === 'PARTNER'
                    ? 0 // Partners don't see expenses here
                    : dayCouriers.reduce((sum, c) => sum + (c.courierCost || 0) + (c.packingCost || 0) + (c.commissionAmount || 0), 0)
            });
        }

        res.json({
            kpi: { totalOrders, totalProfit, totalSales, todayOrders, pendingCosts },
            chartData
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

export default router;
