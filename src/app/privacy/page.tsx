import { LegalPage } from "@/components/legal-page";

export const metadata = { title: "Maxfiylik siyosati — e-cafe.uz" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Maxfiylik siyosati" updatedAt="2026-09-01">
      <p>
        Ushbu Maxfiylik siyosati e-cafe.uz platformasi (keyingi o&apos;rinlarda — &laquo;Platforma&raquo;)
        foydalanuvchilarning shaxsiy ma&apos;lumotlarini qanday yig&apos;ishi, ishlatishi va saqlashini
        tushuntiradi. Platformadan foydalanish ushbu siyosatga rozilikni bildiradi.
      </p>

      <h2>1. Qanday ma&apos;lumotlar yig&apos;iladi</h2>
      <ul>
        <li>Ro&apos;yxatdan o&apos;tishda: F.I.Sh., telefon raqami, parol (shifrlangan holda saqlanadi).</li>
        <li>QR-stol yoki yetkazib berish buyurtmasida: mijoz ismi, telefon raqami, yetkazib berish manzili va geolokatsiya koordinatalari.</li>
        <li>Kafe uchun: kafe manzili, joylashuvi, ish vaqti, ijtimoiy tarmoq havolalari.</li>
        <li>Foydalanish davomida: buyurtmalar tarixi va stollar holati (band/bo&apos;sh).</li>
      </ul>

      <h2>2. Ma&apos;lumotlardan foydalanish maqsadi</h2>
      <ul>
        <li>Hisobni yaratish, kirishni tasdiqlash va xavfsizlikni ta&apos;minlash.</li>
        <li>Buyurtmani tegishli kafega/oshxona ekraniga yetkazish va uning bajarilishini kuzatish.</li>
        <li>Yaqin atrofdagi kafelarni geolokatsiya asosida ko&apos;rsatish.</li>
        <li>Texnik qo&apos;llab-quvvatlash va foydalanuvchi murojaatlariga javob berish.</li>
      </ul>

      <h2>3. Ma&apos;lumotlarni uchinchi tomonlarga uzatish</h2>
      <p>
        Platforma shaxsiy ma&apos;lumotlarni sotmaydi. Ma&apos;lumotlar faqat quyidagi hollarda va
        faqat zarur hajmda uzatiladi:
      </p>
      <ul>
        <li>Buyurtma berilgan <strong>kafega</strong> — mijoz ismi, telefoni, manzili va buyurtma tarkibi.</li>
        <li>
          Kafe yetkazib berishni hamkor kuryerlik xizmati (<strong>e-courier.uz</strong>) orqali amalga
          oshirishni tanlagan bo&apos;lsa — yetkazib berish manzili, koordinatalar va aloqa telefoni
          shu xizmatga uzatiladi.
        </li>
        <li>Qonun talab qilgan hollarda — vakolatli davlat organlariga.</li>
      </ul>

      <h2>4. Ma&apos;lumotlarni saqlash va xavfsizlik</h2>
      <p>
        Ma&apos;lumotlar shifrlangan ulanish (HTTPS) orqali uzatiladi va parollar qaytarilmas (hash)
        ko&apos;rinishda saqlanadi. Ma&apos;lumotlar hisobingiz faol bo&apos;lgan davrda saqlanadi;
        hisobni o&apos;chirishni so&apos;rasangiz, qonun talab qilgan hollar (masalan, moliyaviy
        hisobotlar) bundan mustasno, ma&apos;lumotlaringiz o&apos;chiriladi.
      </p>

      <h2>5. Cookie va localStorage</h2>
      <p>
        Platforma tizimga kirish holatini saqlash uchun sessiya cookie&apos;laridan, savatni saqlash
        uchun esa brauzerning localStorage&apos;idan foydalanadi. Bu ma&apos;lumotlar faqat sizning
        qurilmangizda saqlanadi.
      </p>

      <h2>6. Foydalanuvchi huquqlari</h2>
      <ul>
        <li>O&apos;z ma&apos;lumotlaringiz bilan tanishish va ularni to&apos;g&apos;rilashni so&apos;rash.</li>
        <li>Hisobingizni va unga bog&apos;liq ma&apos;lumotlarni o&apos;chirishni so&apos;rash.</li>
      </ul>
      <p>Bu huquqlarni amalga oshirish uchun support@e-cafe.uz manziliga murojaat qiling.</p>

      <h2>7. Siyosatga o&apos;zgartirish kiritish</h2>
      <p>
        Ushbu Maxfiylik siyosati vaqti-vaqti bilan yangilanishi mumkin. Yangi tahrir shu sahifada
        e&apos;lon qilingan paytdan kuchga kiradi.
      </p>

      <h2>8. Aloqa</h2>
      <p>Savol va murojaatlar uchun: support@e-cafe.uz</p>
    </LegalPage>
  );
}
