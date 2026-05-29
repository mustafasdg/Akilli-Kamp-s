import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Veritabanı boşsa örnek veriler ekleyelim
  const count = await prisma.menu.count();
  if (count === 0) {
    await prisma.menu.create({
      data: {
        date: today,
        meal1: "MERCİMEK ÇORBASI",
        meal2: "ORMAN KEBABI",
        meal3: "PİRİNÇ PİLAVI",
        calories: 1100
      }
    });

    await prisma.menu.create({
      data: {
        date: tomorrow,
        meal1: "YAYLA ÇORBASI",
        meal2: "ETLİ NOHUT",
        meal3: "KARIŞIK TURŞU",
        calories: 900
      }
    });

    const announcementsData = [
      {
        title: "2026-2027 Eğitim-Öğretim Yılı Uluslararası Öğrenci Başvuru Ve Kayıt İşlemleri",
        content: "2026-2027 Eğitim-Öğretim yılı uluslararası öğrenci başvuru ve kayıt işlemleri hakkında detaylar açıklanmıştır.",
        date: new Date('2026-05-21T14:39:00Z'),
        category: "Akademik"
      },
      {
        title: "Öğretim Üyesi Alımı İlanı (2026-1)",
        content: "Üniversitemiz birimlerine 2547 sayılı Kanun uyarınca öğretim üyesi alınacaktır. Detaylı bilgi web sayfamızdadır.",
        date: new Date('2026-05-13T09:14:00Z'),
        category: "Akademik"
      },
      {
        title: "\"Ramazan'da Nezaket\" Fotoğraf ve Reels Yarışması Sonuçları Açıklandı",
        content: "Ramazan'da Nezaket temalı fotoğraf ve Reels yarışmasında dereceye girenler belirlendi. Kazananları tebrik ederiz.",
        date: new Date('2026-05-08T12:52:00Z'),
        category: "Etkinlik"
      },
      {
        title: "ISUBÜ'den Kapsamlı \"Uygulamalı Tıbbi Sülük Yetiştiriciliği Eğitimi\"",
        content: "Uygulamalı Tıbbi Sülük Yetiştiriciliği Eğitimi sertifika programı başvuruları başlamıştır. Eğitim detayları ve takvimi duyurulmuştur.",
        date: new Date('2026-05-07T16:45:00Z'),
        category: "Etkinlik"
      },
      {
        title: "Yabancı Diller Yüksekokulu Uluslararası Sınav Merkezi Mayıs Ayı Sınav Takvimi Açıklandı",
        content: "Yabancı Diller Yüksekokulu bünyesindeki uluslararası sınav merkezinin Mayıs ayı sınav tarihleri duyurulmuştur.",
        date: new Date('2026-04-28T10:24:00Z'),
        category: "Akademik"
      },
      {
        title: "Erasmus+ Personel Hareketliliği Bilgilendirme Semineri",
        content: "Erasmus+ personel hareketliliği başvuru süreci ve şartları ile ilgili bilgilendirme semineri düzenlenecektir.",
        date: new Date('2026-04-10T14:53:00Z'),
        category: "Uluslararası"
      },
      {
        title: "Üniversitemiz Yabancı Diller Yüksekokulu Uluslararası Sınav Merkezi Nisan Ayı Sınav Takvimi Açıklandı",
        content: "Uluslararası sınav merkezinin Nisan ayı sınav takvimi detayları ilan edilmiştir.",
        date: new Date('2026-03-27T09:08:00Z'),
        category: "Akademik"
      },
      {
        title: "Akademik Personel Ödülleri Başvuruları Başladı",
        content: "2025 yılı Akademik Personel Ödülleri için başvuru ekranı açılmıştır. Adaylar başvurularını sistem üzerinden yapabilirler.",
        date: new Date('2026-03-26T15:29:00Z'),
        category: "Akademik"
      },
      {
        title: "2026 KA131-KA130 Projeleri 2026-2027 Akademik Yılı Personel Hareketliliği İlanı",
        content: "Erasmus+ Personel Hareketliliği 2026-2027 akademik yılı ilan detayları ve başvuru tarihleri yayınlanmıştır.",
        date: new Date('2026-03-10T11:48:00Z'),
        category: "Uluslararası"
      },
      {
        title: "Döner Sermaye İşletmesi Müdürlüğü, İşletme Müdürü Kadrosu İçin Yönetici Adayı Belirleme Programı Yazılı Sınav Sonucu ve Mülakat Bilgileri",
        content: "Döner Sermaye İşletmesi Müdürlüğü yönetici adayı belirleme yazılı sınav sonuçları ve mülakat tarihleri açıklanmıştır.",
        date: new Date('2026-03-10T11:48:00Z'),
        category: "Genel"
      },
      {
        title: "Kariyer ve Yetkinlik Buluşmaları-3 Duyurusu",
        content: "Kariyer ve Yetkinlik Buluşmaları-3 etkinliği hakkında detaylı program ve katılım şartları açıklanmıştır.",
        date: new Date('2026-03-05T12:57:00Z'),
        category: "Kariyer"
      },
      {
        title: "\"Ramazan'da Nezaket\" Fotoğraf ve Reels Yarışması",
        content: "Ramazan'da Nezaket konulu fotoğraf ve Reels video yarışması başvuruları başlamıştır. Tüm öğrencilerimizin katılımını bekliyoruz.",
        date: new Date('2026-03-02T10:14:00Z'),
        category: "Etkinlik"
      },
      {
        title: "Üniversitemiz Yabancı Diller Yüksekokulu Uluslararası Sınav Merkezi'nin Mart Ayı Sınav Takvimi Açıklandı",
        content: "Uluslararası sınav merkezinin Mart ayı sınav takvimi ve saatleri duyurulmuştur.",
        date: new Date('2026-02-27T15:38:00Z'),
        category: "Akademik"
      },
      {
        title: "ISUBU YDYO'dan Üniversitemiz Öğrencilerine ve Öğretim Elemanlarına İngilizce Konuşma Kulübü",
        content: "Yabancı Diller Yüksekokulu tarafından düzenlenecek İngilizce Konuşma Kulübü kayıtları ve çalışma saatleri açıklanmıştır.",
        date: new Date('2026-02-27T15:55:00Z'),
        category: "Topluluk"
      },
      {
        title: "2025 Yılı Akademik Teşvik Nihai Sonuçları Açıklandı",
        content: "2025 yılı Akademik Teşvik Ödeneği nihai sonuç listeleri yayınlanmıştır. Listelere web sitesinden ulaşabilirsiniz.",
        date: new Date('2026-02-06T17:34:00Z'),
        category: "Akademik"
      },
      {
        title: "Öğretim Görevlisi Alımı Nihai Değerlendirme Sonuçları (2025-4)",
        content: "Öğretim görevlisi alımı nihai değerlendirme sonuçları açıklanmıştır. Kazanan adayların kayıt yaptırması gerekmektedir.",
        date: new Date('2026-01-28T10:12:00Z'),
        category: "Akademik"
      },
      {
        title: "2025 Yılı Akademik Teşvik Sonuçları Açıklandı",
        content: "2025 yılı Akademik Teşvik başvuru ön sonuçları açıklanmıştır. İtiraz süreci detayları duyurulmuştur.",
        date: new Date('2026-01-27T15:09:00Z'),
        category: "Akademik"
      },
      {
        title: "2025-2026 Eğitim-Öğretim Yılı Bahar Dönemi Yatay Geçiş Başvuru Sonuçları",
        content: "Bahar dönemi yatay geçiş değerlendirme sonuçları ve kayıt takvimi açıklanmıştır.",
        date: new Date('2026-01-23T10:12:00Z'),
        category: "Akademik"
      },
      {
        title: "Öğretim Görevlisi Alımı Ön Değerlendirme Sonuçları (2025-4)",
        content: "Öğretim görevlisi kadroları için ön değerlendirme sonuç listeleri ilan edilmiştir.",
        date: new Date('2026-01-21T14:51:00Z'),
        category: "Akademik"
      }
    ];

    for (const ann of announcementsData) {
      await prisma.announcement.create({
        data: ann
      });
    }

    console.log("Örnek veriler eklendi!");
  } else {
    console.log("Veritabanı zaten dolu.");
  }
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
