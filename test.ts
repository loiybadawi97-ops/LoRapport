import { GoogleGenAI } from "@google/genai";
console.log("Starting test");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: "Hello",
      config: { systemInstruction: "Be brief", temperature: 0.7 }
    });
    console.log("Success:", response.text);
  } catch (e) {
    console.error("Gemini Error:", e);
  }
}
run();
