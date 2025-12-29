
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fixing sequences...');

    // List of tables/models to fix
    const tables = ['User', 'Courier', 'Product', 'Partner', 'SalesExecutive', 'Invoice'];

    for (const table of tables) {
        try {
            // Enclose table name in double quotes for case sensitivity if needed, 
            // but Prisma usually maps them. Let's try raw query.
            // NOTE: If table names are mixed case in DB, they need quotes.
            // In Prisma schema: SalesExecutive -> likely "SalesExecutive" in DB.

            const rawQuery = `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), coalesce(max(id)+1, 1), false) FROM "${table}";`;
            await prisma.$executeRawUnsafe(rawQuery);
            console.log(`- Fixed sequence for ${table}`);
        } catch (e) {
            console.error(`Failed to fix ${table}:`, e);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
