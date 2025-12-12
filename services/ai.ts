import { AuditData, RoastResult } from "../types";

// --- 1. KEY ROTATION SYSTEM (5 AKUN) ---
// Kita hardcode key di sini sesuai request Anda agar tidak perlu ribet set .env satu-satu lagi
const API_KEYS = [
  "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",
  "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",
  "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",
  "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",
  "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"
];

// Helper: Pilih Kunci Acak
const getRandomKey = () => API_KEYS[Math.floor(Math.random() * API_KEYS.length)];

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

// --- HELPER: TRANSKRIPSI GAMBAR (AMAZON NOVA 2 LITE) ---
// Tugas: Mengubah Screenshot -> Teks Dialog (Aku vs Dia)
// Kita buat prompt-nya "Robotik" agar Nova tidak baper/sensor konten chatnya.
const analyzeScreenshot = async (base64Image: string): Promise<string> => {
    const apiKey = getRandomKey();
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
                temperature: 0.1 // Rendah biar akurat baca teks
            })
        });
        
        if (!response.ok) return "(Vision processing failed)";
        const json = await response.json();
        return json.choices?.[0]?.message?.content || "(No text found)";
    } catch (e) {
        return "(Screenshot error)";
    }
}

// --- 1. GENERATE ROAST (HYBRID ENGINE) ---
export const generateRoast = async (data: AuditData): Promise<RoastResult> => {
  let attempt = 0;
  const maxRetries = 3;

  // STEP 1: VISION PROCESSING (Mata Nova)
  // Kita lakukan ini di luar loop retry agar tidak membuang waktu scan gambar berkali-kali
  let visualTranscript = "";
  if (data.screenshot) {
      visualTranscript = await analyzeScreenshot(data.screenshot);
  }

  // Gabungkan bukti (Chat Manual + Hasil Scan Gambar)
  const fullEvidence = `
    RAW TEXT INPUT: "${data.chatHistory || 'N/A'}"
    SCREENSHOT TRANSCRIPT: "${visualTranscript}"
  `;

  while (attempt < maxRetries) {
      const apiKey = getRandomKey();
      try {
        // STEP 2: DEEPSEEK BRAIN (Otak Gacor)
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
            temperature: 0.7
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
    
    // Coba 2x ganti kunci kalau gagal
    for (let i = 0; i < 2; i++) { 
        const apiKey = getRandomKey();
        try {
            // Kita coba ambil transkrip lagi kalau ada screenshot (biar chatnya nyambung)
            // Note: Idealnya transkrip disimpan di state App.tsx biar gak boros, tapi ini cara paling aman tanpa ubah UI banyak
            let evidenceRecap = `Text Evidence: "${auditData?.chatHistory || ''}"`;
            
            if (auditData?.screenshot) {
                // Kita panggil Nova lagi sebentar untuk ekstrak konteks kalau user nanya detail gambar
                // Supaya cepat, kita beri instruksi singkat
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
                    model: "tngtech/deepseek-r1t2-chimera:free", // Otak DeepSeek
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
