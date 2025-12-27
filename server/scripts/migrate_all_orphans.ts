
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Migrating ALL Orphans to Gokulam...');

    // 1. Get Target Partner
    const partner = await prisma.partner.findFirst({
        where: { name: { contains: 'Gokulam', mode: 'insensitive' } }
    });

    if (!partner) {
        console.error('Partner not found!');
        return;
    }
    console.log(`Target: ${partner.name} (ID: ${partner.id})`);

    // 2. Update Orphans
    const result = await prisma.courier.updateMany({
        where: {
            partnerId: null
        },
        data: {
            partnerId: partner.id
        }
    });

    console.log(`Migrated ${result.count} entries to ${partner.name}.`);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
