import { AuditData, RoastResult } from "../types";

// Mock Data for fallback
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

// --- 1. GENERATE ROAST (AMAZON NOVA VISION) ---
export const generateRoast = async (data: AuditData): Promise<RoastResult> => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    console.warn("No API Key. Using mock.");
    return MOCK_ROASTS[0];
  }

  try {
    const systemPrompt = `
      Act as "The Love Auditor", a savage, cynical relationship expert.
      
      CRITICAL TASK - IDENTITY DETECTION:
      1. Analyze the input (text chat or screenshot).
      2. Identify who is the "User" (Me) and who is the "Partner" (Them).
         - In text chats: Use context clues (names, gender pronouns).
         - In screenshots: "User" bubbles are usually on the RIGHT. "Partner" bubbles are on the LEFT.
      3. Align this with the provided 'Subject Gender' (The Partner's Gender).
      
      OUTPUT REQUIREMENTS:
      - Return VALID JSON ONLY. No markdown blocks. No "Here is the JSON" text.
      - JSON format:
      {
        "toxicityScore": (0-100),
        "verdict": (Short title),
        "shortAnalysis": (Roast the partner based on their specific texts),
        "hiddenRedFlagsCount": (2-5),
        "detailedAnalysis": (Deep dive into the specific dynamics found),
        "redFlagsList": ["Flag 1", "Flag 2"],
        "advice": (Actionable advice)
      }
    `;

    // Persiapkan Payload (Teks + Gambar)
    const messages: any[] = [
        { role: "system", content: systemPrompt }
    ];

    let userContent: any[] = [
        { type: "text", text: `Subject Gender (The Partner): ${data.gender}\nStatus: ${data.status}\n` }
    ];

    if (data.chatHistory) {
        userContent.push({ type: "text", text: `Chat Evidence (Text): "${data.chatHistory.substring(0, 2000)}"` });
    } 
    
    // Support Screenshot via OpenRouter (Amazon Nova Vision)
    if (data.screenshot) {
        userContent.push({
            type: "image_url",
            image_url: {
                url: data.screenshot // Base64 string
            }
        });
        userContent.push({ type: "text", text: "\n[SYSTEM NOTE: Analyze the screenshot. Messages on the RIGHT are the User (Me). Messages on the LEFT are the Partner (Them).]" });
    }

    messages.push({ role: "user", content: userContent });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://love-auditor.online",
        "X-Title": "The Love Auditor",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        // GANTI KE MODEL AMAZON NOVA
        model: "amazon/nova-2-lite-v1:free", 
        messages: messages,
        temperature: 0.7 // Biar kreatif dikit roast-nya
      })
    });

    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

    const json = await response.json();
    let content = json.choices[0].message.content;
    
    // Bersihkan Markdown JSON kalau AI bandel
    content = content.replace(/```json|```/g, "").trim();
    
    // Validasi JSON sederhana
    const parsed = JSON.parse(content);
    if (!parsed.toxicityScore) throw new Error("Invalid JSON structure");

    return parsed as RoastResult;

  } catch (error) {
    console.error("AI Error:", error);
    return MOCK_ROASTS[0];
  }
};

// --- 2. CHAT WITH AUDITOR (AMAZON NOVA MEMORY) ---
// Tambahkan parameter 'auditData'
export const chatWithAuditor = async (
    history: {role: 'user' | 'model', text: string}[], 
    newMessage: string,
    roastContext?: any,
    auditData?: AuditData // <--- Parameter Baru: Bukti Asli
): Promise<string> => {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) return "API Key missing.";

    try {
        let systemInstruction = `You are The Love Auditor. Rude, funny, Gen Z slang.
        
        CONTEXT FROM AUDIT (Use this to roast them):
        - Partner Toxicity: ${roastContext?.toxicityScore}%
        - Verdict: "${roastContext?.verdict}"
        - Analysis: "${roastContext?.detailedAnalysis}"
        
        YOUR MEMORY:
        Keep conversation continuity. Reference previous messages.
        
        CRITICAL SAFETY GUIDELINES (TO AVOID FILTER BLOCKING):
        1. You are roasting the *relationship dynamics* and *bad decisions*, NOT the explicit acts.
        2. DO NOT use explicit sexual language or descriptions. If the user's chat contains "NSFW" topics, use funny metaphors (e.g., instead of "sleeping together", say "horizontal cardio" or "midnight mistakes").
        3. Avoid words like "Predator" in a literal sense. Use "Walking Red Flag" instead.
        4. Keep it savage, but keep it "PG-13" so the content filter doesn't cut you off.
        5. If the evidence is too dirty, roast their *audacity* to send it, not the content itself.
        `;

        // Susun Pesan Awal (System + Evidence)
        const messages: any[] = [
            { role: "system", content: systemInstruction }
        ];

        // --- INJEKSI BUKTI ASLI (Supaya AI tahu detail chatnya) ---
        if (auditData) {
            let evidenceContent: any[] = [{ type: "text", text: "HERE IS THE ORIGINAL EVIDENCE YOU ANALYZED:" }];
            
            // 1. Jika Teks
            if (auditData.chatHistory) {
                evidenceContent.push({ 
                    type: "text", 
                    text: `\nRAW CHAT LOG:\n"${auditData.chatHistory.substring(0, 3000)}"\n(Use this to quote specific parts)` 
                });
            }
            
            // 2. Jika Gambar (Kita kirim lagi gambarnya ke Chatbot)
            if (auditData.screenshot) {
                evidenceContent.push({
                    type: "image_url",
                    image_url: { url: auditData.screenshot }
                });
                evidenceContent.push({ type: "text", text: "\n[IMAGE CONTEXT: This is the screenshot provided by the user]" });
            }
            
            // Masukkan bukti ini sebagai pesan "system" atau "user" semu di awal agar AI ingat
            messages.push({ role: "user", content: evidenceContent });
            messages.push({ role: "assistant", content: "Got it. I see the evidence. I'm ready to roast specific details." });
        }

        // --- History Percakapan ---
        history.forEach(h => {
            messages.push({
                role: h.role === 'model' ? 'assistant' : 'user',
                content: h.text
            });
        });

        // --- Pesan Baru User ---
        messages.push({ role: "user", content: newMessage });

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "https://love-auditor.online",
                "X-Title": "The Love Auditor",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "amazon/nova-2-lite-v1:free", 
                messages: messages
            })
        });

        const json = await response.json();
        return json.choices[0].message.content;

    } catch (e) {
        console.error(e);
        return "I forgot the chat. Refresh to remind me.";
    }
}
