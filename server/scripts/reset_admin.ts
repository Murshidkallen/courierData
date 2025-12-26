
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash('admin123', 10);

    // Create or Update 'admin' to have 'admin123' password and 'ADMIN' role
    const user = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {
            password: password,
            role: 'ADMIN' // Force role to ADMIN just in case
        },
        create: {
            username: 'admin',
            password: password,
            role: 'ADMIN',
            visibleFields: '*'
        }
    });

    console.log(`User 'admin' with password 'admin123' is ready.`);
    console.log(user);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
