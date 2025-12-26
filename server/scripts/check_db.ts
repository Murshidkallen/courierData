
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.courier.count();
        console.log(`Total Couriers in DB: ${count}`);

        const last = await prisma.courier.findFirst({ orderBy: { id: 'desc' } });
        console.log("Last Courier TrackingID:", last?.trackingId);
        console.log("Last Courier SlipNo:", last?.slipNo);

        const slipNos = await prisma.courier.findMany({ select: { slipNo: true } });
        console.log("All SlipNos:", slipNos.map(s => s.slipNo).join(", "));

        const trackingId = "2455031525";
        const specific = await prisma.courier.findFirst({
            where: { trackingId: { contains: trackingId } }
        });
        console.log(`Fuzzy Search for ${trackingId}:`, specific ? "FOUND" : "NOT FOUND");

    } catch (e) {
        console.error("Connection Error:", e);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
