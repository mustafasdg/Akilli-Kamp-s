// Admin JS API çağrıları
const API_URL = 'http://localhost:5206/api';

// Duyuru Ekleme Formu
document.getElementById('announcementForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const baslik = document.getElementById('title').value;
  const kategori = document.getElementById('category').value;
  const icerik = document.getElementById('content').value;

  try {
    const res = await fetch(`${API_URL}/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baslik, kategori, icerik })
    });
    
    if(res.ok) {
      alert('Duyuru başarıyla eklendi ve bildirim gönderildi!');
      e.target.reset();
    } else {
      alert('Duyuru eklenirken hata oluştu.');
    }
  } catch (error) {
    alert('Sunucuya bağlanılamadı!');
  }
});

// Menü Ekleme Formu
document.getElementById('menuForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const tarih = document.getElementById('menuDate').value;
  const yemek_1 = document.getElementById('meal1').value;
  const yemek_2 = document.getElementById('meal2').value;
  const yemek_3 = document.getElementById('meal3').value;
  const kalori = parseInt(document.getElementById('calories').value);

  try {
    const res = await fetch(`${API_URL}/menus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tarih, yemek_1, yemek_2, yemek_3, kalori })
    });
    
    if(res.ok) {
      alert('Yemek menüsü başarıyla eklendi!');
      e.target.reset();
    } else {
      alert('Menü eklenirken hata oluştu.');
    }
  } catch (error) {
    alert('Sunucuya bağlanılamadı!');
  }
});

// Konum Ekleme Formu
document.getElementById('locationForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const bina_Adi = document.getElementById('buildingName').value;
  const enlem = parseFloat(document.getElementById('latitude').value);
  const boylam = parseFloat(document.getElementById('longitude').value);
  const aciklama = document.getElementById('description').value;

  try {
    const res = await fetch(`${API_URL}/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bina_Adi, enlem, boylam, aciklama })
    });
    
    if(res.ok) {
      alert('Konum başarıyla eklendi!');
      e.target.reset();
    } else {
      alert('Konum eklenirken hata oluştu.');
    }
  } catch (error) {
    alert('Sunucuya bağlanılamadı!');
  }
});
