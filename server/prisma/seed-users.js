const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const users = [
      { username: 'admin', password: 'admin123', role: 'ADMIN' },
      { username: 'staff', password: 'staff123', role: 'STAFF' },
      { username: 'partner', password: 'partner123', role: 'PARTNER' },
      { username: 'viewer', password: 'viewer123', role: 'VIEWER' },
  ];

  for (const u of users) {
      const hashedPassword = await bcrypt.hash(u.password, 10);
      await prisma.user.upsert({
          where: { username: u.username },
          update: {},
          create: {
              username: u.username,
              password: hashedPassword,
              role: u.role
          }
      });
  }
  console.log('Seeded Users');

  // Link 'partner' user to 'Gokulam Speed and Safe'
  const partnerUser = await prisma.user.findUnique({ where: { username: 'partner' } });
  const partnerEntity = await prisma.partner.findUnique({ where: { name: 'Gokulam Speed and Safe' } });

  if (partnerUser && partnerEntity) {
      await prisma.partner.update({
          where: { id: partnerEntity.id },
          data: { userId: partnerUser.id }
      });
      console.log('Linked Partner User');
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
