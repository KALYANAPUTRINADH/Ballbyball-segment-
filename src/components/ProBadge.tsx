import React from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ProBadgeProps {
  className?: string;
}

export function ProBadge({ className = '' }: ProBadgeProps) {
  const { isPro, isAdmin } = useAuth();
  
  if (isPro || isAdmin) return null;
  
  return (
    <div className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider uppercase bg-gradient-to-r from-amber-200 to-yellow-400 text-amber-900 border border-amber-300 shadow-sm ml-1.5 ${className}`}>
      <Lock className="w-2.5 h-2.5 mr-0.5" />
      PRO
    </div>
  );
}
