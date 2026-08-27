# e-cafe.uz

Kafe va restoranlar ro'yxatdan o'tib, QR-stol orqali mijoz buyurtmasi, ofitsiant POS'i va oshxona ekranini (KDS) bir joyda, **real vaqtda** boshqaradigan ko'p-kafeli (multi-tenant) SaaS platforma.

## Texnologiyalar

- **Next.js 16 (App Router) + TypeScript** — asosiy web ilova
- **PostgreSQL + Prisma ORM** — ma'lumotlar bazasi
- **Auth.js (NextAuth v5)** — telefon raqam + parol bilan autentifikatsiya, rollarga asoslangan ruxsatlar
- **Socket.IO** (`realtime-server/`) — alohida Node/Express server: yangi buyurtma, holat o'zgarishi, stol holati — barchasi websocket orqali bir zumda
- **Tailwind CSS + shadcn/ui (Base UI)** — mobile-first interfeys
- **Middleware bilan subdomen marshrutlash** — `{slug}.e-cafe.uz` har bir kafening ochiq menyusi, `app.e-cafe.uz` xodimlar paneli (dashboard/login/register), `e-cafe.uz` — umumiy landing

## Rollar

- **SUPER_ADMIN** — platforma egasi: kafelarni tasdiqlaydi/bloklaydi (`/dashboard/admin`)
- **OWNER** — kafe egasi: menyu, stollar/QR, xodimlar, buyurtmalar, sozlamalar (`/dashboard/owner`) — waiter/kitchen ekranlariga ham kira oladi
- **WAITER** — ofitsiant: stollar bo'yicha POS, tayyor buyurtmalarni yetkazish, to'lovni yakunlash (`/dashboard/waiter`)
- **KITCHEN** — oshpaz: oshxona ekrani (KDS), buyurtma holatini yangilaydi (`/dashboard/kitchen`)
- **CUSTOMER** — QR-kod orqali (yoki yetkazib berish/olib ketish sahifasidan) login qilmasdan buyurtma beradi

## Buyurtma oqimi

1. Mijoz stoldagi QR-kodni skanerlaydi -> `{slug}.e-cafe.uz/?table={qrToken}` -> menyu ochiladi, savat yig'iladi, buyurtma yuboriladi.
2. Buyurtma **darhol** (websocket orqali) oshxona ekrani va ofitsiant/egasi paneliga tushadi, stol "Band" bo'lib belgilanadi.
3. Oshpaz holatni yangilaydi: Qabul qilindi -> Tasdiqlandi -> Tayyorlanmoqda -> Tayyor.
4. Mijozning `/order/[id]` kuzatish sahifasi sahifani yangilamasdan, real vaqtda holatni ko'rsatadi.
5. Ofitsiant tayyor buyurtmani stolga olib boradi -> "Berildi" deb belgilaydi.
6. Ofitsiant "Hisob-kitob" tugmasi orqali to'lov usulini (Naqd/Karta) tanlab buyurtmani yakunlaydi -> **chek** chiqariladi (chop etish mumkin), stol avtomatik "Bo'sh"ga qaytadi.

Yetkazib berish/olib ketish uchun mijoz kafening `{slug}.e-cafe.uz` sahifasida (QR'siz) tegishli rejimni tanlaydi — bunday buyurtmalar "Tayyor" bo'lgan zahoti to'g'ridan-to'g'ri to'lov bosqichiga o'tadi (stolga "berish" bosqichisiz).

## Lokal ishga tushirish

### 1. Asosiy ilova

```bash
npm install
npx prisma dev -d -n ecafe   # o'zining alohida lokal Postgres serverini fonda ishga tushiradi
npx prisma migrate dev       # jadvallarni yaratadi
npm run seed                 # Super Admin + namunaviy kafe (Javohir Cafe) yaratadi
npm run dev
```

`.env` faylida quyidagilar avtomatik sozlangan (lokal dev uchun):

- `DATABASE_URL` — `prisma dev -n ecafe` bergan lokal Postgres manzili
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `NEXT_PUBLIC_ROOT_DOMAIN` — lokal dev'da subdomen marshrutlash `*.localhost` orqali ishlaydi, bu qiymat production domenga tegishli
- `NEXT_PUBLIC_REALTIME_URL`, `REALTIME_JWT_SECRET`, `REALTIME_API_KEY`

**Production'ga chiqishdan oldin barcha secret qiymatlarni albatta almashtiring.**

Seed hisoblari:

| Rol | Telefon | Parol |
|---|---|---|
| Super Admin | +998900000000 | admin123 |
| Owner (Javohir Cafe) | +998901111111 | owner123 |
| Waiter | +998902222222 | waiter123 |
| Kitchen | +998903333333 | kitchen123 |

Kirish uchun: `http://app.localhost:3000/login` (yoki `http://localhost:3000/login` ga kirsangiz avtomatik shu yerga yo'naltiriladi).

QR-stol sinash uchun: `/dashboard/owner/tables` sahifasida stol QR-kodini chop eting, yoki to'g'ridan-to'g'ri `http://javohir.localhost:3000` ni oching (subdomen sifatida).

### 2. Realtime server

Ikkinchi terminalda:

```bash
cd realtime-server
npm install
npm run dev
```

`ALLOWED_ORIGINS` da barcha kerakli origin'lar bo'lishi shart (lokal uchun `.env.example`da tayyor: `http://localhost:3000,http://*.localhost:3000` — bu `app.localhost:3000` va har qanday `{slug}.localhost:3000`ni qamrab oladi).

## Deploy qilish

1. `prisma migrate deploy` bilan production bazasida migratsiyalarni qo'llang.
2. `realtime-server/`ni alohida Node servisiga (Render/Railway) joylashtiring.
3. `NEXT_PUBLIC_REALTIME_URL`, `REALTIME_JWT_SECRET`, `REALTIME_API_KEY` qiymatlarini asosiy ilova va realtime-server'da bir xil qilib sozlang.
4. Asosiy ilovaga `NEXT_PUBLIC_ROOT_DOMAIN` (masalan `e-cafe.uz`) qo'shing.
5. realtime-server'ning `ALLOWED_ORIGINS`iga production origin'larni qo'shing: `https://e-cafe.uz,https://app.e-cafe.uz,https://*.e-cafe.uz`.
6. Domen: Cloudflare'da (yoki boshqa DNS provayder) `e-cafe.uz`, `app.e-cafe.uz` va wildcard `*.e-cafe.uz` yozuvlarini Vercel'ga yo'naltiring (DNS-only rejimda, Vercel SSL sertifikatlarini avtomatik chiqarishi uchun). Vercel loyiha sozlamalarida shu uchala domenni ham qo'shing.

Batafsil (Cloudflare + Vercel wildcard sozlash qadamlari) uchun `e-mall` loyihasining README'siga qarang — arxitektura bir xil.

## Hozircha qamrovga kirmagan (keyingi bosqichlar)

- To'lov integratsiyasi (Click, Payme) — hozircha naqd/karta qo'lda belgilanadi
- Mahsulot rasmlarini yuklash UI
- Modifikatorlar/variantlar (masalan, taom o'lchami)
