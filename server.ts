import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize GoogleGenAI server-side client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper to verify if real Gemini API key is present
const hasValidKey = Boolean(
  process.env.GEMINI_API_KEY &&
  process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
  process.env.GEMINI_API_KEY.trim().length > 10
);

// AI Endpoint 1: Trip Copilot Advisory
app.post('/api/ai/trip-copilot', async (req: Request, res: Response) => {
  try {
    const { busName, busType, progress, currentSpeed, nextStop, delayMin } = req.body;

    if (!hasValidKey) {
      // Instant intelligent fallback when key is placeholder or unset
      return res.json({
        advisory: `Currently cruising at ${currentSpeed} km/h towards ${nextStop}. NH 48 corridor conditions are clear. Enjoy your ride on ${busName}!`,
        foodTip: "Highway Food Mall offers fresh South Indian snacks and hygienic restrooms.",
        trafficOutlook: delayMin > 0 ? `Minor delay of ~${delayMin} min expected due to regional toll traffic.` : "On schedule with smooth flow across state borders."
      });
    }

    const prompt = `You are SmartRoute AI Trip Copilot for the Delhi-Jaipur highway (NH 48).
Current bus: ${busName} (${busType}).
Journey progress: ${(progress * 100).toFixed(0)}%.
Speed: ${currentSpeed} km/h.
Next stop: ${nextStop}.
Current delay: ${delayMin} minutes.
Provide a concise, helpful 2-sentence travel advisory and a 1-sentence rest stop or navigation tip. Respond in plain JSON with keys "advisory", "foodTip", "trafficOutlook".`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating AI trip copilot:', error?.message);
    return res.json({
      advisory: "Cruising smoothly along NH 48. Estimated arrival time remains on schedule.",
      foodTip: "Highway Food Mall at milestone km 120 features clean facilities and refreshments.",
      trafficOutlook: "Normal transit conditions reported between Shahjahanpur and Kotputli tolls."
    });
  }
});

// AI Endpoint 2: Smart Natural Language Bus Search
app.post('/api/ai/smart-search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (!hasValidKey) {
      return res.json({
        recommendation: "Orbit Travels (Volvo AC Seater) and Rajputana Premium (AC Sleeper) are top-rated for Delhi-Jaipur.",
        matchedBusIds: [101, 106]
      });
    }

    const busesData = `
Available buses (Delhi to Jaipur):
101: Orbit Travels (Volvo Multi-Axle AC Seater 2+2, Dep 06:00, Fare ₹899, Rating 4.6, Wi-Fi, Water, Live tracking)
102: Sunrise Express (AC Sleeper 2+1, Dep 07:30, Fare ₹749, Rating 4.4, Blanket, Water, Live tracking)
103: Pink City Lines (Non-AC Seater 2+2, Dep 05:15, Fare ₹399, Rating 3.8, Budget, Live tracking)
104: Marwar Voyager (AC Seater 2+2, Dep 13:00, Fare ₹599, Rating 4.2, Wi-Fi, Water, Live tracking)
105: Night Owl Coaches (Non-AC Sleeper 2+1, Dep 19:30, Fare ₹549, Rating 3.9, Budget sleeper, No tracking)
106: Rajputana Premium (AC Sleeper 2+1, Dep 21:00, Fare ₹999, Rating 4.7, Luxury sleeper, Wi-Fi, Live tracking)
`;

    const prompt = `User search request: "${query}".
${busesData}
Analyze the passenger's needs (e.g. night travel, luxury sleeper, budget, early morning, Wi-Fi).
Return a JSON object with:
"matchedBusIds": [array of numbers of matching bus IDs, max 3],
"recommendation": "Short 2-sentence rationale recommending the best pick."`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating AI smart search:', error?.message);
    return res.json({
      recommendation: "Showing our most popular express buses with live GPS tracking.",
      matchedBusIds: [101, 102, 106]
    });
  }
});

