using Microsoft.AspNetCore.Identity;
using SmartCampus.Domain.Entities;
using SmartCampus.Infrastructure.Context;

namespace SmartCampus.Infrastructure.Persistence
{
    public static class DbInitializer
    {
        public static void Initialize(ApplicationDbContext context, IPasswordHasher<User> passwordHasher)
        {
            SeedUsers(context, passwordHasher);
            SeedLocations(context);
            SeedAnnouncements(context);
            SeedMenus(context);
            SeedNews(context);
            SeedEvents(context);
        }

        private static void SeedUsers(ApplicationDbContext context, IPasswordHasher<User> passwordHasher)
        {
            // Admin yoksa ekle
            if (!context.Users.Any(u => u.Email == "admin@smartcampus.local"))
            {
                var adminUser = new User
                {
                    Name = "Admin",
                    Email = "admin@smartcampus.local",
                    Role = "admin",
                    CreatedAt = DateTime.UtcNow
                };
                adminUser.PasswordHash = passwordHasher.HashPassword(adminUser, "Admin123!");
                context.Users.Add(adminUser);
                context.SaveChanges();
            }

            // Demo kullanıcı yoksa ekle
            if (!context.Users.Any(u => u.Email == "demo@smartcampus.local"))
            {
                var demoUser = new User
                {
                    Name = "Demo Kullanici",
                    Email = "demo@smartcampus.local",
                    Role = "user",
                    CreatedAt = DateTime.UtcNow
                };
                demoUser.PasswordHash = passwordHasher.HashPassword(demoUser, "SmartCampus123!");
                context.Users.Add(demoUser);
                context.SaveChanges();
            }
        }

        private static void SeedLocations(ApplicationDbContext context)
        {
            // Her zaman temizle ve gerçek kampüs verileriyle yeniden doldur
            if (context.Locations.Any())
            {
                context.Locations.RemoveRange(context.Locations);
                context.SaveChanges();
            }

            var locations = new[]
            {
                new Location { Bina_Adi = "ISUBÜ Rektörlük",                       Enlem = 37.7789, Boylam = 30.5467, Aciklama = "Isparta Uygulamalı Bilimler Üniversitesi Rektörlük Binası" },
                new Location { Bina_Adi = "ISUBÜ 100. Yıl Binası",                  Enlem = 37.7588, Boylam = 30.5478, Aciklama = "Teknoloji Fakültesi — 100. Yıl Kampüsü" },
                new Location { Bina_Adi = "ISUBÜ Orman Fakültesi",                   Enlem = 37.8321, Boylam = 30.5378, Aciklama = "Isparta Uygulamalı Bilimler Üniversitesi Orman Fakültesi" },
                new Location { Bina_Adi = "ISUBÜ Ziraat Fakültesi",                  Enlem = 37.8343, Boylam = 30.5386, Aciklama = "Isparta Uygulamalı Bilimler Üniversitesi Ziraat Fakültesi" },
                new Location { Bina_Adi = "ISUBÜ Eğirdir Su Ürünleri Fakültesi",     Enlem = 37.8340, Boylam = 30.5378, Aciklama = "Su Ürünleri Fakültesi" },
                new Location { Bina_Adi = "SDÜ Olimpik Yüzme Havuzu",               Enlem = 37.8323, Boylam = 30.5330, Aciklama = "SDÜ 29 Ekim Olimpik Yüzme Havuzu" },
                new Location { Bina_Adi = "SDÜ Starbucks (WPS)",                     Enlem = 37.8315, Boylam = 30.5264, Aciklama = "SDÜ Kütüphane Starbucks Kafesi" },
                new Location { Bina_Adi = "SDÜ Bilgi Merkezi",                       Enlem = 37.8287, Boylam = 30.5318, Aciklama = "Süleyman Demirel Üniversitesi Kütüphane ve Bilgi Merkezi" },
                new Location { Bina_Adi = "Taş Cafe Restaurant",                     Enlem = 37.8295, Boylam = 30.5289, Aciklama = "Kampüs içi kafe ve restoran" },
                new Location { Bina_Adi = "ISUBÜ Isparta MYO",                       Enlem = 37.8286, Boylam = 30.5350, Aciklama = "Isparta Uygulamalı Bilimler Üniversitesi Isparta Meslek Yüksekokulu" },
                new Location { Bina_Adi = "ISUBÜ Teknik Bilimler Yüksekokulu",       Enlem = 37.8321, Boylam = 30.5268, Aciklama = "İsparta Uygulamalı Bilimler Üniversitesi Teknik Bilimler Yüksekokulu" },
                new Location { Bina_Adi = "SDÜ Yemekhanesi",                         Enlem = 37.8260, Boylam = 30.5339, Aciklama = "Süleyman Demirel Üniversitesi Ana Yemekhanesi" },
                new Location { Bina_Adi = "Ateş Döner",                              Enlem = 37.7586, Boylam = 30.5475, Aciklama = "100. Yıl Kampüsü yakını — döner ve yemek" },
                new Location { Bina_Adi = "Base Büfe",                               Enlem = 37.7588, Boylam = 30.5475, Aciklama = "100. Yıl Kampüsü büfe" },
                new Location { Bina_Adi = "ISUBÜ Keçiborlu MYO",                     Enlem = 37.9490, Boylam = 30.3040, Aciklama = "Isparta Uygulamalı Bilimler Üniversitesi Keçiborlu Meslek Yüksekokulu" },
            };

            context.Locations.AddRange(locations);
            context.SaveChanges();
        }

