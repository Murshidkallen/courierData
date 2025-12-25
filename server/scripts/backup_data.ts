
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

async function backup() {
    console.log('Starting backup...');

    try {
        const data = {
            users: await prisma.user.findMany(),
            partners: await prisma.partner.findMany(),
            salesExecutives: await prisma.salesExecutive.findMany(),
            couriers: await prisma.courier.findMany(),
            products: await prisma.product.findMany(),
            invoices: await prisma.invoice.findMany(),
        };

        const backupPath = path.join(__dirname, '../data_backup.json');
        await fs.writeFile(backupPath, JSON.stringify(data, null, 2));

        console.log(`Backup completed successfully! Saved to: ${backupPath}`);
        console.log(`Stats:`);
        console.log(`- Users: ${data.users.length}`);
        console.log(`- Couriers: ${data.couriers.length}`);

    } catch (error) {
        console.error('Backup failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

backup();
