import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Download, Share2, Loader2, Image as ImageIcon, Trophy } from 'lucide-react';
import { useToast } from './ToastContext';

interface ShareImageCardProps {
  matchData: any;
  sportType: string;
}

export function ShareImageCard({ matchData, sportType }: ShareImageCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { showToast } = useToast();

  const handleGenerateAndShare = async (action: 'download' | 'share') => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          showToast('Failed to generate image.');
          setIsGenerating(false);
          return;
        }

        const file = new File([blob], 'match-summary.png', { type: 'image/png' });

        if (action === 'share' && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: 'Match Summary',
              text: 'Check out the match summary!',
              files: [file],
            });
            showToast('Shared successfully!');
          } catch (e) {
            console.error('Share failed', e);
            showToast('Share cancelled or failed.');
          }
        } else {
          // Download fallback
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = 'match-summary.png';
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          showToast(action === 'share' ? 'Native share not supported. Image downloaded instead!' : 'Image downloaded successfully!');
        }
        setIsGenerating(false);
      }, 'image/png');
    } catch (e) {
      console.error('Error generating image', e);
      showToast('Error generating image');
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full flex justify-center bg-slate-100 p-4 rounded-xl mb-4 overflow-hidden">
        {/* The Card to capture */}
        <div 
          ref={cardRef} 
          className="w-[400px] bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-red-500 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="bg-red-500/20 text-red-400 text-[10px] font-black tracking-widest uppercase px-2 py-1 rounded-md">
                {sportType} Match
              </span>
              <Trophy className="w-5 h-5 text-yellow-400" />
            </div>

            <div className="flex justify-between items-center mb-6">
              <div className="flex flex-col items-center flex-1">
                <span className="font-bold text-lg text-white mb-2 text-center leading-tight line-clamp-2">
                  {matchData?.teamA || 'Team A'}
                </span>
                {sportType === 'Cricket' ? (
                  <span className="text-3xl font-black text-white">
                    {matchData?.inningsScores?.[0]?.runs || matchData?.runs || 0}/
                    {matchData?.inningsScores?.[0]?.wickets || matchData?.wickets || 0}
                  </span>
                ) : (
                  <span className="text-3xl font-black text-white">{matchData?.scoreA || 0}</span>
                )}
              </div>
              
              <div className="px-4 text-slate-500 font-bold italic">VS</div>
              
              <div className="flex flex-col items-center flex-1">
                <span className="font-bold text-lg text-white mb-2 text-center leading-tight line-clamp-2">
                  {matchData?.teamB || 'Team B'}
                </span>
                {sportType === 'Cricket' ? (
                  <span className="text-3xl font-black text-white">
                     {matchData?.inningsScores?.[1]?.runs || 0}/
                     {matchData?.inningsScores?.[1]?.wickets || 0}
                  </span>
                ) : (
                  <span className="text-3xl font-black text-white">{matchData?.scoreB || 0}</span>
                )}
              </div>
            </div>

            {sportType === 'Cricket' && (
              <div className="bg-white/10 rounded-xl p-3 flex justify-between items-center text-sm mb-4">
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Overs</span>
                  <span className="font-semibold">{matchData?.overs || 0}.{matchData?.balls || 0}</span>
                </div>
                {matchData?.target > 0 && (
                  <div className="flex flex-col text-right">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Target</span>
                    <span className="font-semibold text-red-400">{matchData?.target}</span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 text-center border-t border-white/10 pt-3">
              <p className="text-[10px] text-slate-400">Generated by <span className="font-bold text-white">Streamlify Scoring</span></p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex space-x-3 w-full">
        <button 
          onClick={() => handleGenerateAndShare('download')}
          disabled={isGenerating}
          className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span>Save Image</span>
        </button>
        <button 
          onClick={() => handleGenerateAndShare('share')}
          disabled={isGenerating}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
          <span>Share Image</span>
        </button>
      </div>
    </div>
  );
}