        private static void SeedAnnouncements(ApplicationDbContext context)
        {
            if (context.Announcements.Any())
            {
                context.Announcements.RemoveRange(context.Announcements);
                context.SaveChanges();
            }

            var announcements = new[]
            {
                new Announcement { Baslik = "2026-2027 Eğitim-Öğretim Yılı Uluslararası Öğrenci Başvuru Ve Kayıt İşlemleri", Icerik = "2026-2027 Eğitim-Öğretim yılı uluslararası öğrenci başvuru ve kayıt işlemleri hakkında detaylar açıklanmıştır.", Tarih = new DateTime(2026, 5, 21, 14, 39, 0), Kategori = "Akademik" },
                new Announcement { Baslik = "Öğretim Üyesi Alımı İlanı (2026-1)", Icerik = "Üniversitemiz birimlerine 2547 sayılı Kanun uyarınca öğretim üyesi alınacaktır. Detaylı bilgi web sayfamızdadır.", Tarih = new DateTime(2026, 5, 13, 9, 14, 0), Kategori = "Akademik" },
                new Announcement { Baslik = "\"Ramazan'da Nezaket\" Fotoğraf ve Reels Yarışması Sonuçları Açıklandı", Icerik = "Ramazan'da Nezaket temalı fotoğraf ve Reels yarışmasında dereceye girenler belirlendi. Kazananları tebrik ederiz.", Tarih = new DateTime(2026, 5, 8, 12, 52, 0), Kategori = "Etkinlik" },
                new Announcement { Baslik = "ISUBÜ'den Kapsamlı \"Uygulamalı Tıbbi Sülük Yetiştiriciliği Eğitimi\"", Icerik = "Uygulamalı Tıbbi Sülük Yetiştiriciliği Eğitimi sertifika programı başvuruları başlamıştır. Eğitim detayları ve takvimi duyurulmuştur.", Tarih = new DateTime(2026, 5, 7, 16, 45, 0), Kategori = "Etkinlik" },
                new Announcement { Baslik = "Yabancı Diller Yüksekokulu Uluslararası Sınav Merkezi Mayıs Ayı Sınav Takvimi Açıklandı", Icerik = "Yabancı Diller Yüksekokulu bünyesindeki uluslararası sınav merkezinin Mayıs ayı sınav tarihleri duyurulmuştur.", Tarih = new DateTime(2026, 4, 28, 10, 24, 0), Kategori = "Akademik" },
                new Announcement { Baslik = "Erasmus+ Personel Hareketliliği Bilgilendirme Semineri", Icerik = "Erasmus+ personel hareketliliği başvuru süreci ve şartları ile ilgili bilgilendirme semineri düzenlenecektir.", Tarih = new DateTime(2026, 4, 10, 14, 53, 0), Kategori = "Uluslararası" },
                new Announcement { Baslik = "Üniversitemiz Yabancı Diller Yüksekokulu Uluslararası Sınav Merkezi Nisan Ayı Sınav Takvimi Açıklandı", Icerik = "Uluslararası sınav merkezinin Nisan ayı sınav takvimi detayları ilan edilmiştir.", Tarih = new DateTime(2026, 3, 27, 9, 8, 0), Kategori = "Akademik" },
                new Announcement { Baslik = "Akademik Personel Ödülleri Başvuruları Başladı", Icerik = "2025 yılı Akademik Personel Ödülleri için başvuru ekranı açılmıştır. Adaylar başvurularını sistem üzerinden yapabilirler.", Tarih = new DateTime(2026, 3, 26, 15, 29, 0), Kategori = "Akademik" },
                new Announcement { Baslik = "2026 KA131-KA130 Projeleri 2026-2027 Akademik Yılı Personel Hareketliliği İlanı", Icerik = "Erasmus+ Personel Hareketliliği 2026-2027 akademik yılı ilan detayları ve başvuru tarihleri yayınlanmıştır.", Tarih = new DateTime(2026, 3, 10, 11, 48, 0), Kategori = "Uluslararası" },
                new Announcement { Baslik = "Döner Sermaye İşletmesi Müdürlüğü, İşletme Müdürü Kadrosu İçin Yönetici Adayı Belirleme Programı Yazılı Sınav Sonucu ve Mülakat Bilgileri", Icerik = "Döner Sermaye İşletmesi Müdürlüğü yönetici adayı belirleme yazılı sınav sonuçları ve mülakat tarihleri açıklanmıştır.", Tarih = new DateTime(2026, 3, 10, 11, 48, 0), Kategori = "Genel" },
                new Announcement { Baslik = "Kariyer ve Yetkinlik Buluşmaları-3 Duyurusu", Icerik = "Kariyer ve Yetkinlik Buluşmaları-3 etkinliği hakkında detaylı program ve katılım şartları açıklanmıştır.", Tarih = new DateTime(2026, 3, 5, 12, 57, 0), Kategori = "Kariyer" },
                new Announcement { Baslik = "\"Ramazan'da Nezaket\" Fotoğraf ve Reels Yarışması", Icerik = "Ramazan'da Nezaket konulu fotoğraf ve Reels video yarışması başvuruları başlamıştır. Tüm öğrencilerimizin katılımını bekliyoruz.", Tarih = new DateTime(2026, 3, 2, 10, 14, 0), Kategori = "Etkinlik" },
                new Announcement { Baslik = "Üniversitemiz Yabancı Diller Yüksekokulu Uluslararası Sınav Merkezi'nin Mart Ayı Sınav Takvimi Açıklandı", Icerik = "Uluslararası sınav merkezinin Mart ayı sınav takvimi ve saatleri duyurulmuştur.", Tarih = new DateTime(2026, 2, 27, 15, 38, 0), Kategori = "Akademik" },
                new Announcement { Baslik = "ISUBU YDYO'dan Üniversitemiz Öğrencilerine ve Öğretim Elemanlarına İngilizce Konuşma Kulübü", Icerik = "Yabancı Diller Yüksekokulu tarafından düzenlenecek İngilizce Konuşma Kulübü kayıtları ve çalışma saatleri açıklanmıştır.", Tarih = new DateTime(2026, 2, 27, 15, 55, 0), Kategori = "Topluluk" },
                new Announcement { Baslik = "2025 Yılı Akademik Teşvik Nihai Sonuçları Açıklandı", Icerik = "2025 yılı Akademik Teşvik Ödeneği nihai sonuç listeleri yayınlanmıştır. Listelere web sitesinden ulaşabilirsiniz.", Tarih = new DateTime(2026, 2, 6, 17, 34, 0), Kategori = "Akademik" },
                new Announcement { Baslik = "Öğretim Görevlisi Alımı Nihai Değerlendirme Sonuçları (2025-4)", Icerik = "Öğretim görevlisi alımı nihai değerlendirme sonuçları açıklanmıştır. Kazanan adayların kayıt yaptırması gerekmektedir.", Tarih = new DateTime(2026, 1, 28, 10, 12, 0), Kategori = "Akademik" },
                new Announcement { Baslik = "2025 Yılı Akademik Teşvik Sonuçları Açıklandı", Icerik = "2025 yılı Akademik Teşvik başvuru ön sonuçları açıklanmıştır. İtiraz süreci detayları duyurulmuştur.", Tarih = new DateTime(2026, 1, 27, 15, 9, 0), Kategori = "Akademik" },
                new Announcement { Baslik = "2025-2026 Eğitim-Öğretim Yılı Bahar Dönemi Yatay Geçiş Başvuru Sonuçları", Icerik = "Bahar dönemi yatay geçiş değerlendirme sonuçları ve kayıt takvimi açıklanmıştır.", Tarih = new DateTime(2026, 1, 23, 10, 12, 0), Kategori = "Akademik" },
                new Announcement { Baslik = "Öğretim Görevlisi Alımı Ön Değerlendirme Sonuçları (2025-4)", Icerik = "Öğretim görevlisi kadroları için ön değerlendirme sonuç listeleri ilan edilmiştir.", Tarih = new DateTime(2026, 1, 21, 14, 51, 0), Kategori = "Akademik" }
            };

            context.Announcements.AddRange(announcements);
            context.SaveChanges();
        }

