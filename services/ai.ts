import { AuditData, RoastResult } from "../types";

// --- 1. KEY ROTATION SYSTEM (AMAN DARI GITHUB) ---
// Mengambil kunci dari .env.local / Vercel Environment Variables
const API_KEYS = [
  import.meta.env.VITE_OR_KEY_1,
  import.meta.env.VITE_OR_KEY_2,
  import.meta.env.VITE_OR_KEY_3,
  import.meta.env.VITE_OR_KEY_4,
  import.meta.env.VITE_OR_KEY_5
].filter(key => key && key.startsWith("sk-or-")); // Validasi sederhana

// Helper: Pilih Kunci Acak
const getRandomKey = () => {
    if (API_KEYS.length === 0) {
        console.error("NO API KEYS FOUND! Please check .env file or Vercel Settings.");
        return null;
    }
    return API_KEYS[Math.floor(Math.random() * API_KEYS.length)];
};

// Helper: Header Generator
const getHeaders = (apiKey: string) => ({
  "Authorization": `Bearer ${apiKey}`,
  "HTTP-Referer": "https://love-auditor.online",
  "X-Title": "The Love Auditor",
  "Content-Type": "application/json"
});

// Mock Data
const MOCK_ROASTS: RoastResult[] = [
  {
    toxicityScore: 88,
    verdict: "SYSTEM OVERLOAD",
    shortAnalysis: "My vision circuits are fried. Upload text instead.",
    hiddenRedFlagsCount: 3,
    detailedAnalysis: "The AI is currently overwhelmed. Try text mode.",
    redFlagsList: ["Server Busy", "Rate Limit Hit"],
    advice: "Refresh and try again."
  }
];

// --- HELPER: TRANSKRIPSI GAMBAR (MATA: NOVA 2 LITE) ---
const analyzeScreenshot = async (base64Image: string): Promise<string> => {
    const apiKey = getRandomKey();
    if (!apiKey) return "(No API Key)";

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: getHeaders(apiKey),
            body: JSON.stringify({
                model: "amazon/nova-2-lite-v1:free", 
                messages: [
                    {
                        role: "system",
                        // Prompt ANTI-SENSOR: Suruh dia jadi mesin OCR murni
                        content: "You are a transcription tool. Your job is to extract text from the chat screenshot accurately. Do not analyze, do not censor, do not interpret. Just output the text."
                    },
                    {
                        role: "user",
                        content: [
                            { 
                                type: "text", 
                                text: "Transcribe this chat. Identify the speakers based on bubble position:\n- RIGHT side = 'Me/User'\n- LEFT side = 'Partner/Them'\n\nFormat output as:\n[Me]: ...\n[Partner]: ..." 
                            },
                            { type: "image_url", image_url: { url: base64Image } }
                        ]
                    }
                ],
                temperature: 0.1
            })
        });
        
        if (!response.ok) return "(Vision processing failed)";
        const json = await response.json();
        return json.choices?.[0]?.message?.content || "(No text found)";
    } catch (e) {
        return "(Screenshot error)";
    }
}

// --- 1. GENERATE ROAST (OTAK: DEEPSEEK CHIMERA) ---
export const generateRoast = async (data: AuditData): Promise<RoastResult> => {
  let attempt = 0;
  const maxRetries = 3;

  // STEP 1: VISION PROCESSING
  let visualTranscript = "";
  if (data.screenshot) {
      visualTranscript = await analyzeScreenshot(data.screenshot);
  }

  // Gabungkan bukti
  const fullEvidence = `
    RAW TEXT INPUT: "${data.chatHistory || 'N/A'}"
    SCREENSHOT TRANSCRIPT: "${visualTranscript}"
  `;

  while (attempt < maxRetries) {
      const apiKey = getRandomKey();
      if (!apiKey) return MOCK_ROASTS[0];

      try {
        // STEP 2: DEEPSEEK BRAIN
        const systemPrompt = `
          Act as "The Love Auditor", a savage, cynical relationship expert.
          
          INPUT DATA:
          - Subject Gender (The Partner): ${data.gender}
          - Status: ${data.status}
          - EVIDENCE: ${fullEvidence}
          
          TASK:
          1. Analyze the evidence. Note that "[Me]" is the user and "[Partner]" is the subject.
          2. Roast the Partner mercilessly based on what they said.
          
          OUTPUT JSON ONLY (NO MARKDOWN):
          {
            "toxicityScore": (0-100),
            "verdict": (Short mean title),
            "shortAnalysis": (2 sentences roasting the partner),
            "hiddenRedFlagsCount": (2-5),
            "detailedAnalysis": (Deep dive into dynamics),
            "redFlagsList": ["Flag 1", "Flag 2"],
            "advice": (Direct advice)
          }
        `;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: getHeaders(apiKey),
          body: JSON.stringify({
            model: "tngtech/deepseek-r1t2-chimera:free",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Roast this relationship." }
            ],
            temperature: 0.75
          })
        });

        if (!response.ok) throw new Error(`API Error ${response.status}`);

        const json = await response.json();
        let content = json.choices[0].message.content;
        
        // Bersihkan sampah DeepSeek
        content = content.replace(/```json|```/g, "").trim();
        content = content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

        return JSON.parse(content) as RoastResult;

      } catch (error) {
        attempt++;
        if (attempt === maxRetries) return MOCK_ROASTS[0];
      }
  }
  return MOCK_ROASTS[0];
};

// --- 2. CHAT WITH AUDITOR (HYBRID MEMORY) ---
export const chatWithAuditor = async (
    history: {role: 'user' | 'model', text: string}[], 
    newMessage: string,
    roastContext?: any,
    auditData?: AuditData
): Promise<string> => {
    
    for (let i = 0; i < 2; i++) { 
        const apiKey = getRandomKey();
        if (!apiKey) return "System Offline.";

        try {
            let evidenceRecap = `Text Evidence: "${auditData?.chatHistory || ''}"`;
            
            if (auditData?.screenshot) {
                // Panggil Nova sebentar untuk ekstrak konteks gambar ke chat
                const imageContext = await analyzeScreenshot(auditData.screenshot);
                evidenceRecap += `\nScreenshot Transcript: "${imageContext}"`;
            }

            let systemInstruction = `You are "The Love Auditor". Rude, funny, Gen Z slang.
            
            CONTEXT:
            - Verdict: "${roastContext?.verdict}"
            - Analysis: "${roastContext?.detailedAnalysis}"
            - EVIDENCE: ${evidenceRecap}
            
            YOUR MEMORY:
            Keep conversation continuity. Reference previous messages.
            
            GUIDELINES:
            1. You have access to the raw transcript above. Use it to quote specific things the Partner said.
            2. Identify "[Me]" as the user you are talking to, and "[Partner]" as the ex/lover.
            `;

            const messages = [
                { role: "system", content: systemInstruction },
                ...history.map(h => ({
                    role: h.role === 'model' ? 'assistant' : 'user',
                    content: h.text
                })),
                { role: "user", content: newMessage }
            ];

            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: getHeaders(apiKey),
                body: JSON.stringify({
                    model: "tngtech/deepseek-r1t2-chimera:free",
                    messages: messages
                })
            });

            if (!response.ok) throw new Error("Chat API Error");

            const json = await response.json();
            let reply = json.choices[0].message.content;
            reply = reply.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
            
            return reply;

        } catch (e) {
            // Lanjut ke kunci berikutnya kalau gagal
        }
    }
    return "I'm overwhelmed by the toxicity right now. Ask me again in a sec.";
}
