
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Fixing auto-increment sequences...");

    const tables = ['Courier', 'Product', 'SalesExecutive', 'Partner', 'Invoice', 'User'];

    for (const table of tables) {
        try {
            // Get the max ID
            // @ts-ignore
            const aggregate = await prisma[table.toLowerCase()].aggregate({
                _max: { id: true }
            });

            const maxId = aggregate._max.id || 0;
            console.log(`Max ID for ${table}: ${maxId}`);

            // Reset sequence
            // Note: Table names in Postgres are usually double-quoted case-sensitive or standard lowercase.
            // Prisma usually quotes them if they match the model name exactly.
            // Let's try standard approach.

            const seqNameResult = await prisma.$queryRawUnsafe(`
                SELECT pg_get_serial_sequence('"${table}"', 'id') as seq;
            `);

            // @ts-ignore
            const seqName = seqNameResult[0]?.seq;

            if (seqName) {
                console.log(`Resetting sequence ${seqName} to ${maxId + 1}`);
                await prisma.$executeRawUnsafe(`SELECT setval('${seqName}', ${maxId + 1}, false);`);
            } else {
                console.log(`Could not find sequence for ${table} (might be using default naming)`);
                // Fallback attempt
                await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), ${maxId + 1}, false);`);
            }

        } catch (error) {
            console.error(`Error fixing ${table}:`, error);
        }
    }

    console.log("Done!");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
