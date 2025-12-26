
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const trackingId = "2455031525";
    console.log(`Searching for Courier with Tracking ID: ${trackingId}...`);

    const courier = await prisma.courier.findUnique({
        where: { trackingId: trackingId },
        include: {
            partner: true,
            enteredBy: true,
            salesExecutive: true
        }
    });

    if (courier) {
        console.log("FOUND COURIER:");
        console.log(JSON.stringify(courier, null, 2));
    } else {
        console.log("Courier NOT FOUND in the database.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
