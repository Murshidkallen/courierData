import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware';

const router = express.Router();
const prisma = new PrismaClient();

// Get all couriers with optional search & RBAC logic
router.get('/', authenticateToken, async (req, res) => {
    const user = (req as AuthRequest).user;
    if (!user) return res.sendStatus(403);

    try {
        const { search, startDate, endDate } = req.query;
        let where: any = {};

        if (search) {
            const searchTerms = String(search).trim().split(/\s+/).filter(Boolean);
            if (searchTerms.length > 0) {
                where.AND = searchTerms.map(term => ({
                    OR: [
                        { trackingId: { contains: term, mode: 'insensitive' } },
                        { customerName: { contains: term, mode: 'insensitive' } },
                        { phoneNumber: { contains: term, mode: 'insensitive' } },
                        { slipNo: { contains: term, mode: 'insensitive' } },
                        { address: { contains: term, mode: 'insensitive' } },
                        { pincode: { contains: term, mode: 'insensitive' } },
                        { status: { contains: term, mode: 'insensitive' } },
                        { products: { some: { name: { contains: term, mode: 'insensitive' } } } },
                        { salesExecutive: { name: { contains: term, mode: 'insensitive' } } },
                        { partner: { name: { contains: term, mode: 'insensitive' } } },
                        { enteredBy: { username: { contains: term, mode: 'insensitive' } } }
                    ]
                }));
            }
        }

        if (startDate && endDate) {
            where.date = {
                gte: new Date(String(startDate)),
                lte: new Date(String(endDate))
            };
        }

        // RBAC: Partner limits
        if (user.role === 'PARTNER') {
            const partnerProfile = await prisma.partner.findUnique({ where: { userId: user.id } });
            if (partnerProfile) {
                where.partnerId = partnerProfile.id;
            } else {
                where.id = -1; // Show nothing
            }
        }

        // RBAC: Staff limits
        if (user.role === 'STAFF') {
            where.enteredById = user.id;
        }

        const couriers = await prisma.courier.findMany({
            where,
            include: { products: true, salesExecutive: true, partner: true, enteredBy: { select: { username: true } } },
            orderBy: { date: 'desc' },
        });
        res.json(couriers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch couriers' });
    }
});

// Update courier (Block Viewer)
router.put('/:id', authenticateToken, async (req, res) => {
    const user = (req as AuthRequest).user;
    if (user?.role === 'VIEWER') return res.status(403).json({ error: 'Viewers cannot edit' });

    const { id } = req.params;
    const { products, salesExecutiveId, partnerId, status, ...data } = req.body;

    if (['Packed', 'Shipped', 'Sent'].includes(status)) {
        let tid = data.trackingId;
        let pid = partnerId;

        // If missing, fetch from DB to validate
        if (!tid || !pid) {
            const existing = await prisma.courier.findUnique({ where: { id: Number(id) } });
            if (existing) {
                if (!tid) tid = existing.trackingId;
                if (!pid) pid = existing.partnerId;
            }
        }

        if (tid && String(tid).startsWith('TEMP-')) {
            return res.status(400).json({ error: 'Real Tracking ID is required to change status.' });
        }
        if (!pid) {
            return res.status(400).json({ error: 'Courier Service (Partner) is required.' });
        }
    }

    try {
        const result = await prisma.courier.update({
            where: { id: Number(id) },
            data: {
                ...data,
                status,
                salesExecutiveId: salesExecutiveId !== undefined ? (salesExecutiveId ? Number(salesExecutiveId) : null) : undefined,
                partnerId: partnerId !== undefined ? (partnerId ? Number(partnerId) : null) : undefined,
                products: products ? {
                    deleteMany: {},
                    create: products.map((p: any) => ({
                        name: p.name,
                        cost: p.cost,
                        price: p.price
                    }))
                } : undefined
            }
        });
        res.json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to update' });
    }
});

// Create new courier (Block Viewer)
router.post('/', authenticateToken, async (req, res) => {
    const user = (req as AuthRequest).user;
    if (user?.role === 'VIEWER') return res.status(403).json({ error: 'Viewers cannot create' });

    try {
        const { products, salesExecutiveId: reqSalesExecutiveId, partnerId, ...courierData } = req.body;
        let salesExecutiveId = reqSalesExecutiveId ? Number(reqSalesExecutiveId) : null;

        if (courierData.date) {
            courierData.date = new Date(courierData.date);
        } else {
            console.log("No Date provided, using now()");
            courierData.date = new Date();
        }

        // Auto-Generate Slip No
        if (!courierData.slipNo) {
            const lastCourier = await prisma.courier.findFirst({
                orderBy: { id: 'desc' },
                select: { slipNo: true }
            });
            const lastSlip = lastCourier?.slipNo ? parseInt(lastCourier.slipNo) : 1000;
            const nextSlip = isNaN(lastSlip) ? 1001 : lastSlip + 1;
            courierData.slipNo = String(nextSlip);
        }

        // Handle Missing Tracking ID (Staff Entry)
        if (!courierData.trackingId) {
            courierData.trackingId = `TEMP-${Date.now()}`;
        }

        const totalPaid = courierData.totalPaid || 0;
        const courierCost = courierData.courierCost || 0;
        const packingCost = courierData.packingCost || 0;
        const productsCost = (products || []).reduce((acc: number, p: any) => acc + (Number(p.cost) || 0), 0);
        const profit = totalPaid - (productsCost + courierCost + packingCost);

        let commissionAmount = 0;
        let commissionPct = 0;

        if (salesExecutiveId) {
            const exec = await prisma.salesExecutive.findUnique({ where: { id: Number(salesExecutiveId) } });
            if (exec) {
                commissionPct = exec.rate;
                commissionAmount = profit * (commissionPct / 100);
            }
        } else if (user?.role === 'STAFF') {
            const staffAgent = await prisma.salesExecutive.findUnique({ where: { userId: user.id } });
            if (staffAgent) {
                salesExecutiveId = staffAgent.id;
                commissionPct = staffAgent.rate;
                commissionAmount = profit * (commissionPct / 100);
            }
        }

        delete (courierData as any).sender;
        delete (courierData as any).recipient;
        delete (courierData as any).origin;
        delete (courierData as any).destination;

        let finalPartnerId = partnerId ? Number(partnerId) : null;

        if (user?.role === 'PARTNER') {
            const partnerProfile = await prisma.partner.findUnique({ where: { userId: user.id } });
            if (partnerProfile) {
                finalPartnerId = partnerProfile.id;
            } else {
                return res.status(403).json({ error: 'No Service linked to this Partner User.' });
            }
        }

        const courier = await prisma.courier.create({
            data: {
                ...courierData,
                salesExecutiveId: salesExecutiveId ? Number(salesExecutiveId) : null,
                partnerId: finalPartnerId,
                enteredById: user?.id,
                commissionAmount,
                commissionPct,
                profit,
                products: {
                    create: products || [],
                },
            },
            include: { products: true, salesExecutive: true },
        });
        res.json(courier);
    } catch (error: any) {
        console.error(error);
        if (error.code === 'P2002') {
            const target = (error.meta as any)?.target || 'Tracking ID';
            res.status(409).json({ error: `${target} already exists` });
        } else {
            res.status(500).json({ error: 'Failed to create courier' });
        }
    }
});

// Delete Courier (Admin Only)
router.delete('/:id', authenticateToken, async (req, res) => {
    const user = (req as AuthRequest).user;
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') return res.sendStatus(403);

    const { id } = req.params;
    try {
        await prisma.product.deleteMany({ where: { courierId: Number(id) } });
        await prisma.courier.delete({ where: { id: Number(id) } });
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete' });
    }
});

export default router;
