const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const executives = [
      { name: 'Sales Agent A', rate: 10 },
      { name: 'Sales Agent B', rate: 5 },
      { name: 'External Partner', rate: 15 },
  ];

  for (const exec of executives) {
      await prisma.salesExecutive.create({ data: exec });
  }
  console.log('Seeded Sales Executives');

  const partners = [
      { name: 'Gokulam Speed and Safe', rate: 10 },
      { name: 'Professional Couriers', rate: 12 },
      { name: 'DTDC', rate: 15 },
  ];

  for (const p of partners) {
      await prisma.partner.upsert({
          where: { name: p.name },
          update: {},
          create: p
      });
  }
  console.log('Seeded Partners');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
