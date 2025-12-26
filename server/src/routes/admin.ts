import express from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware';

const router = express.Router();
const prisma = new PrismaClient();

// Get all users
router.get('/users', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                role: true,
                visibleFields: true,
                createdAt: true,
                Partner: {
                    select: { id: true, name: true }
                }
            }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Create new user
router.post('/users', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    const { username, password, role, visibleFields, linkedPartnerId } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                role: role || 'STAFF',
                visibleFields: visibleFields || '*'
            }
        });

        // Handle Partner Linking
        if (role === 'PARTNER') {
            try {
                if (linkedPartnerId) {
                    // Link to existing Service
                    // First, ensure no other user is linked? (Optional, unique constraint will throw if we duplicate, but here we update foreign key on partner)
                    // Actually Partner.userId is unique. So if this partner is owned by someone else, we overwrite or fail?
                    // Let's overwrite (Admin decision).
                    await prisma.partner.update({
                        where: { id: Number(linkedPartnerId) },
                        data: { userId: user.id }
                    });
                } else {
                    // Auto-create new Service (Legacy behavior)
                    await prisma.partner.create({
                        data: {
                            name: username,
                            userId: user.id
                        }
                    });
                }
            } catch (pError) {
                console.error("Failed to handle partner linking:", pError);
            }
        }

        res.status(201).json({
            id: user.id,
            username: user.username,
            role: user.role,
            visibleFields: user.visibleFields
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Update user
router.put('/users/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    const { id } = req.params;
    const { username, password, role, visibleFields, linkedPartnerId } = req.body;

    try {
        const updateData: any = { username, role, visibleFields };
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        // Handle Partner Re-Linking
        if (role === 'PARTNER' && linkedPartnerId !== undefined) {
            // 1. Unlink current partner if any (to avoid unique constraint issues if we swap)
            await prisma.partner.updateMany({
                where: { userId: user.id },
                data: { userId: null }
            });

            // 2. Link new one if provided
            if (linkedPartnerId) {
                await prisma.partner.update({
                    where: { id: Number(linkedPartnerId) },
                    data: { userId: user.id }
                });
            }
        }

        res.json({
            id: user.id,
            username: user.username,
            role: user.role,
            visibleFields: user.visibleFields
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Delete user
router.delete('/users/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.user.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

export default router;
