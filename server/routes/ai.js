const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");

function clean(value, fallback = "") {
  return String(value ?? fallback).trim().slice(0, 500);
}

function buildPrompt(input) {
  const destination = clean(input.destination);
  const days = Math.min(Math.max(Number(input.days) || 3, 1), 14);
  const travelers = Math.min(Math.max(Number(input.travelers) || 1, 1), 20);
  const budget = clean(input.budget, "Not specified");
  const interests = Array.isArray(input.interests)
    ? input.interests.map(x => clean(x)).filter(Boolean).slice(0, 8).join(", ")
    : clean(input.interests, "Sightseeing, food, local experiences");
  const style = clean(input.style, "Balanced");
  const pace = clean(input.pace, "Comfortable");
  const transport = clean(input.transport, "Public transport / cabs");

  return `You are NestVoyage AI, a practical travel itinerary planner.
Create a ${days}-day itinerary for ${destination} for ${travelers} traveler(s).
Budget: ${budget}.
Interests: ${interests}.
Travel style: ${style}.
Pace: ${pace}.
Preferred transport: ${transport}.

Return ONLY valid JSON with this exact shape:
{
  "title": "string",
  "summary": "string",
  "budgetNote": "string",
  "days": [
    {
      "day": 1,
      "title": "string",
      "morning": ["string"],
      "afternoon": ["string"],
      "evening": ["string"],
      "food": ["string"],
      "transport": "string",
      "tips": ["string"]
    }
  ],
  "packing": ["string"],
  "generalTips": ["string"]
}

Keep recommendations realistic and concise. Do not invent bookings, exact live prices, guaranteed opening hours, or availability. When cost information is uncertain, describe it as an estimate and tell the user to verify current prices locally. The JSON must contain exactly ${days} day objects.`;
}

function parseModelJson(text) {
  const cleaned = String(text || "")
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (_) {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end <= start) {
      throw new Error("AI returned an invalid itinerary format.");
    }
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

async function generateGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.45,
        maxOutputTokens: 4500
      }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `Gemini request failed (${response.status}).`);
  }

  const text = data?.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("") || "";
  if (!text) throw new Error("Gemini returned no itinerary content.");
  return parseModelJson(text);
}

async function generateOllama(prompt) {
  const baseUrl = (process.env.OLLAMA_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
  const model = process.env.OLLAMA_MODEL || "gemma3:4b";

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      format: "json",
      options: { temperature: 0.45 }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || `Ollama request failed (${response.status}).`);
  }

  if (!data?.response) throw new Error("Ollama returned no itinerary content.");
  return parseModelJson(data.response);
}

function normalizeItinerary(itinerary, days) {
  const safeDays = Array.isArray(itinerary?.days) ? itinerary.days : [];
  return {
    title: clean(itinerary?.title, "Your NestVoyage trip plan"),
    summary: clean(itinerary?.summary, "A personalized itinerary for your trip."),
    budgetNote: clean(itinerary?.budgetNote, "Verify current local prices before booking."),
    days: safeDays.slice(0, days).map((item, index) => ({
      day: index + 1,
      title: clean(item?.title, `Day ${index + 1}`),
      morning: Array.isArray(item?.morning) ? item.morning.map(x => clean(x)).filter(Boolean).slice(0, 5) : [],
      afternoon: Array.isArray(item?.afternoon) ? item.afternoon.map(x => clean(x)).filter(Boolean).slice(0, 5) : [],
      evening: Array.isArray(item?.evening) ? item.evening.map(x => clean(x)).filter(Boolean).slice(0, 5) : [],
      food: Array.isArray(item?.food) ? item.food.map(x => clean(x)).filter(Boolean).slice(0, 5) : [],
      transport: clean(item?.transport, "Plan local transport based on the day's route."),
      tips: Array.isArray(item?.tips) ? item.tips.map(x => clean(x)).filter(Boolean).slice(0, 5) : []
    })),
    packing: Array.isArray(itinerary?.packing) ? itinerary.packing.map(x => clean(x)).filter(Boolean).slice(0, 10) : [],
    generalTips: Array.isArray(itinerary?.generalTips) ? itinerary.generalTips.map(x => clean(x)).filter(Boolean).slice(0, 10) : []
  };
}

router.post("/trip-planner", requireAuth, async (req, res, next) => {
  try {
    const destination = clean(req.body.destination);
    if (!destination) return res.status(400).json({ message: "Destination is required." });

    const days = Math.min(Math.max(Number(req.body.days) || 3, 1), 14);
    const provider =
      process.env.NODE_ENV === "production"
        ? "gemini"
        : req.body.provider === "ollama"
          ? "ollama"
          : "gemini";
    const prompt = buildPrompt(req.body);

    let itinerary;
    if (provider === "ollama") {
      itinerary = await generateOllama(prompt);
    } else {
      itinerary = await generateGemini(prompt);
    }

    res.json({
      provider,
      itinerary: normalizeItinerary(itinerary, days)
    });
  } catch (err) {
    const message = err.message || "Unable to generate your trip plan.";
    console.error("AI trip planner error:", err);
    return res.status(503).json({
      message,
      hint:
        req.body?.provider === "ollama"
          ? "Make sure Ollama is running and the selected model is installed."
          : "Make sure GEMINI_API_KEY and GEMINI_MODEL are configured on the server."
    });
  }
});

module.exports = router;
