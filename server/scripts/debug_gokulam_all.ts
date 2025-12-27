
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Broad Search for "Gokulam"...');

    // Search in multiple fields
    const couriers = await prisma.courier.findMany({
        where: {
            OR: [
                { address: { contains: 'Gokulam', mode: 'insensitive' } },
                { unit: { contains: 'Gokulam', mode: 'insensitive' } },
                { customerName: { contains: 'Gokulam', mode: 'insensitive' } },
                { trackingId: '21097685' } // Include the known one for reference
            ]
        },
        select: {
            id: true,
            trackingId: true,
            partnerId: true,
            address: true,
            unit: true,
            customerName: true
        }
    });

    console.log(`Found ${couriers.length} matches.`);
    couriers.forEach(c => {
        console.log(`ID: ${c.id} | Tracking: ${c.trackingId} | PartnerID: ${c.partnerId} | Addr: ${c.address?.substring(0, 20)}...`);
    });
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
