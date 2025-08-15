import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="h-screen flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center shadow-2xl">
        <Loader2 className="h-10 w-10 text-white animate-spin" />
      </div>
    </div>
  );
};
