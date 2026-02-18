import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from './middleware';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/stats', authenticateToken, async (req: any, res) => {
    try {
        const user = req.user;
        const { startDate, endDate } = req.query;

        // Restore anchorDate for Chart Logic (Use EndDate or Today)
        const anchorDate = endDate ? new Date(String(endDate)) : new Date();
        anchorDate.setHours(23, 59, 59, 999);

        // Restore today for KPI Logic
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let dateFilter: any = {};
        if (startDate && endDate) {
            const start = new Date(String(startDate));
            start.setHours(0, 0, 0, 0); // Explicit start
            dateFilter = {
                gte: start,
                lte: anchorDate // Use consistent end
            };
        }

        let where: any = {
            ...(dateFilter.gte ? { date: dateFilter } : {})
        };

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
            // If Returned, Partner still gets paid? "courier cost will be exist". Assuming Partner keeps it?
            // User context: "courier cost will be exist and countable" -> implies Expense for Admin.
            // For Partner, it's Income. So yes, count it.
            totalProfit = couriers.reduce((sum, c) => sum + (c.courierCost || 0), 0);
        } else {
            // Admin/Staff:
            // If Returned: Revenue=0, Expense=CourierCost. Profit = -CourierCost.
            totalProfit = couriers.reduce((sum, c) => {
                if (c.status === 'Returned') {
                    // Loss of courier cost
                    return sum - (c.courierCost || 0);
                }
                return sum + (c.profit || 0);
            }, 0);
        }

        const todayOrders = couriers.filter(c => new Date(c.date) >= today).length;

        // Partner: Pending Costs = Pending Deliveries?
        // Let's reuse field for "Active Orders" (Status != Delivered/Returned)
        const pendingCosts = couriers.filter(c =>
            c.status !== 'Delivered' && c.status !== 'Returned'
        ).length;

        // Total Sales (Sum of totalPaid) - Exclude Returned
        const totalSales = couriers.reduce((sum, c) => {
            if (c.status === 'Returned') return sum;
            return sum + (c.totalPaid || 0);
        }, 0);

        // Chart Data (Dynamic Range)
        const chartStart = dateFilter.gte ? new Date(dateFilter.gte) : new Date(new Date().setDate(new Date().getDate() - 6));
        const chartEnd = anchorDate;

        // Calculate total days
        const diffTime = Math.abs(chartEnd.getTime() - chartStart.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const chartData = [];
        // Iterate from start to end (inclusive)
        for (let i = 0; i <= diffDays; i++) {
            const d = new Date(chartStart);
            d.setDate(d.getDate() + i);
            d.setHours(0, 0, 0, 0);

            // Safety check to not exceed anchorDate
            if (d > chartEnd) break;

            const dayStr = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });

            const dayCouriers = couriers.filter(c => {
                const cd = new Date(c.date);
                return cd.getDate() === d.getDate() && cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
            });

            chartData.push({
                name: dayStr,
                profit: user.role === 'PARTNER'
                    ? dayCouriers.reduce((sum, c) => sum + (c.courierCost || 0), 0)
                    : dayCouriers.reduce((sum, c) => {
                        if (c.status === 'Returned') return sum - (c.courierCost || 0);
                        return sum + (c.profit || 0);
                    }, 0),
                expenses: user.role === 'PARTNER'
                    ? 0
                    : dayCouriers.reduce((sum, c) => sum + (c.courierCost || 0) + (c.packingCost || 0) + (c.commissionAmount || 0), 0),
                totalSales: user.role === 'PARTNER'
                    ? 0
                    : dayCouriers.reduce((sum, c) => {
                        if (c.status === 'Returned') return sum;
                        return sum + (c.totalPaid || 0);
                    }, 0)
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

router.get('/stats/super-admin', authenticateToken, async (req: any, res) => {
    try {
        const user = req.user;
        if (user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { startDate, endDate } = req.query;

        // Date Range Logic
        const now = new Date();
        // Default to current month if not specified
        const start = startDate ? new Date(String(startDate)) : new Date(now.getFullYear(), now.getMonth(), 1);
        const end = endDate ? new Date(String(endDate)) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        const dateFilter = {
            gte: start,
            lte: end
        };

        // Fetch All Couriers in Range
        const couriers = await prisma.courier.findMany({
            where: { date: dateFilter },
            include: {
                partner: true
            }
        });

        // --- 1. Global Metrics ---
        const totalOrders = couriers.length;

        // Revenue: Exclude Returned
        const totalRevenue = couriers.reduce((sum, c) => {
            if (c.status === 'Returned') return sum;
            return sum + (c.totalPaid || 0);
        }, 0);

        // Profit: Account for Returned Loss
        const totalProfit = couriers.reduce((sum, c) => {
            if (c.status === 'Returned') {
                return sum - (c.courierCost || 0); // Loss
            }
            return sum + (c.profit || 0);
        }, 0);

        const activePartnersCount = new Set(couriers.map(c => c.partnerId).filter(Boolean)).size;

        // --- 2. Partner Performance ---
        const partnerMap = new Map();

        couriers.forEach(c => {
            if (!c.partner) return;
            const pid = c.partner.id;
            if (!partnerMap.has(pid)) {
                partnerMap.set(pid, {
                    id: pid,
                    name: c.partner.name,
                    orders: 0,
                    revenue: 0,
                    profit: 0
                });
            }
            const p = partnerMap.get(pid);
            p.orders += 1;
            if (c.status !== 'Returned') {
                p.revenue += (c.totalPaid || 0);
                p.profit += (c.profit || 0);
            } else {
                p.profit -= (c.courierCost || 0);
            }
        });

        const partnerPerformance = Array.from(partnerMap.values())
            .sort((a: any, b: any) => b.orders - a.orders); // Sort by volume high to low

        // --- 3. Chart Data (Daily Trend) ---
        const chartData = [];
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        for (let i = 0; i <= diffDays; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            const dayStr = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });

            // Optimization: Filter from already fetched 'couriers' array mostly sorted by date usually, but filter is fine for reasonable size
            const dayCouriers = couriers.filter(c => {
                const cd = new Date(c.date);
                return cd.getDate() === d.getDate() && cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
            });

            const dayRevenue = dayCouriers.reduce((sum, c) => (c.status === 'Returned' ? sum : sum + (c.totalPaid || 0)), 0);
            const dayProfit = dayCouriers.reduce((sum, c) => (c.status === 'Returned' ? sum - (c.courierCost || 0) : sum + (c.profit || 0)), 0);

            chartData.push({
                name: dayStr,
                revenue: dayRevenue,
                profit: dayProfit,
                orders: dayCouriers.length
            });
        }

        res.json({
            metrics: {
                totalOrders,
                totalRevenue,
                totalProfit,
                activePartnersCount
            },
            partnerPerformance,
            chartData
        });

    } catch (error) {
        console.error("Super Admin Stats Error:", error);
        res.status(500).json({ error: 'Failed to fetch super admin stats' });
    }
});

export default router;
