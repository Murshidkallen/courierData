import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware';

const router = express.Router();
const prisma = new PrismaClient();

// Get all sales executives (Protected)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const executives = await prisma.salesExecutive.findMany();
        res.json(executives);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sales executives' });
    }
});

// Create sales executive
router.post('/', authenticateToken, async (req, res) => {
    try {
        const executive = await prisma.salesExecutive.create({
            data: req.body,
        });
        res.json(executive);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create sales executive' });
    }
});

export default router;
