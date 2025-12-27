
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Searching for "Gokulam" data...');

    // 1. Find the Partner ID
    const partner = await prisma.partner.findFirst({
        where: { name: { contains: 'Gokulam', mode: 'insensitive' } }
    });

    if (partner) {
        console.log(`Found Partner: ${partner.name} (ID: ${partner.id})`);
    } else {
        console.log('Partner "Gokulam" NOT FOUND. Please create it first.');
    }

    // 2. Search Couriers
    const couriers = await prisma.courier.findMany({
        where: {
            OR: [
                { address: { contains: 'Gokulam', mode: 'insensitive' } },
                { customerName: { contains: 'Gokulam', mode: 'insensitive' } },
                { unit: { contains: 'Gokulam', mode: 'insensitive' } }, // Maybe they put it here?
                // Check if any product name contains it? unlikely
            ]
        }
    });

    console.log(`Found ${couriers.length} couriers with "Gokulam" in text fields.`);

    if (couriers.length > 0) {
        console.log('Sample IDs:', couriers.slice(0, 5).map(c => c.id));
        console.log('Sample Data:', couriers[0]);
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
