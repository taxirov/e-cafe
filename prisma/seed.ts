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

  // Categories are global (shared by every cafe) — seed them once regardless of which cafe runs first.
  const categoryNames = ["Salatlar", "Issiq taomlar", "Ichimliklar", "Desertlar"];
  const categories: Record<string, { id: string }> = {};
  for (let i = 0; i < categoryNames.length; i++) {
    categories[categoryNames[i]] = await prisma.menuCategory.upsert({
      where: { name: categoryNames[i] },
      update: {},
      create: { name: categoryNames[i], sortOrder: i },
    });
  }

  const dishCount = await prisma.dishCatalog.count();
  if (dishCount === 0) {
    const dishSeeds: { name: string; category: string; price: number; prepTimeMin: number }[] = [
      { name: "Achichuk salat", category: "Salatlar", price: 18000, prepTimeMin: 5 },
      { name: "Sezar salat", category: "Salatlar", price: 32000, prepTimeMin: 8 },
      { name: "Lag'mon", category: "Issiq taomlar", price: 35000, prepTimeMin: 15 },
      { name: "Osh", category: "Issiq taomlar", price: 30000, prepTimeMin: 10 },
      { name: "Shashlik (qo'y go'shti)", category: "Issiq taomlar", price: 25000, prepTimeMin: 20 },
      { name: "Manti (5 dona)", category: "Issiq taomlar", price: 28000, prepTimeMin: 18 },
      { name: "Qora choy (choynak)", category: "Ichimliklar", price: 8000, prepTimeMin: 3 },
      { name: "Kola 0.5L", category: "Ichimliklar", price: 12000, prepTimeMin: 1 },
      { name: "Limonad (uy)", category: "Ichimliklar", price: 15000, prepTimeMin: 5 },
      { name: "Napoleon", category: "Desertlar", price: 20000, prepTimeMin: 2 },
    ];

    for (const d of dishSeeds) {
      const dish = await prisma.dishCatalog.create({
        data: { name: d.name, categoryId: categories[d.category].id, createdByCafeId: cafe.id },
      });
      await prisma.menuItem.create({
        data: { cafeId: cafe.id, dishId: dish.id, price: d.price, prepTimeMin: d.prepTimeMin },
      });
    }
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
