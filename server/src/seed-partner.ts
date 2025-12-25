
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({ where: { username: 'partner' } });
    if (!user) {
        const hashedPassword = await bcrypt.hash('partner123', 10);
        const newUser = await prisma.user.create({
            data: {
                username: 'partner',
                password: hashedPassword,
                role: 'PARTNER',
                visibleFields: 'cost,profit'
            }
        });

        // Create Partner Profile
        await prisma.partner.create({
            data: {
                name: 'Test Partner Service',
                userId: newUser.id,
                rate: 10
            }
        });
        console.log('Partner created: partner / partner123');
    } else {
        console.log('Partner already exists');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
