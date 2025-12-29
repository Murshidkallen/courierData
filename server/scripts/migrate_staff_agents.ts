
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting migration: Linking Staff users to Sales Executives...');

    // 1. Get all users with role 'STAFF'
    const staffUsers = await prisma.user.findMany({
        where: { role: 'STAFF' },
        include: { SalesExecutive: true }
    });

    console.log(`Found ${staffUsers.length} STAFF users.`);

    for (const user of staffUsers) {
        if (user.SalesExecutive) {
            console.log(`- User ${user.username} already linked to Sales Executive ${user.SalesExecutive.name}`);
            continue;
        }

        // Check if a Sales Exec exists with the same name (fuzzy match?)
        // For safety, let's look for exact name match first.
        let salesExec = await prisma.salesExecutive.findFirst({
            where: { name: { equals: user.username, mode: 'insensitive' } } // simplified match
        });

        if (salesExec && !salesExec.userId) {
            console.log(`- Linking User ${user.username} to existing Sales Executive ${salesExec.name}`);
            await prisma.salesExecutive.update({
                where: { id: salesExec.id },
                data: { userId: user.id }
            });
        } else {
            console.log(`- Creating new Sales Executive profile for User ${user.username}`);
            // Create new profile
            await prisma.salesExecutive.create({
                data: {
                    name: user.username, // Use username as default name
                    userId: user.id,
                    rate: 5 // Default commission rate? User didn't specify, assume 5% or 0? user said "percentage of commission" in previous task. Let's start with 0 so admin sets it.
                }
            });
        }
    }

    console.log('Migration complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
