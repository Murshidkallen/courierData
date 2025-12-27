
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware';

const router = express.Router();
const prisma = new PrismaClient();

// Get all partners (Accessible by Staff/Admin)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const partners = await prisma.partner.findMany({
            orderBy: { name: 'asc' },
            include: { user: { select: { username: true } } }
        });
        res.json(partners);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch partners' });
    }
});

// Create Partner - Admin Only (for now, or allowed internally for UserForm)
router.post('/', authenticateToken, async (req, res) => {
    const { name, rate } = req.body;
    try {
        const partner = await prisma.partner.create({
            data: { name, rate: Number(rate) || 0 }
        });
        res.json(partner);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create partner' });
    }
});

// Update Partner (Rename) - Admin Only
router.put('/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    const { id } = req.params;
    const { name, rate } = req.body;

    try {
        const partner = await prisma.partner.update({
            where: { id: Number(id) },
            data: { name, rate: Number(rate) }
        });
        res.json(partner);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update partner' });
    }
});

// Delete Partner - Admin Only
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    const { id } = req.params;

    try {
        // Check if has dependencies?
        // Rely on Prisma constraints or just delete. 
        // If couriers exist, we might want to set partnerId to null instead of crashing?
        // Schema says: Partner? @relation ...
        // If we delete partner, what happens to Courier.partnerId?
        // Default prisma behavior for optional relation is SetNull usually IF defined.
        // But let's check safety.

        // Safe Delete: Check for couriers
        const count = await prisma.courier.count({ where: { partnerId: Number(id) } });
        if (count > 0) {
            return res.status(400).json({ error: `Cannot delete: Service is used in ${count} couriers.` });
        }

        await prisma.partner.delete({ where: { id: Number(id) } });
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete partner' });
    }
});

export default router;
