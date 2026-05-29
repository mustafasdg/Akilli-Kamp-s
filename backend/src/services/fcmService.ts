import * as admin from 'firebase-admin';

// Normalde burada Firebase serviceAccount bilgilerini eklersiniz.
// Örnek: admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

/**
 * Yeni bir duyuru eklendiğinde bildirim gönderir.
 */
export const sendNotification = async (title: string, body: string) => {
  try {
    const message = {
      notification: { title, body },
      topic: 'all_users'
    };
    
    // Yorum satırı kaldırıldığında gerçek gönderim yapar.
    // await admin.messaging().send(message);
    console.log(`[FCM - BİLDİRİM SİMÜLASYONU] Gönderilen: ${title} - ${body}`);
  } catch (error) {
    console.error('FCM Bildirim Hatası:', error);
  }
};
