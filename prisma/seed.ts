import { PrismaClient } from '@prisma/client';
import * as companies from './data/companies.json';
import * as holidays from './data/holidays.json';

const prisma = new PrismaClient();

const seedStockCompanies = async () => {
  const stocks = companies.map((company) => {
    return {
      code: company.ticker,
      groupCode: company.comGroupCode,
      companyName: company.organName,
    }
  });

  let promise = [];
  for (const stock of stocks) {
    promise.push(prisma.stock.upsert({
      where: { code: stock.code },
      update: {},
      create: stock,
    }));

    if (promise.length === 100) {
      await Promise.all(promise)
        .catch(console.error);
      promise = [];
    }
  }

  await Promise.all(promise)
    .catch(console.error);
}

const seedHolidays = async () => {
  let promise = [];
  for (const holiday of holidays) {
    promise.push(prisma.holiday.upsert({
      where: { date: new Date(holiday.date) },
      update: {},
      create: { date: new Date(holiday.date) },
    }));
  }

  await Promise.all(promise)
    .catch(console.error);
}


async function main() {
  await seedStockCompanies();
  await seedHolidays();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });