import axios from "axios";

// ⚠️ Yahan apni OpenRouter Free API Key daalna. 
// Go to openrouter.ai -> Keys -> Create Free Key
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

export const generateTripPlan = async (destination, daysCount = 3) => {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        // 2026 Ka Latest Best Free Fast Model
        model: "meta-llama/llama-3.3-70b-instruct:free", 
        messages: [
          {
            role: "user",
            content: `You are an expert travel planner. Create a strict ${daysCount}-day travel itinerary for ${destination}. 
            You MUST respond ONLY with a raw JSON object matching this exact structure. Do not include any markdown formatting or text outside the JSON.

            {
              "destination": "${destination}",
              "estimatedBudget": "₹15,000 - ₹20,000",
              "itinerary": [
                {
                  "day": 1,
                  "theme": "Exploring the Roots",
                  "activities": [
                    {"time": "09:00 AM", "title": "Morning Breakfast & Arrival", "details": "Check-in at hotel and have local traditional breakfast."},
                    {"time": "02:00 PM", "title": "Major Attraction Visit", "details": "Visit the most famous landmark nearby."},
                    {"time": "07:00 PM", "title": "Evening Leisure", "details": "Stroll around local markets and try street food."}
                  ]
                }
              ],
              "essentialTips": [
                "Carry cash as local vendors don't always accept digital payments.",
                "Best time to explore outdoor locations is early morning."
              ]
            }`
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    let rawText = response.data.choices[0].message.content;
    
    // SAFE PARSING WRAPPER: Vite-friendly extraction without breaking code compilation
    if (rawText.includes("```json")) {
      rawText = rawText.split("```json")[1].split("```")[0].trim();
    } else if (rawText.includes("```")) {
      rawText = rawText.split("```")[1].split("```")[0].trim();
    } else {
      rawText = rawText.trim();
    }
    
    const parsedData = JSON.parse(rawText);
    return parsedData;

  } catch (error) {
    console.error("AI Generation Error:", error);
    return null;
  }
};