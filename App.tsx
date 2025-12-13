import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import Layout from './components/Layout';
import { GlassCard, Button, Input, Select, TextArea, Title, Subtitle } from './components/UI';
import { AppView, AuditData, Gender, RelationshipStatus, RoastResult } from './types';
import { generateRoast, chatWithAuditor } from './services/ai';
// @ts-ignore
import html2canvas from 'html2canvas';
import { 
  HeartCrack, 
  Upload, 
  Zap, 
  Lock, 
  ArrowRight, 
  ArrowLeft,
  AlertTriangle, 
  Download, 
  RefreshCcw, 
  MessageSquare,
  Send,
  User as UserIcon,
  LogOut,
  Settings,
  Crown,
  X,
  Search
} from 'lucide-react';

import { useUser, useClerk, SignIn } from "@clerk/clerk-react";

// Link Checkout Lemon Squeezy Anda
const LEMON_SQUEEZY_CHECKOUT_URL = "https://loveauditor.lemonsqueezy.com/buy/361f97fd-6473-463c-b889-b001ce6e2e2b";

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [auditData, setAuditData] = useState<AuditData>({
    gender: Gender.MALE,
    status: RelationshipStatus.DATING,
    chatHistory: '',
    screenshot: undefined
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RoastResult | null>(null);
  
  // Clerk Hooks
  const { isSignedIn, user, isLoaded } = useUser();
  const { signOut, openSignIn } = useClerk();
  
  const [fileName, setFileName] = useState<string | null>(null);
  
  // Premium Chat State
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Profile Edit State
  const [editUsername, setEditUsername] = useState("");

  // Refs
  const exportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- EFFECT: Load Data from Storage ---
  useEffect(() => {
    const savedResult = localStorage.getItem('audit_result');
    const savedData = localStorage.getItem('audit_input');
    
    if (savedResult) {
        setResult(JSON.parse(savedResult));
    }
    if (savedData) {
        setAuditData(JSON.parse(savedData));
    }
  }, []);

  // --- EFFECT: Save Data to Storage ---
  useEffect(() => {
    if (result) {
        localStorage.setItem('audit_result', JSON.stringify(result));
    }
    if (auditData.chatHistory || auditData.gender) {
        localStorage.setItem('audit_input', JSON.stringify(auditData));
    }
  }, [result, auditData]);
  
  // --- EFFECT: Sync Username ---
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
        setEditUsername(user.username || user.fullName || "LoveVictim");
    }
  }, [isLoaded, isSignedIn, user]);

  // --- EFFECT: Scroll Chat ---
  useEffect(() => {
    if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, view]);

  // --- Tambahkan useEffect ini di bagian atas komponen App ---
  useEffect(() => {
    // 1. Cek apakah ada kode affiliate di URL saat ini
    const urlParams = new URLSearchParams(window.location.search);
    const affFromUrl = urlParams.get('aff');
  
    if (affFromUrl) {
        // 2. Jika ada, SIMPAN ke penyimpanan browser (awet selamanya sampai dihapus)
        localStorage.setItem('referral_code', affFromUrl);
        
        // (Opsional) Bersihkan URL agar terlihat rapi
        // window.history.replaceState({}, document.title, "/"); 
    }
  }, []); // [] artinya hanya jalan sekali saat web pertama dibuka

  // --- Helpers ---

  const getToxicityColor = (score: number) => {
      if (score < 40) return "text-green-500";
      if (score < 75) return "text-yellow-500";
      return "text-blood-500";
  };

  const getToxicityBarColor = (score: number) => {
      if (score < 40) return "bg-green-500";
      if (score < 75) return "bg-yellow-500";
      return "bg-blood-500";
  };

  // Cek premium dari Metadata Clerk (Webhook System)
  const isPremiumUser = user?.publicMetadata?.isPremium === true;

  // --- Handlers ---

  const handleAuditSubmit = async () => {
    if (!auditData.chatHistory.trim() && !auditData.screenshot) {
      alert("Please paste chat history OR upload a screenshot! I can't roast nothing.");
      return;
    }
    setView(AppView.LOADING);
    
    try {
        const data = await generateRoast(auditData);
        setResult(data);
        setView(AppView.RESULT_FREE);
    } catch (e) {
        console.error(e);
        alert("Something went wrong. The toxicity was too high for our servers.");
        setView(AppView.HOME);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          if (file.size > 5 * 1024 * 1024) {
              alert("File too large. Please upload an image under 5MB.");
              return;
          }
          setFileName(file.name);
          const reader = new FileReader();
          reader.onloadend = () => {
              setAuditData(prev => ({ ...prev, screenshot: reader.result as string }));
          };
          reader.readAsDataURL(file);
      }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
      e.stopPropagation();
      setFileName(null);
      setAuditData(prev => ({ ...prev, screenshot: undefined }));
      if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // LOGIKA UNLOCK (Redirect ke Lemon Squeezy)
  const handleUnlock = () => {
    if (isSignedIn && user) {
       if (isPremiumUser) {
          setView(AppView.PREMIUM_DASHBOARD);
       } else {
          let checkoutUrl = `${LEMON_SQUEEZY_CHECKOUT_URL}?checkout[email]=${user.primaryEmailAddress?.emailAddress}`;
  
          // 🔥 LOGIKA BARU: AMBIL DARI BRANKAS (LocalStorage)
          // Kita prioritas ambil dari URL dulu, kalau gak ada baru ambil dari simpanan
          const urlParams = new URLSearchParams(window.location.search);
          const affFromUrl = urlParams.get('aff');
          
          // Ambil dari storage jika di URL kosong (karena habis login)
          const savedAff = localStorage.getItem('referral_code');
          
          const finalPartnerCode = affFromUrl || savedAff;
  
          if (finalPartnerCode) {
              checkoutUrl += `&checkout[custom][Referral_Partner]=${finalPartnerCode}`;
          }
  
          window.location.href = checkoutUrl;
       }
    } else {
       setView(AppView.AUTH);
    }
  };

  const handleLogin = () => {
    openSignIn();
  };

  const handleLogout = () => {
      signOut();
      setView(AppView.HOME);
  };
  
  const handleChatSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!chatInput.trim()) return;
      
      const newHistory = [...chatHistory, {role: 'user' as const, text: chatInput}];
      setChatHistory(newHistory);
      setChatInput("");
      setIsChatting(true);
      
      // KIRIM 'auditData' JUGA (Parameter ke-4)
      const response = await chatWithAuditor(newHistory, chatInput, result, auditData); 
      
      setChatHistory(prev => [...prev, {role: 'model', text: response}]);
      setIsChatting(false);
  }

  const handleUpdateProfile = () => {
      if (user) {
          // Note: Updating Clerk user profile client-side has limitations, 
          // usually requires update() from useUser() or backend. 
          // For now we simulate specific username update if enabled in Clerk settings.
          user.update({ username: editUsername })
            .then(() => alert("Profile updated!"))
            .catch(e => alert("Update failed: " + e.errors[0]?.message));
      }
  };

  const handleDownloadReport = async () => {
    if (!exportRef.current) return;
    
    exportRef.current.style.display = "block";
    
    try {
        const canvas = await html2canvas(exportRef.current, {
            backgroundColor: '#050000',
            scale: 3,
            useCORS: true, 
            logging: false,
            width: 600,
            windowWidth: 600,
            onclone: (clonedDoc: Document) => {
                const el = clonedDoc.getElementById('export-content');
                if (el) el.style.display = 'block';
            }
        });
        
        const image = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.href = image;
        link.download = `LoveAuditor_Verdict_${Date.now()}.png`;
        link.click();
    } catch (err) {
        console.error("Download failed", err);
        alert("Failed to generate report image.");
    } finally {
        exportRef.current.style.display = "none";
    }
  };

  // --- Views ---

  // 1. HOME VIEW
  const renderHome = () => (
    <div className="flex flex-col items-center justify-center min-h-[85vh] gap-6 animate-in fade-in zoom-in duration-500">
      <div className="text-center space-y-2 mb-4">
        <Title>THE LOVE<br />AUDITOR</Title>
        <Subtitle className="text-lg">Love is blind. AI isn't.</Subtitle>
      </div>

      <GlassCard className="w-full relative overflow-hidden border-blood-500/30">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-blood-500 shadow-[0_0_20px_#ff0033]"></div>
        
        <div className="flex items-center justify-center gap-2 mb-6">
          <HeartCrack className="text-blood-500 w-6 h-6" />
          <h2 className="font-display text-2xl tracking-wide uppercase">Start Audit</h2>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Subject Gender" 
              options={[Gender.MALE, Gender.FEMALE, Gender.OTHER]} 
              value={auditData.gender}
              onChange={(e) => setAuditData({...auditData, gender: e.target.value as Gender})}
            />
            <Select 
              label="Status" 
              options={[RelationshipStatus.DATING, RelationshipStatus.TALKING, RelationshipStatus.EX, RelationshipStatus.SITUATIONALSHIP, RelationshipStatus.MARRIED]}
              value={auditData.status}
              onChange={(e) => setAuditData({...auditData, status: e.target.value as RelationshipStatus})}
            />
          </div>

          <div className="relative">
             <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">EVIDENCE (PASTE CHAT)</label>
             <TextArea 
                placeholder="Paste chat history here... Don't be shy."
                value={auditData.chatHistory}
                onChange={(e) => setAuditData({...auditData, chatHistory: e.target.value})}
                className="h-32"
             />
          </div>

          {/* Screenshot Upload */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept="image/*" 
            className="hidden" 
          />
          
          <Button 
            variant="secondary" 
            className={`text-sm py-3 ${fileName ? 'border-blood-500 text-blood-500 bg-blood-500/10' : ''}`}
            onClick={() => fileInputRef.current?.click()}
          >
             {fileName ? (
                 <div className="flex items-center gap-2">
                     <span className="truncate max-w-[200px]">{fileName}</span>
                     <div 
                        onClick={handleRemoveFile}
                        className="p-1 hover:bg-white/20 rounded-full cursor-pointer"
                     >
                        <X className="w-4 h-4" />
                     </div>
                 </div>
             ) : (
                <>
                    <Upload className="w-4 h-4" /> Upload Screenshot
                </>
             )}
          </Button>

          <Button onClick={handleAuditSubmit} className="mt-4 shadow-blood-500/20">
            <Zap className="w-5 h-5 fill-white" /> ROAST MY RELATIONSHIP
          </Button>
        </div>
      </GlassCard>
    </div>
  );

  // 2. LOADING VIEW
  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8 animate-in fade-in duration-700">
      <div className="relative">
        <div className="w-24 h-24 rounded-full border-4 border-white/10 border-t-blood-500 animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <HeartCrack className="w-8 h-8 text-blood-500 animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="font-display text-3xl text-white">ANALYZING TOXICITY...</h2>
        <p className="text-gray-400 animate-pulse">Reading between the lines...</p>
        <p className="text-gray-500 text-sm">Identifying manipulation tactics...</p>
      </div>
    </div>
  );

  // Hidden Export Template for Clean PNG Download
  const renderExportTemplate = () => {
    if (!result) return null;
    const toxicityColorClass = getToxicityColor(result.toxicityScore);
    const toxicityBarClass = getToxicityBarColor(result.toxicityScore);

    return (
        <div 
            id="export-content"
            ref={exportRef} 
            className="fixed left-[-9999px] top-0 w-[600px] bg-[#050000] p-10 text-center font-body"
            style={{ display: 'none' }} 
        >
             <div className="absolute inset-0 z-0">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blood-600/20 rounded-full blur-[80px]"></div>
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blood-900/20 rounded-full blur-[80px]"></div>
             </div>

             <div className="relative z-10 border border-blood-500/50 rounded-3xl p-8 bg-white/5 backdrop-blur-xl shadow-[0_0_50px_rgba(255,0,50,0.1)]">
                 <div className="mb-4 space-y-1">
                    <p className="font-display text-4xl text-white">THE LOVE</p>
                    <p className="font-display text-4xl text-white">AUDITOR</p>
                    <p className="text-xs text-blood-500 font-bold tracking-[0.3em] mt-2 uppercase">Official Audit Report</p>
                 </div>

                 <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-blood-500 to-transparent my-6"></div>

                 <div className="mb-6">
                    <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">Toxicity Level</p>
                    <div className="flex items-center justify-center gap-4 px-8">
                         <div className="flex-1 h-4 bg-gray-900 rounded-full overflow-hidden border border-white/10">
                            <div 
                                className={`h-full ${toxicityBarClass} shadow-[0_0_10px_currentColor]`}
                                style={{ width: `${result.toxicityScore}%` }}
                            ></div>
                         </div>
                         <span 
                             className={`font-display text-3xl w-[80px] text-right leading-none ${toxicityColorClass}`}
                             style={{ transform: 'translateY(-13px)' }}
                         >
                             {result.toxicityScore}%
                         </span>
                    </div>
                 </div>

                 <div className="mb-6">
                    <h1 className="font-display text-4xl md:text-5xl text-white mb-4 uppercase drop-shadow-md leading-tight">
                        {result.verdict}
                    </h1>
                    <p className="text-gray-300 font-medium italic text-lg px-4 leading-relaxed">
                        "{result.shortAnalysis}"
                    </p>
                 </div>
                 
                 <div className="mt-8 pt-6 border-t border-white/10">
                     <p className="text-xs text-gray-500">Generated by AI • TheLoveAuditor</p>
                 </div>
             </div>
        </div>
    );
  };

  // 3. FREE RESULT VIEW
  const renderResultFree = () => {
    if (!result) return null;
    
    const isPremium = user?.publicMetadata?.isPremium === true;
    const buttonText = isPremium ? "DEEP ANALYSIS" : "UNLOCK THE TRUTH ($2.99)";
    const ButtonIcon = isPremium ? Search : Lock;

    const toxicityColorClass = getToxicityColor(result.toxicityScore);
    const toxicityBarClass = getToxicityBarColor(result.toxicityScore);

    return (
      <div className="flex flex-col items-center gap-6 py-4 animate-in slide-in-from-bottom-10 duration-500">
        
        {renderExportTemplate()}

        <GlassCard className="w-full text-center border-blood-500/50 shadow-[0_0_30px_rgba(255,0,50,0.15)]">
           <div className="mb-2 text-gray-400 text-xs font-bold tracking-widest uppercase">The Love Auditor's</div>
           <Title className="text-4xl md:text-5xl text-blood-500 mb-2">FINAL VERDICT</Title>
           <p className="text-xs text-gray-500 mb-6 uppercase tracking-widest">Official Report • No Refunds</p>

           <div className="mb-8">
             <div className="flex justify-between text-xs uppercase font-bold mb-2 px-2">
                <span>Toxicity Level</span>
                <span className={toxicityColorClass}>{result.toxicityScore}%</span>
             </div>
             <div className="h-4 bg-gray-900 rounded-full overflow-hidden border border-white/10">
                <div 
                    className={`h-full ${toxicityBarClass} transition-all duration-1000 ease-out`}
                    style={{ width: `${result.toxicityScore}%` }}
                ></div>
             </div>
           </div>

           <div className="mb-8 p-4 bg-white/5 rounded-xl border border-white/10">
              <h3 className="font-display text-2xl mb-2 text-white">{result.verdict}</h3>
              <div className="w-full h-[1px] bg-white/10 mb-3"></div>
              <p className="text-gray-300 italic font-medium leading-relaxed">
                "{result.shortAnalysis}"
              </p>
           </div>

           {/* PAYWALL SECTION */}
           <div className="relative overflow-hidden rounded-xl border border-blood-500/40 p-1">
             <div className="absolute inset-0 bg-blood-900/20 backdrop-blur-sm z-0"></div>
             
             <div className="relative z-10 bg-black/60 p-5 rounded-lg">
                <h4 className="text-blood-500 font-display text-xl mb-1 flex items-center justify-center gap-2">
                   <AlertTriangle className="w-5 h-5" /> 
                   {result.hiddenRedFlagsCount} HIDDEN RED FLAGS DETECTED
                </h4>
                
                <Button onClick={handleUnlock} className="my-4 animate-pulse-fast bg-blood-600 hover:bg-blood-500 border-none shadow-[0_0_15px_#ff0033]">
                   <ButtonIcon className="w-4 h-4" /> {buttonText}
                </Button>
                
                <p className="text-xs text-gray-400">Don't let them fool you again.</p>
             </div>
           </div>

           <div className="mt-6 flex flex-col gap-3">
             <Button variant="secondary" className="py-3 text-sm" onClick={handleDownloadReport}>
                <Download className="w-4 h-4" /> Download Report
             </Button>
             
             {/* RESET BUTTON FIXED: CLEARS CHAT HISTORY NOW */}
             <Button variant="outline" onClick={() => { 
                 // Reset UI View
                 setView(AppView.HOME); 
                 // Reset Inputs
                 setAuditData({ ...auditData, chatHistory: '', screenshot: undefined }); 
                 setFileName(null); 
                 setResult(null); 
                 
                 // PENTING: Hapus Memori Chatbot
                 setChatHistory([]);
                 setIsChatting(false);

                 // Hapus Cache Storage
                 localStorage.removeItem('audit_result');
                 localStorage.removeItem('audit_input');
             }} className="...">
                 START NEW AUDIT
             </Button>
           </div>
        </GlassCard>
      </div>
    );
  };

  // 4. AUTH VIEW
  const renderAuth = () => (
    <div className="flex flex-col items-center justify-center min-h-[85vh] gap-6 animate-in fade-in duration-500">
       <div className="text-center space-y-2 mb-4">
        <Title>THE LOVE<br />AUDITOR</Title>
        <Subtitle>Love is blind. AI isn't.</Subtitle>
      </div>

      <GlassCard className="w-full max-w-md p-0 overflow-hidden flex justify-center min-h-[400px]">
         <SignIn 
            routing="virtual"
            redirectUrl="/"
            appearance={{
                elements: {
                    rootBox: "w-full",
                    card: "bg-transparent shadow-none w-full p-6",
                    headerTitle: "text-white font-display text-2xl",
                    headerSubtitle: "text-gray-400",
                    socialButtonsBlockButton: "bg-white text-black hover:bg-gray-200",
                    formFieldLabel: "text-gray-300",
                    formFieldInput: "bg-black/40 border-white/20 text-white",
                    footerActionLink: "text-blood-500 hover:text-blood-400",
                    formButtonPrimary: "bg-gradient-to-b from-blood-500 to-blood-700 hover:bg-blood-600 border-none"
                }
            }}
          />
      </GlassCard>
       <p className="text-center text-xs text-gray-500 mt-4 cursor-pointer hover:text-white" onClick={() => setView(AppView.HOME)}>&larr; Back to Home</p>
    </div>
  );

  // 5. PROFILE VIEW
  const renderProfile = () => {
    if (!isSignedIn || !user) return null;

    return (
        <div className="flex flex-col items-center justify-center min-h-[85vh] gap-6 animate-in fade-in duration-500">
             
            <GlassCard className="w-full space-y-6 relative">
                 <button 
                    onClick={() => setView(AppView.HOME)} 
                    className="absolute top-6 left-6 p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-all z-10"
                    title="Back to Home"
                 >
                    <ArrowLeft className="w-5 h-5" />
                 </button>

                 <div className="text-center space-y-2 mb-8 pt-2">
                    <Title className="text-4xl">Your Profile</Title>
                    <Subtitle>Manage your tragic love life settings</Subtitle>
                </div>

                <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                    <div className="w-16 h-16 rounded-full border-2 border-white/20 overflow-hidden">
                        <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h3 className="font-display text-xl text-white tracking-wide">{user.fullName || user.username}</h3>
                        <p className="text-sm text-gray-500">{user.primaryEmailAddress?.emailAddress}</p>
                    </div>
                    <div className="ml-auto">
                        {isPremiumUser ? (
                            <span className="flex items-center gap-1 bg-blood-600/20 text-blood-500 border border-blood-600 px-3 py-1 rounded-full text-xs font-bold uppercase shadow-[0_0_10px_rgba(255,0,50,0.2)]">
                                <Crown className="w-3 h-3" /> Premium
                            </span>
                        ) : (
                            <span className="bg-gray-800 text-gray-400 border border-gray-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                Free Plan
                            </span>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Settings className="w-4 h-4" /> Account Settings
                    </h4>
                    
                    <div className="grid gap-4">
                         <div>
                             <label className="block text-xs text-gray-500 mb-1 ml-1">Username</label>
                             <div className="flex gap-2">
                                <input 
                                    className="flex-1 bg-black/40 border border-white/20 text-white px-4 py-2 rounded-xl focus:outline-none focus:border-blood-500"
                                    value={editUsername}
                                    onChange={(e) => setEditUsername(e.target.value)}
                                />
                                <Button className="w-auto px-6 py-2 text-sm" onClick={handleUpdateProfile}>Save</Button>
                             </div>
                         </div>
                    </div>
                </div>

                {!isPremiumUser && (
                    <div className="bg-gradient-to-r from-blood-900/40 to-black p-4 rounded-xl border border-blood-500/30 flex items-center justify-between">
                        <div>
                            <p className="text-blood-500 font-bold text-sm">UPGRADE TO PREMIUM</p>
                            <p className="text-xs text-gray-400">Unlock detailed analysis & chatbot.</p>
                        </div>
                        <Button className="w-auto py-2 px-4 text-xs" onClick={handleUnlock}>
                            Upgrade ($2.99)
                        </Button>
                    </div>
                )}

                <div className="pt-4 border-t border-white/10">
                    <Button variant="outline" className="w-full border-red-900/50 text-red-500 hover:bg-red-900/20 hover:border-red-500" onClick={handleLogout}>
                        <LogOut className="w-4 h-4" /> LOG OUT
                    </Button>
                </div>

            </GlassCard>
        </div>
    );
  };

  // 6. PREMIUM DASHBOARD
  const renderPremium = () => {
    if (!result) {
         return (
             <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                 <Title>Ready for Pain?</Title>
                 <Button onClick={() => setView(AppView.HOME)}>Start New Audit</Button>
             </div>
         )
    }
    
    const detailed = result.detailedAnalysis || "Analysis pending...";
    const flags = result.redFlagsList || ["Red Flag 1", "Red Flag 2", "Red Flag 3"];
    const advice = result.advice || "Run away.";

    return (
        <div className="flex flex-col gap-6 py-4 animate-in slide-in-from-bottom-5 duration-500 pb-20">
            <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl text-blood-500">PREMIUM REPORT</h2>
                <span className="bg-blood-600 text-white text-xs px-2 py-1 rounded font-bold uppercase">Paid</span>
            </div>

            <GlassCard className="border-blood-500/40">
                <h3 className="font-display text-xl mb-4 flex items-center gap-2 text-white">
                    <AlertTriangle className="text-blood-500" />
                    DETECTED RED FLAGS
                </h3>
                <ul className="space-y-3">
                    {flags.map((flag, idx) => (
                        <li key={idx} className="flex items-start gap-3 bg-black/40 p-3 rounded-lg border-l-2 border-blood-500">
                             <span className="text-blood-500 font-bold">{idx + 1}.</span>
                             <span className="text-gray-200 text-sm font-medium">{flag}</span>
                        </li>
                    ))}
                </ul>
            </GlassCard>

            <GlassCard>
                <h3 className="font-display text-xl mb-4 text-white">DEEP ANALYSIS</h3>
                <div className="text-gray-300 text-sm leading-relaxed space-y-4">
                    <p>{detailed}</p>
                </div>
            </GlassCard>

            <GlassCard className="bg-gradient-to-br from-white/5 to-blood-900/20">
                <h3 className="font-display text-xl mb-2 text-white">REQUIRED ACTION</h3>
                <p className="text-lg font-bold text-blood-500 uppercase tracking-wide mb-2">{result.verdict === "BORING AS HELL" ? "UPGRADE YOUR GAME" : "INITIATE BREAKUP PROTOCOL"}</p>
                <p className="text-sm text-gray-300">{advice}</p>
            </GlassCard>

             <GlassCard className="flex flex-col gap-2">
                 <div className="flex items-center gap-2 mb-2">
                     <MessageSquare className="w-5 h-5 text-blood-500" />
                     <h3 className="font-display text-lg text-white">ASK THE AUDITOR</h3>
                 </div>
                 
                 <div className="bg-black/50 rounded-xl p-4 h-64 overflow-y-auto mb-2 border border-white/10 flex flex-col gap-3">
                     <div className="self-start bg-gray-800 text-gray-200 p-3 rounded-tr-lg rounded-br-lg rounded-bl-lg max-w-[85%] text-sm">
                         I've exposed the truth. What now? Ask me anything.
                     </div>
                     {chatHistory.map((msg, i) => (
                         <div key={i} className={`p-3 rounded-lg max-w-[90%] text-sm ${msg.role === 'user' ? 'self-end bg-blood-700 text-white rounded-tl-lg rounded-bl-lg rounded-br-lg' : 'self-start bg-gray-800 text-gray-200 rounded-tr-lg rounded-br-lg rounded-bl-lg'}`}>
                             {/* Render Markdown agar teksnya rapi (Bold, List, dll) */}
                             <ReactMarkdown
                                 components={{
                                     // Custom Style untuk elemen Markdown biar cocok sama tema Dark
                                     strong: ({node, ...props}) => <span className="font-bold text-white" {...props} />,
                                     ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-1 my-2" {...props} />,
                                     ol: ({node, ...props}) => <ol className="list-decimal pl-4 space-y-1 my-2" {...props} />,
                                     li: ({node, ...props}) => <li className="mb-1" {...props} />,
                                     h1: ({node, ...props}) => <h1 className="text-base font-black uppercase mb-2 text-blood-500 mt-2" {...props} />,
                                     h2: ({node, ...props}) => <h2 className="text-sm font-bold uppercase mb-1 text-white mt-2" {...props} />,
                                     h3: ({node, ...props}) => <h3 className="text-sm font-bold uppercase mb-1 text-white mt-1" {...props} />,
                                     blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-blood-500 pl-3 italic text-gray-400 my-2 bg-black/20 p-1 rounded-r" {...props} />,
                                     p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                                     hr: ({node, ...props}) => <hr className="border-white/10 my-3" {...props} />,
                                 }}
                             >
                                 {msg.text}
                             </ReactMarkdown>
                         </div>
                     ))}
                     {isChatting && <div className="self-start text-gray-500 text-xs animate-pulse">Auditor is typing...</div>}
                     <div ref={chatEndRef}></div>
                 </div>

                 <form onSubmit={handleChatSubmit} className="flex gap-2">
                     <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Should I text him?"
                        className="flex-1 bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:border-blood-500 focus:outline-none"
                     />
                     <button type="submit" disabled={isChatting} className="bg-blood-600 hover:bg-blood-500 text-white p-2 rounded-lg transition-colors disabled:opacity-50">
                         <Send className="w-4 h-4" />
                     </button>
                 </form>
             </GlassCard>

             <Button variant="outline" onClick={() => { 
                 // Reset Total
                 setView(AppView.HOME); 
                 setAuditData({ ...auditData, chatHistory: '', screenshot: undefined }); 
                 setFileName(null); 
                 setResult(null);
                 setChatHistory([]); // PENTING
                 setIsChatting(false); // PENTING
                 localStorage.removeItem('audit_result');
                 localStorage.removeItem('audit_input');
             }} className="mt-8">
                 START NEW AUDIT
             </Button>
        </div>
    );
  };

  // --- Main Render ---

  const renderHeader = () => (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center pointer-events-none">
        <div 
            className={`font-display text-white text-xl pointer-events-auto transition-opacity cursor-pointer ${view === AppView.HOME ? 'opacity-0' : 'opacity-100'}`}
            onClick={() => setView(AppView.HOME)}
        >
            LOVE AUDITOR
        </div>
        
        <div className="pointer-events-auto">
            {isSignedIn && user ? (
                <div onClick={() => setView(AppView.PROFILE)} className="cursor-pointer">
                    <img src={user.imageUrl} className="w-8 h-8 rounded-full border border-white/30 hover:border-blood-500 transition-all" />
                </div>
            ) : (
                view !== AppView.AUTH && (
                    <div className="flex gap-3">
                        <button onClick={() => setView(AppView.AUTH)} className="text-white font-bold text-sm tracking-wide hover:text-blood-500 transition-colors">
                            SIGN IN
                        </button>
                        <button onClick={() => setView(AppView.AUTH)} className="bg-blood-600 hover:bg-blood-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-[0_0_10px_#cc0000] transition-all">
                            SIGN UP
                        </button>
                    </div>
                )
            )}
        </div>
    </header>
  );

  return (
    <Layout>
      {renderHeader()}
      <div className="pt-16 pb-10">
        {view === AppView.HOME && renderHome()}
        {view === AppView.LOADING && renderLoading()}
        {view === AppView.RESULT_FREE && renderResultFree()}
        {view === AppView.AUTH && renderAuth()}
        {view === AppView.PREMIUM_DASHBOARD && renderPremium()}
        {view === AppView.PROFILE && renderProfile()}
      </div>
    </Layout>
  );
};

export default App;
