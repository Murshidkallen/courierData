
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function main() {
    console.log("Attempting to connect to database...");
    try {
        await prisma.$connect();
        console.log("Successfully connected to database!");
    } catch (e: any) {
        console.error("FAILED to connect to database.");
        console.error("Error Name:", e.name);
        console.error("Error Message:", e.message);
        if (e.code) console.error("Error Code:", e.code);
    } finally {
        await prisma.$disconnect();
    }
}

main();
