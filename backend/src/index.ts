import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import { sendNotification } from './services/fcmService';
import path from 'path';

const app = express();
const prisma = new PrismaClient();

// Middlewares
app.use(cors());
app.use(express.json());

// Admin paneli public klasöründen sunmak
app.use(express.static(path.join(__dirname, '../public')));

// --- ANNOUNCEMENTS ENDPOINTS ---
app.get('/api/announcements', async (req: Request, res: Response) => {
  try {
    const announcements = await prisma.announcement.findMany({ orderBy: { date: 'desc' } });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: "Duyurular getirilemedi" });
  }
});

app.post('/api/announcements', async (req: Request, res: Response) => {
  try {
    const { title, content, category } = req.body;
    const newAnnouncement = await prisma.announcement.create({
      data: { title, content, category }
    });
    
    // Bildirim gönder
    await sendNotification("Yeni Duyuru: " + title, content.substring(0, 50) + "...");
    res.status(201).json(newAnnouncement);
  } catch (error) {
    res.status(500).json({ error: "Duyuru eklenemedi" });
  }
});

// --- MENUS ENDPOINTS ---
app.get('/api/menus', async (req: Request, res: Response) => {
  try {
    const menus = await prisma.menu.findMany({ orderBy: { date: 'desc' } });
    res.json(menus);
  } catch (error) {
    res.status(500).json({ error: "Menüler getirilemedi" });
  }
});

app.post('/api/menus', async (req: Request, res: Response) => {
  try {
    const { date, meal1, meal2, meal3, calories } = req.body;
    const newMenu = await prisma.menu.create({
      data: { date: new Date(date), meal1, meal2, meal3, calories }
    });
    res.status(201).json(newMenu);
  } catch (error) {
    res.status(500).json({ error: "Menü eklenemedi" });
  }
});

// --- LOCATIONS ENDPOINTS ---
app.get('/api/locations', async (req: Request, res: Response) => {
  try {
    const locations = await prisma.location.findMany();
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: "Konumlar getirilemedi" });
  }
});

app.post('/api/locations', async (req: Request, res: Response) => {
  try {
    const { buildingName, latitude, longitude, description } = req.body;
    const newLocation = await prisma.location.create({
      data: { buildingName, latitude, longitude, description }
    });
    res.status(201).json(newLocation);
  } catch (error) {
    res.status(500).json({ error: "Konum eklenemedi" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});
