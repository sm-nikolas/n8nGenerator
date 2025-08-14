import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="h-screen flex items-center justify-center gradient-bg">
      <div className="text-center">
        <div className="w-20 h-20 gradient-accent rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-2xl animate-pulse">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-white text-lg font-medium">Loading...</p>
      </div>
    </div>
  );
};
