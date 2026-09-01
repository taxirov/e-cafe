import { LegalPage } from "@/components/legal-page";

export const metadata = { title: "Kafe egasi uchun ommaviy oferta — e-cafe.uz" };

export default function OwnerOfferPage() {
  return (
    <LegalPage title="Kafe egasi uchun ommaviy oferta" updatedAt="2026-09-01">
      <p>
        Ushbu hujjat O&apos;zbekiston Respublikasi Fuqarolik kodeksining 369-moddasiga muvofiq ommaviy
        oferta hisoblanadi. e-cafe.uz platformasida (keyingi o&apos;rinlarda — &laquo;Platforma&raquo;)
        kafe/restoran sifatida ro&apos;yxatdan o&apos;tish shu shartlarni to&apos;liq va so&apos;zsiz
        qabul qilish (aksept) hisoblanadi.
      </p>

      <h2>1. Asosiy tushunchalar</h2>
      <ul>
        <li><strong>Platforma</strong> — e-cafe.uz QR-stol, kassa (POS), oshxona ekrani va yetkazib berish xizmatlari majmuasi.</li>
        <li><strong>Kafe</strong> — Platformada ro&apos;yxatdan o&apos;tgan umumiy ovqatlanish tashkiloti (kafe, restoran, fastfud).</li>
        <li><strong>Taom katalogi</strong> — barcha kafelar uchun umumiy, bir marta yaratiladigan taom yozuvi (DishCatalog); har bir kafe undan o&apos;z narxi va mavjudligi bilan foydalanadi (MenuItem).</li>
      </ul>

      <h2>2. Oferta predmeti</h2>
      <p>
        Platforma Kafega quyidagi imkoniyatlarni beradi: stolga QR-kod orqali mustaqil buyurtma
        (QR-stol), kassa (POS) tizimi, oshxona ekrani, o&apos;z subdomeni ostidagi yetkazib berish
        vitrinasi (<code>{"{kafe}"}.e-cafe.uz</code>) va onlayn buyurtmalarni qabul qilish.
      </p>

      <h2>3. Ro&apos;yxatdan o&apos;tish va faollashtirish</h2>
      <ol>
        <li>Kafe egasi ro&apos;yxatdan o&apos;tishda haqiqiy F.I.Sh., telefon raqami va kafe nomini kiritadi.</li>
        <li>Yangi kafe &laquo;Tasdiqlanishi kutilmoqda&raquo; (PENDING) holatida ro&apos;yxatga olinadi.</li>
        <li>Tekshiruvdan so&apos;ng kafe &laquo;Faol&raquo; (ACTIVE) holatiga o&apos;tkaziladi va onlayn vitrina hamda QR-stol xizmati ochiladi.</li>
      </ol>

      <h2>4. Kafening huquq va majburiyatlari</h2>
      <ul>
        <li>Taqdim etilayotgan taomlarning sifati, tarkibi va narxi uchun to&apos;liq javobgarlik.</li>
        <li>Umumiy taom katalogidagi yozuvga tuzatish kerak bo&apos;lsa, uni to&apos;g&apos;ridan-to&apos;g&apos;ri emas, balki tegishli tartibda yuborish.</li>
        <li>Qabul qilingan buyurtmalarni (stol, olib ketish yoki yetkazib berish) belgilangan vaqtda tayyorlash va holatini yangilab borish.</li>
        <li>Yetkazib berish narxi (deliveryFee) va minimal buyurtma summasini (minOrderTotal) mijozlarga tushunarli qilib ko&apos;rsatish.</li>
      </ul>

      <h2>5. Buyurtmalarni yetkazib berish</h2>
      <p>
        Kafe onlayn (delivery) buyurtmalarni o&apos;z kuryeri bilan yoki Platformaning hamkor xizmati
        (e-courier.uz) orqali yetkazib berishni tanlashi mumkin — bu sozlama kafe boshqaruv panelida
        istalgan vaqtda o&apos;zgartiriladi. e-courier orqali yetkazib berish yoqilgan bo&apos;lsa,
        buyurtma tayyor bo&apos;lganda mijoz manzili va aloqa telefoni avtomatik ravishda kuryerlik
        xizmatiga uzatiladi.
      </p>

      <h2>6. To&apos;lov va komissiya</h2>
      <p>
        Platformadan foydalanish shartlari (tarif, komissiya yoki obuna to&apos;lovi bo&apos;lsa)
        alohida kelishuv yoki Platforma boshqaruv panelida e&apos;lon qilinadi. Mijozdan olinadigan
        to&apos;lovni qabul qilish tartibini Kafening o&apos;zi belgilaydi — Platforma pul
        mablag&apos;larini ushlab turmaydi.
      </p>

      <h2>7. Hisobni to&apos;xtatib qo&apos;yish va bekor qilish</h2>
      <p>
        Kafe quyidagi hollarda &laquo;To&apos;xtatilgan&raquo; (SUSPENDED) holatiga o&apos;tkazilishi
        mumkin: sanitariya-gigiyena yoki oziq-ovqat xavfsizligi qoidalarini buzish, mijozlardan asossiz
        shikoyatlarning takrorlanishi, ushbu oferta talablarini buzish. Kafe egasi o&apos;z hisobini
        istalgan vaqtda yopishni so&apos;rab murojaat qilishi mumkin.
      </p>

      <h2>8. Mas&apos;uliyat</h2>
      <p>
        Kafe taqdim etadigan taom sifati, tozaligi va mijozga yetkazilishi bilan bog&apos;liq barcha
        huquqiy va moliyaviy javobgarlikni mustaqil ko&apos;taradi. Platforma texnik infratuzilma va
        vositachilik xizmatini ko&apos;rsatadi, taom sifati yoki bitim natijasi uchun javobgar emas.
      </p>

      <h2>9. Maxfiylik</h2>
      <p>
        Kafe va uning mijozlariga oid ma&apos;lumotlarning qayta ishlanishi{" "}
        <a href="/privacy" className="underline underline-offset-4">Maxfiylik siyosati</a>ga muvofiq
        amalga oshiriladi.
      </p>

      <h2>10. Nizolarni hal qilish</h2>
      <p>
        Ushbu oferta yuzasidan kelib chiqadigan nizolar muzokaralar yo&apos;li bilan, kelishuvga
        erishilmagan taqdirda O&apos;zbekiston Respublikasi qonunchiligiga muvofiq sud tartibida
        hal qilinadi.
      </p>

      <h2>11. Amal qilish muddati va o&apos;zgartirishlar</h2>
      <p>
        Ushbu oferta kafe hisobi faol bo&apos;lgan davrda amal qiladi. Platforma ofertaga bir
        tomonlama o&apos;zgartirish kiritishi mumkin — yangi tahrir shu sahifada e&apos;lon qilingan
        paytdan kuchga kiradi.
      </p>

      <h2>12. Aloqa</h2>
      <p>Savol va murojaatlar uchun: support@e-cafe.uz</p>
    </LegalPage>
  );
}
