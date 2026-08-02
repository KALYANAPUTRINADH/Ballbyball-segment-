import React from 'react';
import { Share2 } from 'lucide-react';
import { useToast } from './ToastContext';

export interface ShareButtonProps {
  title: string;
  text: string;
  url: string;
  className?: string;
}

export function ShareButton({ title, text, url, className = '' }: ShareButtonProps) {
  const { showToast } = useToast();

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
        showToast('Shared successfully!');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
          showToast('Failed to share.');
        }
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        showToast('Link copied to clipboard!');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        showToast('Failed to copy link.');
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`p-2 rounded-full hover:bg-white/10 transition-colors ${className}`}
      aria-label="Share"
    >
      <Share2 className="w-5 h-5 text-white" />
    </button>
  );
}
