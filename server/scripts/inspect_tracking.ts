
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const trackingId = '21097685';
    console.log(`Inspecting Courier: ${trackingId}`);

    const courier = await prisma.courier.findUnique({
        where: { trackingId },
        include: { partner: true, products: true }
    });

    if (!courier) {
        console.log('NOT FOUND');
    } else {
        console.dir(courier, { depth: null });
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