        private static void SeedMenus(ApplicationDbContext context)
        {
            if (context.Menus.Any())
            {
                return;
            }

            var menus = new[]
            {
                // Week 1
                new Menu { Tarih = new DateTime(2026, 5, 25), Yemek_1 = "RESMİ TATİL", Kalori = 0 },
                new Menu { Tarih = new DateTime(2026, 5, 26), Yemek_1 = "RESMİ TATİL", Kalori = 0 },
                new Menu { Tarih = new DateTime(2026, 5, 27), Yemek_1 = "RESMİ TATİL", Kalori = 0 },
                new Menu { Tarih = new DateTime(2026, 5, 28), Yemek_1 = "RESMİ TATİL", Kalori = 0 },
                new Menu { Tarih = new DateTime(2026, 5, 29), Yemek_1 = "RESMİ TATİL", Kalori = 0 },

                // Week 2
                new Menu { Tarih = new DateTime(2026, 6, 1), Yemek_1 = "YAYLA ÇORBA", Yemek_2 = "PATLICAN MUSAKKA", Yemek_3 = "ŞEHRİYELİ PİRİNÇ PİLAV", Yemek_4 = "YOĞURT", Kalori = 1050 },
                new Menu { Tarih = new DateTime(2026, 6, 2), Yemek_1 = "ANTEP ÇORBA", Yemek_2 = "KAĞIT KEBAB", Yemek_3 = "BULGUR PİLAVİ", Yemek_4 = "TRİLİÇE", Kalori = 1250 },
                new Menu { Tarih = new DateTime(2026, 6, 3), Yemek_1 = "MERCİMEK ÇORBA", Yemek_2 = "ETLİ NOHUT", Yemek_3 = "PİRİNÇ PİLAV", Yemek_4 = "TURŞU", Kalori = 900 },
                new Menu { Tarih = new DateTime(2026, 6, 4), Yemek_1 = "TARHANA ÇORBA", Yemek_2 = "ÇITIR TAVUK", Yemek_3 = "SOSLU MAKARNA", Yemek_4 = "AYRAN", Kalori = 930 },
                new Menu { Tarih = new DateTime(2026, 6, 5), Yemek_1 = "DOMATES ÇORBA", Yemek_2 = "TAZE FASULYE", Yemek_3 = "BULGUR PİLAVİ", Yemek_4 = "CACIK", Kalori = 850 },

                // Week 3
                new Menu { Tarih = new DateTime(2026, 6, 8), Yemek_1 = "TANDIR ÇORBA", Yemek_2 = "ETLİ KURU FASULYE", Yemek_3 = "PİRİNÇ PİLAVİ", Yemek_4 = "TURŞU", Kalori = 980 },
                new Menu { Tarih = new DateTime(2026, 6, 9), Yemek_1 = "EZOGELİN ÇORBA", Yemek_2 = "ORMAN KEBABI", Yemek_3 = "BULGUR PİLAVİ", Yemek_4 = "ŞAMBALİ", Kalori = 1200 },
                new Menu { Tarih = new DateTime(2026, 6, 10), Yemek_1 = "MERCİMEK ÇORBA", Yemek_2 = "TAVUK DÖNER", Yemek_3 = "PİRİNÇ PİLAV", Yemek_4 = "AYRAN", Kalori = 1000 },
                new Menu { Tarih = new DateTime(2026, 6, 11), Yemek_1 = "YAYLA ÇORBA", Yemek_2 = "PATATES MUSAKKA", Yemek_3 = "ERİŞTE", Yemek_4 = "YOĞURT", Kalori = 900 },
                new Menu { Tarih = new DateTime(2026, 6, 12), Yemek_1 = "TARHANA ÇORBA", Yemek_2 = "KARIŞIK IZGARA", Yemek_3 = "PİRİNÇ PİLAVİ", Yemek_4 = "SALATA", Kalori = 1100 },

                // Week 4
                new Menu { Tarih = new DateTime(2026, 6, 15), Yemek_1 = "MERCİMEK ÇORBA", Yemek_2 = "FIRIN TÜRLÜ", Yemek_3 = "PİRİNÇ PİLAV", Yemek_4 = "MEYVE", Kalori = 900 },
                new Menu { Tarih = new DateTime(2026, 6, 16), Yemek_1 = "ŞEHRİYE ÇORBA", Yemek_2 = "TAVUK ŞİŞ", Yemek_3 = "MAKARNA", Yemek_4 = "SÜTLAÇ", Kalori = 1200 },
                new Menu { Tarih = new DateTime(2026, 6, 17), Yemek_1 = "EZOGELİN ÇORBA", Yemek_2 = "PÜRELİ ROSTO KÖFTE", Yemek_3 = "BULGUR PİLAV", Yemek_4 = "SALATA", Kalori = 1099 },
                new Menu { Tarih = new DateTime(2026, 6, 18), Yemek_1 = "DOMATES ÇORBA", Yemek_2 = "KARNIYARIK", Yemek_3 = "PİRİNÇ PİLAV", Yemek_4 = "CACIK", Kalori = 1000 },
                new Menu { Tarih = new DateTime(2026, 6, 19), Yemek_1 = "YAYLA ÇORBA", Yemek_2 = "ETLİ NOHUT", Yemek_3 = "SEBZELİ BULGUR PİLAVI", Yemek_4 = "TURŞU", Kalori = 900 }
            };

            context.Menus.AddRange(menus);
            context.SaveChanges();
        }

