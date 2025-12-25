
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

async function restore() {
    console.log('Starting restore...');

    try {
        const backupPath = path.join(__dirname, '../data_backup.json');
        const fileContent = await fs.readFile(backupPath, 'utf-8');
        const data = JSON.parse(fileContent);

        // Transaction to ensure order and integrity
        // Note: Creating with explicit IDs is allowed in Prisma if we assume ID stability.
        // However, Postgres sequences won't auto-update. We might need reset sequences after.
        // Simple approach: createMany (if supported) or create in loop.

        console.log('Restoring Users...');
        for (const user of data.users) {
            await prisma.user.upsert({
                where: { id: user.id },
                update: {},
                create: { ...user, createdAt: new Date(user.createdAt) }
            });
        }

        console.log('Restoring Partners...');
        for (const partner of data.partners) {
            await prisma.partner.upsert({
                where: { id: partner.id },
                update: {},
                create: { ...partner, createdAt: new Date(partner.createdAt) }
            });
        }

        console.log('Restoring Sales Executives...');
        for (const exec of data.salesExecutives) {
            await prisma.salesExecutive.upsert({
                where: { id: exec.id },
                update: {},
                create: { ...exec, createdAt: new Date(exec.createdAt) }
            });
        }

        console.log('Restoring Couriers...');
        for (const courier of data.couriers) {
            // Need to handle relations carefully or use upsert without relations first?
            // Courier has many relations. Best to restoring raw data.
            // Date fields need conversion from string to Date
            await prisma.courier.upsert({
                where: { id: courier.id },
                update: {},
                create: {
                    ...courier,
                    date: new Date(courier.date),
                    createdAt: new Date(courier.createdAt),
                    updatedAt: new Date(courier.updatedAt),
                    // We must ensure foreign keys exist first (handled by order above)
                }
            });
        }

        console.log('Restoring Products...');
        for (const product of data.products) {
            await prisma.product.upsert({
                where: { id: product.id },
                update: {},
                create: product
            });
        }

        console.log('Restoring Invoices...');
        for (const invoice of data.invoices) {
            await prisma.invoice.upsert({
                where: { id: invoice.id },
                update: {},
                create: {
                    ...invoice,
                    createdAt: new Date(invoice.createdAt),
                    updatedAt: new Date(invoice.updatedAt)
                }
            });
        }

        console.log('Restore completed successfully!');

    } catch (error) {
        console.error('Restore failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

restore();
