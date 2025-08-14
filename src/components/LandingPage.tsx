import React from 'react';
import { Sparkles } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="h-screen flex items-center justify-center gradient-bg relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-white/10 to-transparent rounded-full -translate-x-48 -translate-y-48"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-[#FF4F79]/20 to-transparent rounded-full translate-x-48 translate-y-48"></div>
      
      <div className="text-center max-w-md mx-4">
        <div className="w-24 h-24 gradient-accent rounded-full flex items-center justify-center mb-8 mx-auto shadow-2xl animate-float">
          <Sparkles className="h-12 w-12 text-white" />
        </div>
        <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
          N8N Flow AI
        </h1>
        <p className="text-white/80 mb-12 text-xl leading-relaxed">
          Create automated workflows for n8n using artificial intelligence
        </p>
        <button
          onClick={onGetStarted}
          className="btn-primary text-lg px-12 py-4"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};
