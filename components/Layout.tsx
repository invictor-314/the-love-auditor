import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden font-body bg-dark text-white selection:bg-blood-500 selection:text-white">
        
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Subtle Red Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blood-600/20 rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blood-900/30 rounded-full blur-[100px] opacity-40"></div>
        <div className="absolute top-[40%] left-[50%] transform -translate-x-1/2 w-[800px] h-[800px] bg-blood-500/5 rounded-full blur-[150px] pointer-events-none"></div>
      </div>

      {/* Vignette Overlay */}
      <div className="fixed inset-0 pointer-events-none z-10 vignette"></div>

      {/* Scanline Effect (Optional Cyberpunk feel) */}
      <div className="fixed inset-0 pointer-events-none z-10 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none"></div>

      {/* Content */}
      <div className="relative z-20 w-full max-w-md mx-auto min-h-screen flex flex-col px-4 py-6 md:max-w-4xl">
        {children}
      </div>
    </div>
  );
};

export default Layout;