        private static void SeedNews(ApplicationDbContext context)
        {
            if (context.News.Any())
            {
                return;
            }

            var newsList = new[]
            {
                new News { Tarih = new DateTime(2026, 5, 25, 15, 24, 0), Baslik = "Türkiye Ulusal Ajansı Yükseköğretim Yeni Başlayanlar Toplantısı ISUBÜ'de Gerçekleşti", Icerik = "Türkiye Ulusal Ajansı tarafından düzenlenen yükseköğretim yeni başlayanlar bilgilendirme toplantısı ISUBÜ ev sahipliğinde başarıyla tamamlandı.", Kategori = "Genel" },
                new News { Tarih = new DateTime(2026, 5, 25, 14, 11, 0), Baslik = "Rektör Prof. Dr. Yılmaz ÇATAL'ın \"Kurban Bayramı\" Mesajı", Icerik = "Rektörümüz Prof. Dr. Yılmaz ÇATAL, kurban bayramı vesilesiyle tüm akademik personelimiz ve öğrencilerimiz için kutlama mesajı yayınladı.", Kategori = "Rektörlük" },
                new News { Tarih = new DateTime(2026, 5, 21, 13, 40, 0), Baslik = "ISUBÜ'nün 8. Kuruluş Yıldönümünde İdari Personele Özel Tören", Icerik = "Üniversitemizin 8. kuruluş yıldönümü etkinlikleri kapsamında idari personellerimizin katkılarını onurlandırmak amacıyla özel bir tören düzenlendi.", Kategori = "Etkinlik" },
                new News { Tarih = new DateTime(2026, 5, 20, 18, 29, 0), Baslik = "ISUBÜ'nün 8. Kuruluş Yıldönümü Kapsamında Akademik Personel Ödülleri ve Biniş Giyme Töreni Gerçekleştirildi", Icerik = "8. kuruluş yıldönümü kutlamaları kapsamında akademik yükselme gösteren hocalarımıza biniş giydirildi ve akademik ödüller takdim edildi.", Kategori = "Akademik" },
                new News { Tarih = new DateTime(2026, 5, 20, 9, 11, 0), Baslik = "ISUBÜ Gastronomi ve Mutfak Sanatları Ekibi, Rusya'daki Uluslararası Turnuvadan Ödülle Döndü", Icerik = "Gastronomi ve Mutfak Sanatları bölümü öğrencilerimiz Rusya'da düzenlenen uluslararası yemek yarışmasında büyük bir başarı elde ederek ödüllerle ülkemize döndü.", Kategori = "Başarı" },
                new News { Tarih = new DateTime(2026, 5, 15, 18, 33, 0), Baslik = "ISUBÜ'de Uluslararası Öğrenciler Mezuniyet Töreni Düzenlendi", Icerik = "Farklı ülkelerden üniversitemize gelerek eğitimlerini başarıyla tamamlayan uluslararası öğrencilerimiz için coşkulu bir mezuniyet töreni yapıldı.", Kategori = "Etkinlik" },
                new News { Tarih = new DateTime(2026, 5, 15, 8, 34, 0), Baslik = "Rektör Prof. Dr. Yılmaz ÇATAL'ın \"19 Mayıs Atatürk'ü Anma, Gençlik ve Spor Bayramı\" Mesajı", Icerik = "Rektörümüz 19 Mayıs Atatürk'ü Anma, Gençlik ve Spor Bayramı dolayısıyla yayınladığı mesajda gençlerimizin bayramını kutladı.", Kategori = "Rektörlük" },
                new News { Tarih = new DateTime(2026, 5, 14, 16, 57, 0), Baslik = "ISUBÜ Orman Oyunları Olimpiyatı 2026 Gerçekleştirildi", Icerik = "Orman Fakültesi tarafından her yıl geleneksel olarak düzenlenen Orman Oyunları Olimpiyatları bu yıl da renkli görüntülere sahne oldu.", Kategori = "Etkinlik" },
                new News { Tarih = new DateTime(2026, 5, 13, 17, 1, 0), Baslik = "ISUBÜ Sahne Orkestrası İlk Konseriyle Sahne Aldı", Icerik = "Üniversitemiz bünyesinde yeni kurulan Sahne Orkestrası, dinleyicilere unutulmaz bir müzik ziyafeti sunarak ilk konserini gerçekleştirdi.", Kategori = "Kültür" },
                new News { Tarih = new DateTime(2026, 5, 13, 9, 20, 0), Baslik = "Dünya Biyoçeşitlilik Günü'nde Yaşamın Kadim Üçgeni: Orman-Su-Toprak'ın Önemi Anlatıldı", Icerik = "Biyoçeşitlilik günü etkinlikleri kapsamında düzenlenen konferansta ekolojik dengenin korunması ve orman-su-toprak ilişkisi ele alındı.", Kategori = "Akademik" },
                new News { Tarih = new DateTime(2026, 5, 7, 16, 11, 0), Baslik = "Gençlik ve Spor Bakan Yardımcısı Dr. Enes Eminoğlu, ISUBÜ Öğrencileriyle Buluştu", Icerik = "Bakan Yardımcısı Dr. Enes Eminoğlu üniversitemizi ziyaret ederek kariyer planlaması ve gençlik projeleri hakkında öğrencilerimizle söyleşi gerçekleştirdi.", Kategori = "Etkinlik" },
                new News { Tarih = new DateTime(2026, 5, 6, 17, 11, 0), Baslik = "5. Balık Ekmek Şenliği Coşkuyla Gerçekleşti", Icerik = "Eğirdir Su Ürünleri Fakültesi tarafından düzenlenen geleneksel 5. Balık Ekmek Şenliği, yoğun katılım ve şenlik havasında tamamlandı.", Kategori = "Etkinlik" },
                new News { Tarih = new DateTime(2026, 4, 30, 19, 47, 0), Baslik = "ISUBÜ Öğrencileri Mavi Mirasa Sahip Çıkıyor: Eğirdir Gölü Hayalet Ağlardan Temizlendi", Icerik = "Sualtı topluluğu öğrencilerimiz Eğirdir Gölü'nde yürüttükleri temizlik çalışmasında ekolojik hayata zarar veren tonlarca hayalet ağı çıkardı.", Kategori = "Çevre" },
                new News { Tarih = new DateTime(2026, 4, 28, 10, 50, 0), Baslik = "Isparta'da Bilişim Eğitimine Güçlü Adım: Yeni Programlar Açıldı", Icerik = "Teknolojik gelişmelere ayak uydurmak amacıyla bilgisayar bilimleri ve yapay zeka alanında yeni sertifika programları duyuruldu.", Kategori = "Akademik" },
                new News { Tarih = new DateTime(2026, 4, 22, 17, 59, 0), Baslik = "Rektör Prof. Dr. Yılmaz ÇATAL'ın \"23 Nisan Ulusal Egemenlik ve Çocuk Bayramı\" Mesajı", Icerik = "Rektörümüz 23 Nisan mesajında geleceğimizin teminatı olan çocuklarımızın ve tüm milletimizin milli egemenlik bayramını kutladı.", Kategori = "Rektörlük" },
                new News { Tarih = new DateTime(2026, 4, 16, 11, 52, 0), Baslik = "Öğretim Üyemizin TAGEM AR-GE Proje Başarısı", Icerik = "Ziraat Fakültesi öğretim üyemizin hazırladığı tarımsal Ar-Ge projesi TAGEM tarafından desteklenmeye hak kazandı.", Kategori = "Başarı" },
                new News { Tarih = new DateTime(2026, 4, 13, 14, 44, 0), Baslik = "Isparta'da \"Köklerden Göklere Milli Teknoloji Eğitimi Projesi\"nin Sergisi Açıldı", Icerik = "Genç beyinlerin teknoloji projelerini sergilediği Milli Teknoloji Eğitimi Sergisi protokolün katılımıyla açıldı.", Kategori = "Sergi" },
                new News { Tarih = new DateTime(2026, 4, 7, 14, 2, 0), Baslik = "Isparta'da SİBERVATAN Eğitimleri Başladı", Icerik = "Kalkınma Ajansı iş birliğiyle gençlerin siber güvenlik alanında uzmanlaşmasını sağlayacak Siber Vatan eğitimleri başladı.", Kategori = "Eğitim" }
            };

            context.News.AddRange(newsList);
            context.SaveChanges();
        }

