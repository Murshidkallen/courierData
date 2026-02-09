import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware';

const router = express.Router();
const prisma = new PrismaClient();

// 1. Dashboard Summary (4 Cards) - GLOBAL TOTALS (Lifetime?)
// User likely wants Lifetime totals for the cards, or maybe "Current Month"?
// Let's assume Lifetime for "Stats" unless specified. 
// "Moto Club (50% of exact profit)" usually implies total standing.
// 1. Dashboard Summary (4 Cards) - With Date Range
router.get('/dashboard-summary', authenticateToken, async (req, res) => {
    const user = (req as AuthRequest).user;
    if (user?.role !== 'ADMIN') return res.sendStatus(403);

    try {
        const { startDate, endDate } = req.query;
        let where: any = {};

        if (startDate && endDate) {
            where.date = {
                gte: new Date(String(startDate)),
                lte: new Date(String(endDate)) // Should probably set to end of day? Client usually sends YYYY-MM-DD
            };
            // Fix End of Day if needed, or rely on Client sending ISO.
            // Let's assume input is YYYY-MM-DD and we want full day coverage
            const end = new Date(String(endDate));
            end.setHours(23, 59, 59, 999);
            where.date.lte = end;
        }

        const couriers = await prisma.courier.findMany({
            where,
            select: { profit: true, commissionAmount: true, courierCost: true }
        });

        const totalProfit = couriers.reduce((sum, c) => sum + (c.profit || 0), 0);
        const totalCommission = couriers.reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
        const totalCourierCost = couriers.reduce((sum, c) => sum + (c.courierCost || 0), 0);

        // Card 1: Moto Club (50% of Global Profit)
        const motoClubShare = totalProfit * 0.5;

        // Card 2: Open Coders (50% Profit - All Commissions)
        const openCodersShare = (totalProfit * 0.5) - totalCommission;

        // Card 3: Partners (Total Courier Charges)
        const partnersShare = totalCourierCost;

        // Card 4: Agents (Total Commissions)
        const agentsShare = totalCommission;

        res.json({
            motoClub: motoClubShare,
            openCoders: openCodersShare,
            partners: partnersShare,
            agents: agentsShare,
            count: couriers.length // Useful for debugging
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
});

// 2. Internal Billing History & Range Suggestion
router.get('/internal-history/:recipient', authenticateToken, async (req, res) => {
    const { recipient } = req.params;

    try {
        const invoices = await prisma.invoice.findMany({
            where: { recipient },
            orderBy: { endDate: 'desc' } // Order by end date to find latest
        });

        let lastDate = null;
        if (invoices.length > 0 && invoices[0].endDate) {
            lastDate = invoices[0].endDate;
        }

        // Suggest Start Date: Day after last invoice, or Epoch if none
        let suggestedStart = new Date(0);
        if (lastDate) {
            suggestedStart = new Date(lastDate);
            suggestedStart.setDate(suggestedStart.getDate() + 1);
        } else {
            // Find first courier date? Or just default to "Beginning of time"?
            // Using a realistic default like "First Courier Date" is better.
            const firstCourier = await prisma.courier.findFirst({ orderBy: { date: 'asc' } });
            if (firstCourier) suggestedStart = new Date(firstCourier.date);
        }

        res.json({
            invoices,
            suggestedStartDate: suggestedStart.toISOString().split('T')[0],
            suggestedEndDate: new Date().toISOString().split('T')[0] // Today
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// 3. Calculate Internal Bill Stats (Preview)
router.get('/internal-stats/:recipient', authenticateToken, async (req, res) => {
    const { recipient } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) return res.status(400).json({ error: 'Dates required' });

    try {
        const start = new Date(String(startDate));
        start.setHours(0, 0, 0, 0);

        const end = new Date(String(endDate));
        end.setHours(23, 59, 59, 999);

        const couriers = await prisma.courier.findMany({
            where: {
                date: { gte: start, lte: end }
            },
            select: { profit: true, commissionAmount: true }
        });

        const totalProfit = couriers.reduce((acc, c) => acc + (c.profit || 0), 0);
        const totalCommission = couriers.reduce((acc, c) => acc + (c.commissionAmount || 0), 0);

        let amount = 0;
        let details: any = {};

        if (recipient === 'Moto Club') {
            amount = totalProfit * 0.5;
            details = {
                totalProfit,
                formula: 'Profit * 50%'
            };
        } else if (recipient === 'Open Coders') {
            const halfProfit = totalProfit * 0.5;
            amount = halfProfit - totalCommission;
            details = {
                totalProfit,
                halfProfit,
                totalCommission,
                formula: '(Profit * 50%) - Commissions'
            };
        }

        res.json({ amount, ordersCount: couriers.length, details });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Calculations failed' });
    }
});

// 4. Generate Internal Invoice
router.post('/generate-internal', authenticateToken, async (req, res) => {
    const { recipient, startDate, endDate, amount } = req.body;

    // Check overlaps? Ideally yes.
    // Simplifying for now: Trust the admin.

    try {
        const invoice = await prisma.invoice.create({
            data: {
                recipient,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                amount: Number(amount),
                month: startDate.substring(0, 7), // YYYY-MM
                status: 'Pending'
            }
        });
        res.json(invoice);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to generate' });
    }
});

// 5. Mark INVOICE as Paid
router.put('/invoices/:id/pay', authenticateToken, async (req, res) => {
    // Basic pay toggle
    const { id } = req.params;
    try {
        const inv = await prisma.invoice.update({
            where: { id: Number(id) },
            data: { status: 'Paid' }
        });
        res.json(inv);
    } catch (e) {
        res.status(500).json({ error: 'Failed to update' });
    }
});


// 6. Entity Billing History (Partner/Agent)
router.get('/entity/:type/:id/history', authenticateToken, async (req, res) => {
    const { type, id } = req.params;
    const entityId = Number(id);

    try {
        let where: any = {};
        if (type === 'PARTNER') where.partnerId = entityId;
        else if (type === 'SALES_EXECUTIVE') where.salesExecutiveId = entityId;
        else return res.status(400).json({ error: 'Invalid Type' });

        const invoices = await prisma.invoice.findMany({
            where,
            orderBy: { endDate: 'desc' }
        });

        // Suggest Start Date logic
        let lastDate = null;
        if (invoices.length > 0 && invoices[0].endDate) {
            lastDate = invoices[0].endDate;
        }

        let suggestedStart = new Date(0);
        if (lastDate) {
            suggestedStart = new Date(lastDate);
            suggestedStart.setDate(suggestedStart.getDate() + 1);
        } else {
            // If no invoices, start from first courier entry for this entity
            let firstCourier;
            if (type === 'PARTNER') firstCourier = await prisma.courier.findFirst({ where: { partnerId: entityId }, orderBy: { date: 'asc' } });
            else firstCourier = await prisma.courier.findFirst({ where: { salesExecutiveId: entityId }, orderBy: { date: 'asc' } });

            if (firstCourier) suggestedStart = new Date(firstCourier.date);
        }

        res.json({
            invoices,
            suggestedStartDate: suggestedStart.toISOString().split('T')[0],
            suggestedEndDate: new Date().toISOString().split('T')[0]
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// 7. Calculate Entity Bill Stats (Preview)
router.get('/entity/:type/:id/stats', authenticateToken, async (req, res) => {
    const { type, id } = req.params;
    const { startDate, endDate } = req.query;
    const entityId = Number(id);

    if (!startDate || !endDate) return res.status(400).json({ error: 'Dates required' });

    try {
        const start = new Date(String(startDate));
        start.setHours(0, 0, 0, 0);
        const end = new Date(String(endDate));
        end.setHours(23, 59, 59, 999);

        let where: any = {
            date: { gte: start, lte: end }
        };

        if (type === 'PARTNER') where.partnerId = entityId;
        else if (type === 'SALES_EXECUTIVE') where.salesExecutiveId = entityId;

        const couriers = await prisma.courier.findMany({
            where,
            select: { courierCost: true, commissionAmount: true, profit: true } // Fetch needed fields
        });

        let amount = 0;
        let details: any = {};

        if (type === 'PARTNER') {
            // Expenses (Courier Cost)
            amount = couriers.reduce((acc, c) => acc + (c.courierCost || 0), 0);
            details = { formula: 'Sum of Courier Costs' };
        } else {
            // Commissions
            amount = couriers.reduce((acc, c) => acc + (c.commissionAmount || 0), 0);
            details = { formula: 'Sum of Commissions' };
        }

        res.json({ amount, ordersCount: couriers.length, details });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Calculations failed' });
    }
});

// 8. Generate Entity Invoice
router.post('/entity/generate', authenticateToken, async (req, res) => {
    const { type, id, startDate, endDate, amount } = req.body;
    const entityId = Number(id);

    try {
        let data: any = {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            amount: Number(amount),
            month: startDate.substring(0, 7),
            status: 'Pending'
        };

        if (type === 'PARTNER') data.partnerId = entityId;
        else if (type === 'SALES_EXECUTIVE') data.salesExecutiveId = entityId;

        const invoice = await prisma.invoice.create({ data });
        res.json(invoice);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to generate' });
    }
});


export default router;
