import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/suggestions', authenticateToken, async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            distinct: ['name'],
            orderBy: { id: 'desc' },
            select: { name: true, cost: true, price: true }
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch suggestions' });
    }
});

export default router;
