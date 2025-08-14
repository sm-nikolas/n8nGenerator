import React, { useCallback, memo } from 'react';
import { User as UserIcon, Menu, LogOut, Settings, Bell, Search, GitBranch, MessageSquare, Eye, Download, Share, Play } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Workflow } from '../types';
import { User } from '@supabase/supabase-js';

interface HeaderProps {
  user: User;
  onToggleSidebar: () => void;
  activeView: 'chat' | 'workflow' | 'preview';
  onViewChange: (view: 'chat' | 'workflow' | 'preview') => void;
  currentWorkflow: Workflow | null;
}

export const Header = memo(function Header({ 
  user, 
  onToggleSidebar, 
  activeView, 
  onViewChange, 
  currentWorkflow 
}: HeaderProps) {
  const { signOut } = useAuth();

  // Get user avatar from Google OAuth metadata
  const getUserAvatar = () => {
    // Check user_metadata first (Google OAuth data)
    if (user.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url;
    }
    // Fallback to app_metadata
    if (user.app_metadata?.provider === 'google' && user.app_metadata?.avatar_url) {
      return user.app_metadata.avatar_url;
    }
    // Fallback to picture field (common in OAuth)
    if (user.user_metadata?.picture) {
      return user.user_metadata.picture;
    }
    return null;
  };

  const userAvatar = getUserAvatar();

  const exportWorkflow = useCallback(() => {
    if (!currentWorkflow) return;
    
    const dataStr = JSON.stringify(currentWorkflow, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentWorkflow.name}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [currentWorkflow]);

  const shareWorkflow = useCallback(() => {
    if (!currentWorkflow) return;
    
    const shareData = {
      title: currentWorkflow.name,
      text: currentWorkflow.description,
      url: window.location.href,
    };
    
    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  }, [currentWorkflow]);

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, [signOut]);

  const handleViewChange = useCallback((view: 'chat' | 'workflow' | 'preview') => {
    onViewChange(view);
  }, [onViewChange]);

  return (
    <header className="h-14 bg-primary border-b border-gray-700 flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200 text-white"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <GitBranch className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">N8N Flow AI</h1>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex bg-white/10 rounded-lg p-1">
          <button
            onClick={() => handleViewChange('chat')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              activeView === 'chat'
                ? 'bg-accent text-white shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            {currentWorkflow ? 'Conversation' : 'New Chat'}
          </button>
          <button
            onClick={() => handleViewChange('workflow')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              activeView === 'workflow'
                ? 'bg-accent text-white shadow-sm'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
            disabled={!currentWorkflow}
          >
            <GitBranch className="h-4 w-4" />
            Canvas
          </button>
          <button
            onClick={() => handleViewChange('preview')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              activeView === 'preview'
                ? 'bg-accent text-white shadow-sm'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
            disabled={!currentWorkflow}
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>
        </div>
        
        {currentWorkflow && (
          <div className="flex items-center gap-2">
            <button
              onClick={exportWorkflow}
              className="btn-ghost flex items-center gap-2 text-sm"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <button
              onClick={shareWorkflow}
              className="btn-ghost flex items-center gap-2 text-sm"
            >
              <Share className="h-4 w-4" />
              Share
            </button>
            <button className="btn-primary flex items-center gap-2 text-sm">
              <Play className="h-4 w-4" />
              Execute
            </button>
          </div>
        )}
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
            {userAvatar ? (
              <>
                <img 
                  src={userAvatar} 
                  alt="Profile" 
                  className="w-6 h-6 rounded-full object-cover"
                  onError={(e) => {
                    // Fallback to icon if image fails to load
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling;
                    if (fallback) {
                      (fallback as HTMLElement).style.display = 'flex';
                    }
                  }}
                />
                <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center hidden">
                  <UserIcon className="h-3 w-3 text-white" />
                </div>
              </>
            ) : (
              <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                <UserIcon className="h-3 w-3 text-white" />
              </div>
            )}
            <span className="text-sm text-white">{user.email}</span>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
});
