import { LegalPage } from "@/components/legal-page";

export const metadata = { title: "Foydalanish shartlari — e-cafe.uz" };

export default function TermsPage() {
  return (
    <LegalPage title="Foydalanish shartlari" updatedAt="2026-09-01">
      <p>
        Ushbu Foydalanish shartlari (keyingi o&apos;rinlarda — &laquo;Shartlar&raquo;) e-cafe.uz saytidan
        (keyingi o&apos;rinlarda — &laquo;Platforma&raquo;) foydalanadigan barcha shaxslarga — kafe
        egalariga, ularning xodimlariga va mijozlariga nisbatan qo&apos;llaniladi. Platformadan
        foydalanish Shartlarni to&apos;liq qabul qilishni bildiradi.
      </p>

      <h2>1. Hisob va ro&apos;yxatdan o&apos;tish</h2>
      <ul>
        <li>Hisob yaratishda faqat haqiqiy va o&apos;ziga tegishli ma&apos;lumotlar (telefon raqami, F.I.Sh.) kiritilishi shart.</li>
        <li>Telefon raqami va parolning maxfiyligini saqlash foydalanuvchining o&apos;z zimmasida.</li>
        <li>Bir kishi bir nechta hisob yaratib, tizimni suiiste&apos;mol qilmasligi kerak.</li>
      </ul>

      <h2>2. Taqiqlangan harakatlar</h2>
      <ul>
        <li>Platformaga zararli kod, avtomatlashtirilgan so&apos;rovlar (bot) orqali ortiqcha yuklama berish.</li>
        <li>Boshqa foydalanuvchi yoki kafe nomidan soxta harakat qilish.</li>
        <li>Sanitariya-gigiyena talablariga javob bermaydigan taomlarni joylashtirish.</li>
        <li>Platforma orqali olingan ma&apos;lumotlardan (mijozlar bazasi, telefon raqamlari) uning maqsadidan tashqari, ruxsatsiz foydalanish.</li>
      </ul>

      <h2>3. Intellektual mulk</h2>
      <p>
        Platformaning dizayni, kod bazasi, savdo belgisi (e-cafe.uz) va boshqa intellektual mulk
        obyektlari uning egasiga tegishli. Kafe o&apos;zi yuklagan logotip, banner va taom rasmlariga
        bo&apos;lgan huquqlarni saqlab qoladi, ammo ularni Platformada namoyish etish huquqini beradi.
      </p>

      <h2>4. Xizmatning mavjudligi</h2>
      <p>
        Platforma texnik profilaktika, yangilanish yoki uchinchi tomon xizmatlaridagi (aloqa, hosting)
        uzilishlar sababli vaqtincha ishlamasligi mumkin. Bunday holatlar uchun Platforma oldindan
        xabar berishga harakat qiladi, biroq bu majburiy emas.
      </p>

      <h2>5. Hisobni cheklash yoki yopish</h2>
      <p>
        Ushbu Shartlar yoki{" "}
        <a href="/offer" className="underline underline-offset-4">Kafe egasi uchun ommaviy oferta</a>{" "}
        buzilgan taqdirda, Platforma foydalanuvchi hisobini ogohlantirishsiz cheklash yoki yopish
        huquqini o&apos;zida saqlaydi.
      </p>

      <h2>6. Mas&apos;uliyatni cheklash</h2>
      <p>
        Platforma vositachi sifatida ishlaydi va kafelar tomonidan taqdim etilgan ma&apos;lumot yoki
        taom sifatiga to&apos;g&apos;ridan-to&apos;g&apos;ri javobgar emas. Platforma faoliyatidan kelib
        chiqishi mumkin bo&apos;lgan bilvosita zararlar uchun javobgarlik qonun ruxsat etgan maksimal
        darajada cheklanadi.
      </p>

      <h2>7. Shartlarga o&apos;zgartirish kiritish</h2>
      <p>
        Platforma ushbu Shartlarga istalgan vaqtda o&apos;zgartirish kiritishi mumkin. Yangi tahrir
        shu sahifada e&apos;lon qilingan paytdan boshlab kuchga kiradi.
      </p>

      <h2>8. Amal qiluvchi qonunchilik</h2>
      <p>
        Ushbu Shartlar O&apos;zbekiston Respublikasi qonunchiligiga muvofiq tuziladi va talqin
        qilinadi. Nizolar kelishuv orqali, imkonsiz bo&apos;lganda esa O&apos;zbekiston Respublikasi
        sudlarida hal qilinadi.
      </p>

      <h2>9. Aloqa</h2>
      <p>Savol va murojaatlar uchun: support@e-cafe.uz</p>
    </LegalPage>
  );
}
