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
                createdAt: true
            }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Create new user
router.post('/users', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
    const { username, password, role, visibleFields } = req.body;

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

        // Auto-create Partner profile if role is PARTNER
        if (role === 'PARTNER') {
            try {
                await prisma.partner.create({
                    data: {
                        name: username,
                        userId: user.id
                    }
                });
            } catch (pError) {
                console.error("Failed to auto-create partner profile:", pError);
                // Optional: We might want to warn the admin, but for now we log it.
                // The user is created, but partner profile failed (duplicate name?)
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
    const { username, password, role, visibleFields } = req.body;

    try {
        const updateData: any = { username, role, visibleFields };
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: updateData
        });

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
