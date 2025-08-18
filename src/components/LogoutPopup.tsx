import React, { useEffect, useRef } from 'react';
import { LogOut, X } from 'lucide-react';

interface LogoutPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  anchorRef: React.RefObject<HTMLElement>;
}

export const LogoutPopup: React.FC<LogoutPopupProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  anchorRef 
}) => {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current && 
        !popupRef.current.contains(event.target as Node) &&
        anchorRef.current && 
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, anchorRef]);

  // Calculate position based on anchor element
  const getPopupPosition = () => {
    if (!anchorRef.current) return { top: 0, right: 0 };
    
    const rect = anchorRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + 8, // 8px below the button
      right: window.innerWidth - rect.right
    };
  };

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const position = getPopupPosition();
  
  return (
    <div 
      ref={popupRef}
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[280px] overflow-hidden"
      style={{
        top: position.top,
        right: position.right
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <LogOut className="h-4 w-4 text-red-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Confirm Logout</h3>
        </div>
                 <button
           onClick={onClose}
           className="p-1 hover:bg-gray-100 rounded transition-colors"
         >
           <X className="h-4 w-4 text-gray-500" />
         </button>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to sign out of your account?
        </p>
        
        {/* Actions */}
        <div className="flex gap-2">
                                             <button
              onClick={onClose}
              className="flex-1 px-3 py-2 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-md font-medium transition-colors"
            >
              Cancel
            </button>
                      <button
              onClick={handleConfirm}
              className="flex-1 px-3 py-2 text-xs text-white bg-red-600 hover:bg-red-700 rounded-md font-medium transition-colors"
            >
              Sign Out
            </button>
        </div>
      </div>
    </div>
  );
};