        private static void SeedEvents(ApplicationDbContext context)
        {
            if (context.Events.Any())
            {
                context.Events.RemoveRange(context.Events);
                context.SaveChanges();
            }

            var eventsList = new[]
            {
                new Event { Tarih = new DateTime(2026, 6, 12, 10, 0, 0), Baslik = "2025-2026 Mezuniyet Töreni 12 Haziran 2026 Cuma Günü Gerçekleşecektir", Icerik = "Mezuniyet töreni detayları, kep fırlatma saati ve mezuniyet alanına dair bilgilendirmeler.", Kategori = "Tören" },
                new Event { Tarih = new DateTime(2026, 5, 21, 14, 0, 0), Baslik = "Üniversitemizin 8. Kuruluş Yılı Etkinlikleri Akademik Personel Ödül ve Biniş Giyme Töreni - İdari Personel Ödül Töreni", Icerik = "8. kuruluş yıldönümü kapsamında akademik ve idari personellerimizin ödüllendirilmesi töreni düzenlenecektir.", Kategori = "Etkinlik" },
                new Event { Tarih = new DateTime(2026, 5, 14, 10, 0, 0), Baslik = "Orman Oyunları Olimpiyatı 2026", Icerik = "Orman Fakültemiz tarafından her yıl geleneksel olarak düzenlenen olimpiyat etkinlikleri bu yıl da coşkuyla gerçekleştirilecektir.", Kategori = "Spor" },
                new Event { Tarih = new DateTime(2026, 5, 13, 14, 0, 0), Baslik = "Dünya Biyoçeşitlilik Günü Konferansı Orman-Su-Toprak", Icerik = "Ekolojik sistemlerin korunması ve biyolojik çeşitliliğe dair farkındalık konferansı gerçekleştirilecektir.", Kategori = "Akademik" },
                new Event { Tarih = new DateTime(2026, 5, 6, 12, 0, 0), Baslik = "Balık Ekmek Şenliği", Icerik = "Eğirdir Su Ürünleri Fakültesi tarafından her yıl geleneksel olarak düzenlenen balık ekmek şenliğine tüm öğrencilerimiz davetlidir.", Kategori = "Şenlik" },
                new Event { Tarih = new DateTime(2026, 5, 4, 14, 0, 0), Baslik = "Mesleğin Hafızası ve Geleceği- Söyleşi", Icerik = "Kariyer planlaması ve mesleki gelişim odaklı alanında uzman konuklarla söyleşi programı.", Kategori = "Söyleşi" },
                new Event { Tarih = new DateTime(2026, 5, 2, 20, 0, 0), Baslik = "Online Etkinlik: Sosyolog Dr. Onur UZER ile \"Dikkatimizden Kaçan Hayat\"", Icerik = "Sosyolojik perspektiften gündelik yaşama bakış konulu online konferans yayınlanacaktır.", Kategori = "Online" },
                new Event { Tarih = new DateTime(2026, 4, 28, 14, 0, 0), Baslik = "Anadolu Parsı Araştırmaları ve Farkındalığı (Söyleşi)", Icerik = "Yaban hayatı koruma ve Anadolu Parsı üzerine yapılan akademik çalışmaların aktarılacağı söyleşi.", Kategori = "Söyleşi" },
                new Event { Tarih = new DateTime(2026, 4, 15, 9, 0, 0), Baslik = "ICMHI 2026 Konferansı 15-17 Mayıs 2026 / Japonya", Icerik = "Uluslararası sağlık bilişimi konferansı katılım ve sunum programı.", Kategori = "Akademik" }
            };

            context.Events.AddRange(eventsList);
            context.SaveChanges();
        }
    }
}
