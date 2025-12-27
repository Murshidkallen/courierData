
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Gokulam creation date approx Dec 22
    const cutoffDate = new Date('2025-12-22T00:00:00.000Z');

    console.log('Searching for recent orphans (since Dec 22)...');

    const orphans = await prisma.courier.findMany({
        where: {
            partnerId: null,
            createdAt: { gte: cutoffDate }
        },
        select: { id: true, trackingId: true, customerName: true, address: true, createdAt: true }
    });

    console.log(`Found ${orphans.length} recent orphans.`);
    if (orphans.length > 0) {
        orphans.forEach(c => {
            // Check for subtle text matches
            const txt = (c.address || '') + (c.customerName || '');
            const hasG = /gok/i.test(txt);
            console.log(`ID: ${c.id} | Track: ${c.trackingId} | Customer: ${c.customerName} | Likely Match? ${hasG}`);
        });
    }

    console.log('\nText search for "Speed" or "Safe" in ALL records...');
    const textMatches = await prisma.courier.findMany({
        where: {
            OR: [
                { address: { contains: 'Speed', mode: 'insensitive' } },
                { address: { contains: 'Safe', mode: 'insensitive' } }
            ]
        },
        select: { id: true, trackingId: true, partnerId: true, address: true }
    });
    console.log(`Found ${textMatches.length} text matches.`);
    textMatches.forEach(m => console.log(`- ${m.trackingId} (PID: ${m.partnerId}): ${m.address}`));
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
