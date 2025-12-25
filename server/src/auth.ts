import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || 'secret123';

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, visibleFields: user.visibleFields },
            SECRET_KEY,
            { expiresIn: '8h' }
        );

        res.json({ token, role: user.role, username: user.username, visibleFields: user.visibleFields });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

export default router;
