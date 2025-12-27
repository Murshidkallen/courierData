
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Searching by Creator (User ID 5)...');

    // 1. Verify Partner User
    const partner = await prisma.partner.findFirst({
        where: { name: { contains: 'Gokulam', mode: 'insensitive' } },
        include: { user: true }
    });

    if (!partner || !partner.userId) {
        console.log('Partner User not found.');
        return;
    }
    console.log(`Partner: ${partner.name}, User ID: ${partner.userId}`);

    // 2. Find Orphaned Entries linked to this User
    const couriers = await prisma.courier.findMany({
        where: {
            enteredById: partner.userId,
            // We want to see ALL of them, but specifically note the ones with partnerId = NULL
        },
        include: { partner: true }
    });

    console.log(`Found ${couriers.length} entries created by User ${partner.userId}.`);

    const orphans = couriers.filter(c => c.partnerId === null);
    console.log(`Pending Restoration (Orphans): ${orphans.length}`);

    orphans.forEach(c => {
        console.log(`- Orphan ID: ${c.id} | Tracking: ${c.trackingId}`);
    });

    // 3. Fix them?
    if (orphans.length > 0) {
        console.log('Restoring orphans...');
        await prisma.courier.updateMany({
            where: { id: { in: orphans.map(c => c.id) } },
            data: { partnerId: partner.id }
        });
        console.log('Restored!');
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
