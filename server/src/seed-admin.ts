
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const adminExists = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await prisma.user.create({
            data: {
                username: 'admin',
                password: hashedPassword,
                role: 'ADMIN',
                visibleFields: '*'
            }
        });
        console.log('Admin user created: admin / admin123');
    } else {
        console.log('Admin user already exists.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
