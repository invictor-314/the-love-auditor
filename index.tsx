import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ClerkProvider } from '@clerk/clerk-react';
import { dark } from '@clerk/themes'; 

// Import key dari env vite
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

// 🔥🔥🔥 TRACKING SYSTEM V2 (GARIS DEPAN) 🔥🔥🔥
// Kode ini akan jalan SEBELUM React di-load. Pasti kena.
try {
  const urlParams = new URLSearchParams(window.location.search);
  const affCode = urlParams.get('aff');
  
  if (affCode) {
    // 1. Simpan ke Brankas
    localStorage.setItem('referral_code', affCode);
    
    // 2. Beri tanda di Console (Supaya Anda bisa lihat)
    console.log("%c 🎯 AFFILIATE DETECTED: " + affCode, "background: #ff0033; color: white; font-size: 20px; font-weight: bold; padding: 10px; border-radius: 10px;");
  } else {
    // Cek apakah ada sisa lama
    const existing = localStorage.getItem('referral_code');
    if (existing) {
        console.log("%c 📂 EXISTING REFERRAL: " + existing, "color: yellow; font-size: 12px;");
    }
  }
} catch (e) {
  console.error("Tracking Error:", e);
}
// 🔥🔥🔥 END TRACKING SYSTEM 🔥🔥🔥

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY} 
      afterSignOutUrl="/"
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#ff0033', // Warna merah darah (Blood-500)
          colorBackground: '#0a0a0a',
          colorText: 'white',
        }
      }}
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
