
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Gokulam Migration...');

    // 1. Get Target Partner
    const partner = await prisma.partner.findFirst({
        where: { name: { contains: 'Gokulam', mode: 'insensitive' } }
    });

    if (!partner) {
        console.error('CRITICAL: Partner "Gokulam" not found!');
        return;
    }
    console.log(`Target Partner: ${partner.name} (ID: ${partner.id})`);

    // 2. Find Candidates (Unlinked only)
    const couriers = await prisma.courier.findMany({
        where: {
            partnerId: null,
            address: { contains: 'Gokulam', mode: 'insensitive' }
        }
    });

    console.log(`Found ${couriers.length} unlinked couriers with "Gokulam" in address.`);

    // 3. Update
    if (couriers.length > 0) {
        const result = await prisma.courier.updateMany({
            where: {
                id: { in: couriers.map(c => c.id) }
            },
            data: {
                partnerId: partner.id
            }
        });
        console.log(`Successfully updated ${result.count} couriers.`);
    } else {
        console.log('No migration needed.');
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