// AI Endpoint 3: Itinerary Analysis & AI Trip Assistant
app.post('/api/ai/trip-assistant', async (req: Request, res: Response) => {
  try {
    const {
      bookingReference,
      journeyDate,
      destinationCity = "Jaipur",
      departureTime,
      busName,
      busType,
      boardingStop,
      droppingStop,
      passengersCount = 1
    } = req.body;

    if (!hasValidKey) {
      // Deterministic realistic fallback for offline/development mode
      return res.json({
        weatherForecast: {
          tempRange: "22°C - 33°C",
          conditions: "Pleasant & Sunny",
          summary: `Warm days and comfortable evenings expected in ${destinationCity} around ${journeyDate}. Clear skies ideal for city sightseeing.`
        },
        packingSuggestions: [
          "Light jacket or shawl (AC bus interior can get cool during highway cruising)",
          "Comfortable walking shoes for exploring historical forts and palaces",
          "Sunscreen, UV sunglasses and wide-brim hat for daytime excursions",
          "Portable power bank and USB-A/C charging cable (charging points onboard)",
          "Small water bottle and travel-sized hand sanitizer"
        ],
        personalizedTravelTips: [
          `Arrive at ${boardingStop || 'Kashmere Gate ISBT'} at least 20 minutes prior to ${departureTime || 'departure'}.`,
          `At ${droppingStop || 'Sindhi Camp'}, pre-paid auto booths and Jaipur Metro (Chandpole/Sindhi Camp stations) provide convenient onward connectivity.`,
          "Must-try local delicacies near the bus stand: Rawat Mishthan Bhandar for authentic Pyaaz Kachori.",
          "Keep digital government ID handy along with your SmartRoute e-ticket QR."
        ],
        journeyPrep: [
          "Baggage limit: 15 kg per passenger in dedicated lower luggage bays.",
          "Highway Food Mall scheduled halt at midpoint: 15 minutes for dining and clean washrooms."
        ]
      });
    }

    const prompt = `You are the SmartRoute AI Trip Assistant analyzing a passenger's confirmed bus booking.
Details:
Booking Reference: ${bookingReference || 'SR-DEMO'}
Journey Date: ${journeyDate}
Origin to Destination: Delhi to ${destinationCity}
Bus: ${busName} (${busType})
Departure: ${departureTime}
Boarding: ${boardingStop}
Dropping: ${droppingStop}
Passengers: ${passengersCount}

Provide comprehensive, personalized travel advice tailored to this journey date and destination city (${destinationCity}).
Respond with a JSON object with:
1. "weatherForecast": object with "tempRange" (string, e.g. "20°C - 31°C"), "conditions" (string, e.g. "Sunny / Clear"), "summary" (concise 2-sentence weather outlook for ${destinationCity} for this time of year).
2. "packingSuggestions": array of 4-6 specific items tailored to the bus ride and destination weather.
3. "personalizedTravelTips": array of 4-5 actionable tips (local Jaipur transit from dropping point, food recommendations, sightseeing or cultural tips, arrival buffer).
4. "journeyPrep": array of 2-3 quick preparation reminders for boarding and luggage.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    let rawText = response.text || '{}';
    // Clean potential markdown fences
    if (rawText.includes('```json')) {
      rawText = rawText.split('```json')[1].split('```')[0].trim();
    } else if (rawText.includes('```')) {
      rawText = rawText.split('```')[1].split('```')[0].trim();
    }
    const parsed = JSON.parse(rawText);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating AI trip assistant:', error?.message);
    return res.json({
      weatherForecast: {
        tempRange: "24°C - 34°C",
        conditions: "Clear & Breezy",
        summary: "Warm daytime temperatures with cool, comfortable evenings in Jaipur."
      },
      packingSuggestions: [
        "Light cotton apparel and a light jacket for air-conditioned travel",
        "Comfortable walking footwear for Jaipur monuments",
        "Sunglasses and sun protection lotion",
        "Device charging cable and power bank"
      ],
      personalizedTravelTips: [
        "Sindhi Camp dropping terminal connects directly to the Jaipur Pink Line Metro.",
        "Visit Hawa Mahal and City Palace early in the morning to avoid midday crowds.",
        "Sample famous local lassi at Lassiwala on MI Road, just 1.5 km from the bus stand."
      ],
      journeyPrep: [
        "Reach the boarding terminal 20 minutes before departure.",
        "One carry-on bag and one checked suitcase allowed per traveler."
      ]
    });
  }
});

// AI Endpoint 4: Google Maps Grounded Location Guide
app.post('/api/ai/maps-guide', async (req: Request, res: Response) => {
  try {
    const { destination = "Sindhi Camp Bus Stand, Jaipur" } = req.body;
    if (!hasValidKey) {
      return res.json({
        places: [
          { name: "Jaipur Metro (Sindhi Camp)", category: "Transit Hub", desc: "Located 100m from bus bays. Quick direct line to Railway Station & Chandpole." },
          { name: "Rawat Mishthan Bhandar", category: "Dining", desc: "Station Road (600m). Famous for fresh Pyaaz & Mawa Kachori." },
          { name: "Hawa Mahal & Old City", category: "Sightseeing", desc: "3.5 km away. Accessible via pre-paid auto or e-rickshaw in 15 mins." }
        ]
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Provide 3 verified landmarks, transit stations, or eateries around ${destination} for incoming bus travelers. Format strictly as JSON with key "places" containing array of objects with "name", "category", and "desc".`,
      config: {
        tools: [{ googleMaps: {} }]
      }
    });

    let raw = response.text || '{}';
    if (raw.includes('```json')) raw = raw.split('```json')[1].split('```')[0].trim();
    else if (raw.includes('```')) raw = raw.split('```')[1].split('```')[0].trim();
    const data = JSON.parse(raw);
    return res.json(data);
  } catch (e: any) {
    console.error("Maps grounding error:", e?.message);
    return res.json({
      places: [
        { name: "Jaipur Metro (Sindhi Camp)", category: "Transit Hub", desc: "Adjacent to the bus station for easy intra-city transit." },
        { name: "Rawat Mishthan Bhandar", category: "Dining", desc: "Iconic Rajasthani snack shop located right on Station Road." },
        { name: "MI Road Shopping Corridor", category: "Local Area", desc: "1 km from terminal with shops, ATMs, and handicraft bazaars." }
      ]
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SmartRoute Server running on http://localhost:${PORT}`);
  });
}

startServer();
