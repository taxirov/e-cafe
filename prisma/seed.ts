import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function ensureUser(phone: string, password: string, fullName: string, role: "SUPER_ADMIN" | "OWNER" | "WAITER" | "KITCHEN", cafeId?: string) {
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) return existing;
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.create({ data: { phone, passwordHash, fullName, role, cafeId } });
}

async function main() {
  await ensureUser("+998900000000", "admin123", "Super Admin", "SUPER_ADMIN");
  console.log("Super Admin:    +998900000000 / admin123");

  let cafe = await prisma.cafe.findUnique({ where: { slug: "javohir" } });
  if (!cafe) {
    const owner = await ensureUser("+998901111111", "owner123", "Javohir Aka", "OWNER");
    cafe = await prisma.cafe.create({
      data: { name: "Javohir Cafe", slug: "javohir", status: "ACTIVE", ownerId: owner.id, address: "Toshkent, Chilonzor", workingHours: "09:00 - 23:00" },
    });
    await prisma.user.update({ where: { id: owner.id }, data: { cafeId: cafe.id } });
    console.log("Owner:          +998901111111 / owner123");
  }

  await ensureUser("+998902222222", "waiter123", "Ofitsiant Aziz", "WAITER", cafe.id);
  console.log("Waiter:         +998902222222 / waiter123");
  await ensureUser("+998903333333", "kitchen123", "Oshpaz Karim", "KITCHEN", cafe.id);
  console.log("Kitchen:        +998903333333 / kitchen123");

  const tableCount = await prisma.cafeTable.count({ where: { cafeId: cafe.id } });
  if (tableCount === 0) {
    for (let i = 1; i <= 8; i++) {
      await prisma.cafeTable.create({ data: { cafeId: cafe.id, label: String(i) } });
    }
    console.log("8 ta stol yaratildi");
  }

  const catCount = await prisma.menuCategory.count({ where: { cafeId: cafe.id } });
  if (catCount === 0) {
    const salads = await prisma.menuCategory.create({ data: { cafeId: cafe.id, name: "Salatlar", sortOrder: 0 } });
    const mains = await prisma.menuCategory.create({ data: { cafeId: cafe.id, name: "Issiq taomlar", sortOrder: 1 } });
    const drinks = await prisma.menuCategory.create({ data: { cafeId: cafe.id, name: "Ichimliklar", sortOrder: 2 } });
    const desserts = await prisma.menuCategory.create({ data: { cafeId: cafe.id, name: "Desertlar", sortOrder: 3 } });

    await prisma.menuItem.createMany({
      data: [
        { cafeId: cafe.id, categoryId: salads.id, name: "Achichuk salat", price: 18000, prepTimeMin: 5 },
        { cafeId: cafe.id, categoryId: salads.id, name: "Sezar salat", price: 32000, prepTimeMin: 8 },
        { cafeId: cafe.id, categoryId: mains.id, name: "Lag'mon", price: 35000, prepTimeMin: 15 },
        { cafeId: cafe.id, categoryId: mains.id, name: "Osh", price: 30000, prepTimeMin: 10 },
        { cafeId: cafe.id, categoryId: mains.id, name: "Shashlik (qo'y go'shti)", price: 25000, prepTimeMin: 20 },
        { cafeId: cafe.id, categoryId: mains.id, name: "Manti (5 dona)", price: 28000, prepTimeMin: 18 },
        { cafeId: cafe.id, categoryId: drinks.id, name: "Qora choy (choynak)", price: 8000, prepTimeMin: 3 },
        { cafeId: cafe.id, categoryId: drinks.id, name: "Kola 0.5L", price: 12000, prepTimeMin: 1 },
        { cafeId: cafe.id, categoryId: drinks.id, name: "Limonad (uy)", price: 15000, prepTimeMin: 5 },
        { cafeId: cafe.id, categoryId: desserts.id, name: "Napoleon", price: 20000, prepTimeMin: 2 },
      ],
    });
    console.log("Menyu (4 kategoriya, 10 taom) yaratildi");
  }

  console.log("\nKafe menyusi/QR: http://localhost:3000/javohir");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
