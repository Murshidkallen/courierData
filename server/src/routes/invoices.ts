import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware';

const router = express.Router();
const prisma = new PrismaClient();

// Get Invoices
router.get('/', authenticateToken, async (req, res) => {
    const user = (req as AuthRequest).user;
    if (!user) return res.sendStatus(403);

    try {
        const where: any = {};
        if (user.role !== 'ADMIN') {
            where.userId = user.id;
        }

        const invoices = await prisma.invoice.findMany({
            where,
            include: { user: { select: { username: true, role: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(invoices);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
});

// Generate Invoice (End of Month)
router.post('/', authenticateToken, async (req, res) => {
    const user = (req as AuthRequest).user;
    if (!user) return res.sendStatus(403);

    try {
        const { amount, month } = req.body;
        const invoice = await prisma.invoice.create({
            data: {
                amount: Number(amount),
                month,
                status: 'Pending',
                userId: user.id
            }
        });
        res.json(invoice);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create invoice' });
    }
});

// Update Invoice Status (Admin Only)
router.put('/:id', authenticateToken, async (req, res) => {
    const user = (req as AuthRequest).user;
    if (user?.role !== 'ADMIN') return res.sendStatus(403);

    try {
        const { status } = req.body;
        const invoice = await prisma.invoice.update({
            where: { id: Number(req.params.id) },
            data: { status }
        });
        res.json(invoice);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update invoice' });
    }
});

export default router;
