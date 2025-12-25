import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'secret123';

export interface AuthRequest extends Request {
    user?: {
        id: number;
        username: string;
        role: string;
    };
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
        if (err) return res.sendStatus(403);
        (req as AuthRequest).user = user;
        next();
    });
};

export const requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as AuthRequest).user;
        if (!user || !roles.includes(user.role)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        next();
    };
};
