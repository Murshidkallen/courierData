
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Sales Executives & Linked Users ---');
    const executives = await prisma.salesExecutive.findMany({
        include: { user: { select: { username: true, role: true } } }
    });

    if (executives.length === 0) {
        console.log('No Sales Executives found.');
    } else {
        console.table(executives.map(e => ({
            ID: e.id,
            Name: e.name,
            Rate: e.rate + '%',
            'Linked User': e.user ? `${e.user.username} (${e.user.role})` : 'None',
            'User ID': e.userId
        })));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
