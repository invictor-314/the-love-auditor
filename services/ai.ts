import { AuditData, RoastResult } from "../types";

// Mock Data for fallback (Jaga-jaga kalau server error)
const MOCK_ROASTS: RoastResult[] = [
  {
    toxicityScore: 87,
    verdict: "TOXIC WASTE DUMP",
    shortAnalysis: "Bro really thought 'wyd' was a personality trait. This conversation has less substance than a diet soda.",
    hiddenRedFlagsCount: 3,
    detailedAnalysis: "The communication pattern suggests a severe case of emotional unavailability paired with narcissistic tendencies. The use of one-word answers indicates a lack of investment, while the random ghosting periods suggest they are keeping their options open.",
    redFlagsList: ["Gaslighting 101", "Breadcrumbing detected", "Zero emotional reciprocity"],
    advice: "Block them immediately. Do not pass Go. Do not collect $200. Run."
  }
];

// --- 1. FUNGSI UTAMA: GENERATE ROAST ---
export const generateRoast = async (data: AuditData): Promise<RoastResult> => {
  // Ambil Key dari Env Vite
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    console.warn("No API_KEY found. Using mock data.");
    await new Promise(resolve => setTimeout(resolve, 2000));
    return MOCK_ROASTS[0];
  }

  try {
    // Susun Prompt Sistem
    const systemPrompt = `
      Act as "The Love Auditor", a savage, cynical, and funny relationship expert for Gen Z.
      
      Your Task: Analyze the relationship data provided by the user.
      
      Output Requirement:
      You MUST return a VALID JSON object ONLY. Do not write any text before or after the JSON.
      
      JSON Structure:
      {
        "toxicityScore": (number 0-100),
        "verdict": (string, short punchy title like "BORING AS HELL" or "TOXICITY OVERLOAD"),
        "shortAnalysis": (string, 2 sentences, ruthless roast),
        "hiddenRedFlagsCount": (number between 2 and 5),
        "detailedAnalysis": (string, long paragraph explaining why it sucks),
        "redFlagsList": (array of strings, specific flags found),
        "advice": (string, blunt advice)
      }
    `;

    // Susun Prompt User
    let userContent = `Subject Gender: ${data.gender}\nStatus: ${data.status}\n`;
    
    if (data.chatHistory) {
        userContent += `Chat Evidence: "${data.chatHistory.substring(0, 1500)}"`;
    } else {
        userContent += "Evidence provided: Screenshot (Text analysis only for this free model).";
    }

    // Panggil OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://love-auditor.online",
        "X-Title": "The Love Auditor",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "tngtech/deepseek-r1t2-chimera:free", // Model Gratis Pilihan Anda
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent }
        ]
      })
    });

    if (!response.ok) {
        throw new Error(`OpenRouter API Error: ${response.statusText}`);
    }

    const json = await response.json();
    let content = json.choices[0].message.content;

    // Bersihkan Markdown kalau AI bandel ngasih ```json ... ```
    content = content.replace(/```json|```/g, "").trim();

    return JSON.parse(content) as RoastResult;

  } catch (error) {
    console.error("AI Error:", error);
    return MOCK_ROASTS[0]; // Fallback ke mock data kalau error
  }
};

// --- 2. FUNGSI CHATBOT: CHAT WITH AUDITOR ---
export const chatWithAuditor = async (
    history: {role: 'user' | 'model', text: string}[], 
    newMessage: string,
    roastContext?: any
): Promise<string> => {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    
    if (!apiKey) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return "I need an API Key to roast you properly.";
    }

    try {
        // Susun System Prompt dengan Konteks
        let systemInstruction = "You are The Love Auditor. You are rude, funny, cynical, and give tough love relationship advice. Keep answers short, punchy, and use Gen Z slang.";
        
        if (roastContext) {
            systemInstruction += `\n\nCONTEXT ABOUT THE USER:
            - Their Toxicity Score: ${roastContext.toxicityScore}%
            - Relationship Verdict: "${roastContext.verdict}"
            - Known Red Flags: ${roastContext.redFlagsList?.join(', ')}
            - Your Analysis: "${roastContext.detailedAnalysis}"
            
            USE THIS INFO TO ROAST THEM.`;
        }

        // Konversi format history kita ke format OpenRouter
        const messages = [
            { role: "system", content: systemInstruction },
            ...history.map(h => ({
                role: h.role === 'model' ? 'assistant' : 'user', // OpenRouter pakai 'assistant', bukan 'model'
                content: h.text
            })),
            { role: "user", content: newMessage }
        ];

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "https://love-auditor.online",
                "X-Title": "The Love Auditor",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "tngtech/deepseek-r1t2-chimera:free",
                messages: messages
            })
        });

        const json = await response.json();
        return json.choices[0].message.content || "I'm speechless.";

    } catch (e) {
        console.error(e);
        return "Server overload. Too many toxic relationships to process. Try again.";
    }
}