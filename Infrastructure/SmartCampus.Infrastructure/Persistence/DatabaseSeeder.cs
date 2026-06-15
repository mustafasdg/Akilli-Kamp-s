using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SmartCampus.Domain.Entities;
using SmartCampus.Infrastructure.Context;

namespace SmartCampus.Infrastructure.Persistence
{
    /// <summary>
    /// Veritabanı boşken otomatik test verisi yükleyen tohumlama (seeding) mekanizması.
    /// </summary>
    public static class DatabaseSeeder
    {
        /// <summary>
        /// Roster dışındaki test/sahte akademisyenleri (ve bağlı kayıtlarını) temizler;
        /// gerçek ISUBÜ Bilgisayar Mühendisliği kadrosunu ekler veya günceller (upsert).
        /// E-posta eşleşen mevcut kayıtlar güncellenir (fotoğraf dahil) — DB sıfırlamaya gerek yoktur.
        /// Not: Ders programı tohumlaması bu hocalara dayandığı için DbInitializer'dan ÖNCE çağrılmalıdır.
        /// </summary>
        public static async Task SeedTeachersAsync(ApplicationDbContext context, IPasswordHasher<User> passwordHasher)
        {
            // Gerçek kadro — resmi profil fotoğrafı URL'leri dahil.
            // Eşleme: Title → Ad içinde · Department → ResearchAreas · Expertise → Specialty
            //         Biography → Bio (birebir) · Phone → OfficeLocation · ImageUrl → ProfileImageUrl
            var roster = new[]
            {
                new { FullName = "Prof. Dr. Tuncay AYDOĞAN",        Department = "Bilgisayar Mühendisliği / Bilgisayar Bilimleri", Expertise = "Bilgisayar Bilimleri",                Biography = "Bilgisayar Bilimleri alanında uzmanlaşmış kıdemli akademisyen ve Bilgisayar Mühendisliği Bölüm Başkanıdır.", RoomNumber = "401", Email = "tuncayaydogan@gmail.com", Phone = "0246 214 6790", ImageUrl = "https://isparta.edu.tr/foto.aspx?sicil_no=01088" },
                new { FullName = "Doç. Dr. Ahmet Ali SÜZEN",        Department = "Bilgisayar Mühendisliği / Bilgisayar Donanımı",  Expertise = "Siber Güvenlik ve Bilgisayar Ağları", Biography = "Siber güvenlik ve bilgisayar ağları konularında derin uzmanlığa sahiptir. Ağ altyapıları ve siber savunma sistemleri üzerine akademik çalışmalar ve projeler yürütmektedir. (Kişisel Web: [www.ahmetalisuzen.com](https://www.ahmetalisuzen.com))", RoomNumber = "405", Email = "ahmetsuzen@gmail.com", Phone = "0246 214 6773", ImageUrl = "https://isparta.edu.tr/foto.aspx?sicil_no=01667" },
                new { FullName = "Doç. Dr. Sinan UĞUZ",             Department = "Bilgisayar Mühendisliği / Yapay Zeka",          Expertise = "Yapay Zeka ve Makine Öğrenmesi",      Biography = "Yapay Zeka Anabilim Dalı Başkanıdır. Yapay zeka, makine öğrenmesi ve derin öğrenme algoritmaları üzerine odaklanan AILab yöneticisidir. (Kişisel Web: ailab.isparta.edu.tr)", RoomNumber = "410", Email = "sinanuguz@gmail.com", Phone = "0246 214 6774", ImageUrl = "https://isparta.edu.tr/foto.aspx?sicil_no=01685" },
                new { FullName = "Doç. Dr. Serap ERGÜN",            Department = "Bilgisayar Mühendisliği / Bilgisayar Bilimleri", Expertise = "Bilgisayar Bilimleri",                Biography = "Bilgisayar bilimleri temel teorileri, algoritmalar ve veri yapıları üzerine akademik araştırmalar yürüten uzman akademisyendir.", RoomNumber = "412", Email = "serapbakioglu@gmail.com", Phone = "0246 214 6778", ImageUrl = "https://isparta.edu.tr/foto.aspx?sicil_no=01486" },
                new { FullName = "Doç. Dr. Kıyas KAYAALP",          Department = "Bilgisayar Mühendisliği / Bilgisayar Donanımı",  Expertise = "Donanım ve Sayısal Sistem Tasarımı",  Biography = "Bilgisayar donanımı, gömülü sistemler, mikrodenetleyiciler ve sayısal sistem tasarımı konularında ileri düzey akademik ve pratik bilgiye sahip öğretim üyesidir.", RoomNumber = "415", Email = "kiyaskayaalp@gmail.com", Phone = "0246 214 6776", ImageUrl = "https://isparta.edu.tr/foto.aspx?sicil_no=01270" },
                new { FullName = "Dr. Öğr. Üyesi Burhan DUMAN",     Department = "Bilgisayar Mühendisliği / Bilgisayar Donanımı",  Expertise = "Bilgisayar Donanımı Mimarisi",        Biography = "Bilgisayar donanımı mimarileri, mantık devreleri ve mikroişlemci sistemleri üzerine detaylı araştırmalar ve projeler geliştiren akademisyendir.", RoomNumber = "420", Email = "burhanduman@gmail.com", Phone = "0246 214 6792", ImageUrl = "https://isparta.edu.tr/foto.aspx?sicil_no=01215" },
                new { FullName = "Dr. Öğr. Üyesi Cevriye ALTINTAŞ", Department = "Bilgisayar Mühendisliği / Bilgisayar Yazılımı",  Expertise = "Frontend Mimarisi ve UI/UX",          Biography = "Modern web teknolojileri, kullanıcı deneyimi (UX/UI) tasarımları ve Frontend (Önyüz) mimarileri konusunda uzmanlaşmış, yenilikçi arayüz projeleri yürüten öğretim üyesidir.", RoomNumber = "422", Email = "cevriyealtintas@gmail.com", Phone = "0246 214 6175", ImageUrl = "https://isparta.edu.tr/foto.aspx?sicil_no=01461" },
                new { FullName = "Dr. Öğr. Üyesi Serdar PAÇACI",    Department = "Bilgisayar Mühendisliği / Bilgisayar Yazılımı",  Expertise = "Backend Mimarisi ve Sistem Tasarımı", Biography = "Yazılım mimarileri, Backend (Arkayüz) geliştirme, dağıtık sistemler, .NET teknolojileri ve sağlam API tasarımları üzerine ileri düzey uzmanlığa sahip öğretim üyesidir.", RoomNumber = "425", Email = "serdarpacaci@gmail.com", Phone = "", ImageUrl = "https://isparta.edu.tr/foto.aspx?sicil_no=01965" },
                new { FullName = "Arş. Gör. Rafet GÖZBAŞI",         Department = "Bilgisayar Mühendisliği / Bilgisayar Yazılımı",  Expertise = "Bilgisayar Yazılımı",                 Biography = "Bilgisayar yazılımı alanında akademik araştırmalar yürüten, laboratuvar uygulamalarında ve yazılım geliştirme süreçlerinde öğrencilere rehberlik eden araştırmacıdır.", RoomNumber = "430", Email = "rafetgozbasi@gmail.com", Phone = "0246 214 6782", ImageUrl = "https://isparta.edu.tr/foto.aspx?sicil_no=02695" },
                new { FullName = "Arş. Gör. Hüseyin Furkan ZENGİN", Department = "Bilgisayar Mühendisliği / Bilgisayar Donanımı",  Expertise = "Bilgisayar Donanımı",                 Biography = "Donanım mimarileri ve sayısal sistemler üzerine akademik çalışmalar yapan, donanım laboratuvarlarının yürütülmesinde aktif rol alan araştırmacıdır.", RoomNumber = "431", Email = "huseyinzengin@gmail.com", Phone = "0246 214 6783", ImageUrl = "https://isparta.edu.tr/foto.aspx?sicil_no=02757" },
            };

            var rosterEmails = roster.Select(t => t.Email).ToArray();

            // 1) Roster DIŞINDAKİ eski/sahte öğretmenleri ve bağlı kayıtlarını temizle.
            //    User'a Restrict FK ile bağlı tablolar önce silinmeli; TeacherSchedule ve
            //    UserCommunity ise Cascade olduğundan öğretmen silinince otomatik gider.
            var staleIds = await context.Users
                .Where(u => u.Role == "teacher" && !rosterEmails.Contains(u.Email))
                .Select(u => u.ID)
                .ToListAsync();

            if (staleIds.Count > 0)
            {
                await context.Appointments
                    .Where(a => staleIds.Contains(a.TeacherId) || staleIds.Contains(a.StudentId))
                    .ExecuteDeleteAsync();
                await context.Messages
                    .Where(m => staleIds.Contains(m.SenderId) || staleIds.Contains(m.ReceiverId))
                    .ExecuteDeleteAsync();
                await context.Notifications
                    .Where(n => staleIds.Contains(n.UserId))
                    .ExecuteDeleteAsync();
                await context.CommunityMessages
                    .Where(cm => staleIds.Contains(cm.UserId))
                    .ExecuteDeleteAsync();
                await context.Users
                    .Where(u => u.Role == "teacher" && !rosterEmails.Contains(u.Email))
                    .ExecuteDeleteAsync();
            }

            // 2) Upsert: e-posta eşleşirse mevcut kaydı güncelle (fotoğraf dahil), yoksa ekle.
            foreach (var t in roster)
            {
                var office = string.IsNullOrWhiteSpace(t.Phone)
                    ? $"Oda {t.RoomNumber}"
                    : $"Oda {t.RoomNumber} · Tel: {t.Phone}";

                var existing = await context.Users.FirstOrDefaultAsync(u => u.Email == t.Email);
                if (existing is null)
                {
                    var user = new User
                    {
                        Name            = t.FullName,
                        Email           = t.Email,
                        Role            = "teacher",
                        Bio             = t.Biography,
                        Specialty       = t.Expertise,
                        ResearchAreas   = t.Department,
                        RoomNumber      = t.RoomNumber,
                        OfficeLocation  = office,
                        ProfileImageUrl = t.ImageUrl,
                        CreatedAt       = DateTime.UtcNow,
                    };
                    user.PasswordHash = passwordHasher.HashPassword(user, "123456");
                    context.Users.Add(user);
                }
                else
                {
                    // Mevcut kaydı tazele — özellikle profil fotoğrafını güncelle (DB sıfırlamadan)
                    existing.Name            = t.FullName;
                    existing.Bio             = t.Biography;
                    existing.Specialty       = t.Expertise;
                    existing.ResearchAreas   = t.Department;
                    existing.RoomNumber      = t.RoomNumber;
                    existing.OfficeLocation  = office;
                    existing.ProfileImageUrl = t.ImageUrl;
                    // Şifreyi her tohumlamada "123456" olarak sıfırla — giriş testleri kesintisiz olsun.
                    existing.PasswordHash    = passwordHasher.HashPassword(existing, "123456");
                }
            }

            await context.SaveChangesAsync();
        }

