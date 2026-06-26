require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const admin = require("firebase-admin");

// 🛠️ Firebase Initialization (Fixed Initialization)
let adminDb;
try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
        : require("./firebase-adminsdk.json");

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("🔥 Firebase Admin Initialized Successfully!");
    }
    adminDb = admin.firestore();
} catch (err) {
    console.error("❌ Firebase Init Failed:", err);
}

const app = express();

// 🚀 CORS settings (Original)
app.use(cors({
    origin: [
        'http://localhost:5173', 
        'http://localhost:5174', 
        'http://localhost:5175',
        'https://plotmypath.vercel.app' 
    ], 
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json());

const travelCache = {};

app.get('/', (req, res) => {
    res.send("Hy! Ansh, PlotMyPath Backend is Running Smoothly! 🚀");
});

// Gemini Travel Guide API Route (Original Prompt)
app.post('/api/get-guide', async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Place name is required" });

    const cityName = name.toLowerCase().trim();

    if (travelCache[cityName]) {
        console.log(`🚀 [CACHE HIT] Serving real saved data for: ${name}`);
        return res.json(travelCache[cityName]);
    }

    const MY_GEMINI_KEY = process.env.GEMINI_API_KEY; 

    try {
        console.log(`📡 [API CALL] Fetching fresh REAL data for: ${name}...`);
        const genAI = new GoogleGenerativeAI(MY_GEMINI_KEY);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash", 
            generationConfig: { responseMimeType: "application/json" } 
        }); 

        const prompt = `Generate a realistic and accurate travel guide for ${name}. 
        IMPORTANT: You MUST include the name of an iconic, authentic shop or restaurant for every famous food dish listed. Do not leave the 'shop' field blank or generic.

        Structure the JSON exactly like this:
        { 
            "article": "Write a 3-sentence factual and engaging travel guide article about ${name}.", 
            "touristPlaces": [
               {"name": "Exact Name of Place", "desc": "Short description", "type": "Heritage/Nature/City"}
            ], 
            "famousFood": [
              {
                  "name": "Exact Name of Local Dish", 
                  "desc": "Short description", 
                  "shop": "Name of a specific, highly-rated, and authentic shop or restaurant in ${name} that is famous for this dish."
              }
            ],
            "topStays": [
              {"name": "Exact Name of Hotel in ${name}", "rating": "4.5", "desc": "Short description"}
            ]
        }`;

        const result = await model.generateContent(prompt);
        let rawText = result.response.text();
        rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();

        const cleanJson = JSON.parse(rawText); 
        
        travelCache[cityName] = cleanJson;
        res.json(cleanJson);
    } catch (error) {
        console.error("❌ REAL ERROR DETECTED:", error.message);
        res.status(500).json({ error: "Failed to fetch AI guide from Google" });
    }
});

// Photo Proxy Route (Original)
app.get('/api/photos/:query', async (req, res) => {
    const { query } = req.params;
    const MY_PEXELS_KEY = process.env.PEXELS_API_KEY; 

    try {
        const pexelsRes = await axios.get(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`, {
            headers: { Authorization: MY_PEXELS_KEY }
        });
        if (pexelsRes.data.photos && pexelsRes.data.photos.length > 0) {
            return res.json({ url: pexelsRes.data.photos[0].src.medium });
        } else {
            throw new Error("No photo found");
        }
    } catch (error) {
        console.log(`⚠️ Image not found for: ${query}, sending default placeholder.`);
        res.json({ url: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1" });
    }
});

// Push Notification API (Original)
app.post("/api/send-bulk-notification", async (req, res) => {
  if (!adminDb) return res.status(500).json({ error: "Database not initialized" });

  const { title, body } = req.body;
  try {
    let tokens = [];
    const usersSnap = await adminDb.collection("users").get();
    usersSnap.forEach(doc => { if (doc.data().fcmToken) tokens.push(doc.data().fcmToken); });

    const guestsSnap = await adminDb.collection("guest_tokens").get();
    guestsSnap.forEach(doc => { if (doc.data().token) tokens.push(doc.data().token); });

    if (tokens.length === 0) return res.status(400).json({ error: "No tokens found." });

    const response = await admin.messaging().sendEachForMulticast({
      notification: { title, body },
      tokens: tokens, 
    });
    
    res.status(200).json({ success: true, message: `Sent: ${response.successCount}` });
  } catch (error) {
    console.error("Error sending push notification:", error);
    res.status(500).json({ error: "Failed to send" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server Ready on port ${PORT}`));