
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Deep Search for "Gokulam"...');

    // 1. Sales Execs
    const execs = await prisma.salesExecutive.findMany({
        where: { name: { contains: 'Gokulam', mode: 'insensitive' } }
    });
    console.log(`Found ${execs.length} Sales Execs with "Gokulam".`);
    if (execs.length > 0) console.log(execs);

    // 2. Users
    const users = await prisma.user.findMany({
        where: { username: { contains: 'Gokulam', mode: 'insensitive' } }
    });
    console.log(`Found ${users.length} Users with "Gokulam".`);
    if (users.length > 0) console.log(users);

    // 3. Products?
    const products = await prisma.product.findMany({
        where: { name: { contains: 'Gokulam', mode: 'insensitive' } }
    });
    console.log(`Found ${products.length} Products with "Gokulam".`);

    // 4. Check for 'Via:' inside Address again with %like%? 
    // Prisma contains is %like%
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