        /// <summary>
        /// Topluluk kataloğunu veritabanı ile karşılaştırır ve yalnızca ADI henüz bulunmayan
        /// toplulukları ekler (isim bazlı idempotent). Bu sayede mevcut topluluklar korunurken
        /// kataloğa eklenen yeni topluluklar bir sonraki açılışta otomatik tohumlanır.
        /// Yeni topluluk eklemek için yalnızca aşağıdaki katalog dizisine yeni kayıt eklemen yeterli.
        /// </summary>
        public static async Task SeedCommunitiesAsync(ApplicationDbContext context)
        {
            var catalog = new[]
            {
                // ── İlk demo topluluklar ──────────────────────────────────────────────
                new Community
                {
                    Name        = "ISUBÜ Yazılım ve Yapay Zeka Topluluğu",
                    Description = "Kampüsteki yazılımcıların buluşma noktası. .NET mimarileri, LangChain projeleri ve hackathon duyuruları bu grupta!",
                    ImageUrl    = "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop",
                    CreatedAt   = DateTime.UtcNow,
                },
                new Community
                {
                    Name        = "Sualtı Dalış Kulübü",
                    Description = "Mavilikleri keşfetmek isteyenler buraya! Eğitim duyuruları, dalış turları ve ekipman paylaşımları.",
                    ImageUrl    = "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1000&auto=format&fit=crop",
                    CreatedAt   = DateTime.UtcNow,
                },
                new Community
                {
                    Name        = "Dağ Bisikleti ve Doğa Sporları",
                    Description = "Hafta sonu rotaları, orman kampları ve dağ bisikleti turları için bir araya geliyoruz. Kaskını al ve katıl!",
                    ImageUrl    = "https://images.unsplash.com/photo-1544191696-102db5ee2e33?q=80&w=1000&auto=format&fit=crop",
                    CreatedAt   = DateTime.UtcNow,
                },
                new Community
                {
                    Name        = "Kariyer ve Staj Ağı",
                    Description = "Teknoloji devlerinde staj fırsatları, mülakat teknikleri ve uzun dönem staj programları hakkında deneyim paylaşımı.",
                    ImageUrl    = "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1000&auto=format&fit=crop",
                    CreatedAt   = DateTime.UtcNow,
                },
                new Community
                {
                    Name        = "Kampüs Müzik ve Sanat Topluluğu",
                    Description = "Resim sergileri, atölye çalışmaları, kampüs konserleri ve sanatsal etkinliklerin ana merkezi.",
                    ImageUrl    = "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=1000&auto=format&fit=crop",
                    CreatedAt   = DateTime.UtcNow,
                },

                // ── Ek topluluklar (çeşitlilik için: teknik · sosyal · spor/zihin) ─────
                new Community
                {
                    Name        = "Robotik ve Otomasyon Topluluğu",
                    Description = "Arduino'dan ROS'a, çizgi izleyen robotlardan otonom sistemlere; tasarla, lehimle, kodla. TEKNOFEST ve robot yarışmalarına birlikte hazırlanıyoruz!",
                    ImageUrl    = "https://images.unsplash.com/photo-1535378917042-10a22c95931a?q=80&w=1000&auto=format&fit=crop",
                    CreatedAt   = DateTime.UtcNow,
                },
                new Community
                {
                    Name        = "Siber Güvenlik ve Etik Hacker Kulübü",
                    Description = "CTF yarışmaları, sızma testi atölyeleri ve güvenlik açığı analizleri. Beyaz şapkalı olmak isteyenlerin kalesi.",
                    ImageUrl    = "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1000&auto=format&fit=crop",
                    CreatedAt   = DateTime.UtcNow,
                },
                new Community
                {
                    Name        = "Girişimcilik ve İnovasyon Kulübü",
                    Description = "Fikrini ürüne dönüştür! İş modeli kanvası, yatırımcı sunumları ve startup mentorluğu ile girişim yolculuğu burada başlıyor.",
                    ImageUrl    = "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1000&auto=format&fit=crop",
                    CreatedAt   = DateTime.UtcNow,
                },
                new Community
                {
                    Name        = "Fotoğrafçılık Kulübü",
                    Description = "Kampüsün ve şehrin en güzel karelerini birlikte yakalıyoruz. Foto gezileri, kompozisyon atölyeleri ve sergiler.",
                    ImageUrl    = "https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?q=80&w=1000&auto=format&fit=crop",
                    CreatedAt   = DateTime.UtcNow,
                },
                new Community
                {
                    Name        = "Münazara ve Diksiyon Kulübü",
                    Description = "Etkili konuşma, doğru nefes ve ikna sanatı. Münazara turnuvaları ve hitabet çalışmalarıyla sahneye çık.",
                    ImageUrl    = "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=1000&auto=format&fit=crop",
                    CreatedAt   = DateTime.UtcNow,
                },
                new Community
                {
                    Name        = "Kitap ve Edebiyat Kulübü",
                    Description = "Ayın kitabını seçiyor, yazar söyleşileri düzenliyor ve okuma keyfini paylaşıyoruz. Sayfalar arasında buluşalım.",
                    ImageUrl    = "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=1000&auto=format&fit=crop",
                    CreatedAt   = DateTime.UtcNow,
                },
                new Community
                {
                    Name        = "E-Spor ve Oyun Topluluğu",
                    Description = "Valorant, LoL ve FIFA turnuvaları, oyun geliştirme sohbetleri ve LAN partileri. Rekabet ve eğlence bir arada!",
                    ImageUrl    = "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000&auto=format&fit=crop",
                    CreatedAt   = DateTime.UtcNow,
                },
                new Community
                {
                    Name        = "Satranç Kulübü",
                    Description = "Başlangıçtan ileri seviyeye satranç dersleri, haftalık turnuvalar ve hamle analizleri. Şah mat demeye hazır mısın?",
                    ImageUrl    = "https://images.unsplash.com/photo-1528819622765-d6bcf132f793?q=80&w=1000&auto=format&fit=crop",
                    CreatedAt   = DateTime.UtcNow,
                },
                new Community
                {
                    Name        = "Gönüllülük ve Sosyal Sorumluluk Topluluğu",
                    Description = "Bağış kampanyaları, çevre temizliği ve sosyal yardım projeleri. İyilik için bir araya gelen gönüllülerin adresi.",
                    ImageUrl    = "https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=1000&auto=format&fit=crop",
                    CreatedAt   = DateTime.UtcNow,
                },
            };

            // Yalnızca DB'de adı bulunmayan toplulukları ekle (idempotent "üzerine ekle").
            var existingNames = await context.Communities
                .Select(cmty => cmty.Name)
                .ToListAsync();

            var toAdd = catalog
                .Where(cmty => !existingNames.Contains(cmty.Name))
                .ToList();

            if (toAdd.Count == 0)
                return;

            await context.Communities.AddRangeAsync(toAdd);
            await context.SaveChangesAsync();
        }
    }
}
