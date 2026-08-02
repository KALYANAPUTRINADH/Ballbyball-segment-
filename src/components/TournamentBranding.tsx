import React, { useState } from 'react';
import { Upload, Palette, Sparkles, CheckCircle2, Shield, Eye, Trophy } from 'lucide-react';

export function TournamentBranding() {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#d11a2a');
  const [secondaryColor, setSecondaryColor] = useState('#1e293b');
  const [saved, setSaved] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-amber-500" />
            Premium Branding
          </h2>
          <p className="text-sm text-slate-500 mt-1">Customize the public page for your tournament.</p>
        </div>
        <div className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full border border-amber-200 flex items-center">
          <Shield className="w-3 h-3 mr-1" />
          PRO Feature
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Logo Upload */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
            <h3 className="font-semibold text-slate-800 flex items-center mb-4">
              <Upload className="w-4 h-4 mr-2" />
              Tournament Logo
            </h3>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-slate-50 transition-colors">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo Preview" className="h-full object-contain p-2" />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-slate-400" />
                    <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-slate-400">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
                  </div>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </label>
            </div>
            {logoPreview && (
              <div className="mt-3 flex justify-end">
                <button onClick={() => setLogoPreview(null)} className="text-xs text-red-500 hover:text-red-700 font-medium">Remove Logo</button>
              </div>
            )}
          </div>

          {/* Theme Colors */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
            <h3 className="font-semibold text-slate-800 flex items-center mb-4">
              <Palette className="w-4 h-4 mr-2" />
              Theme Colors
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Primary Color</label>
                <div className="flex items-center space-x-3">
                  <input 
                    type="color" 
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-14 rounded cursor-pointer border-0 p-0"
                  />
                  <input 
                    type="text" 
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Secondary Color</label>
                <div className="flex items-center space-x-3">
                  <input 
                    type="color" 
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-10 w-14 rounded cursor-pointer border-0 p-0"
                  />
                  <input 
                    type="text" 
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d11a2a]"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleSave}
            className="w-full bg-[#d11a2a] text-white font-bold py-3 px-4 rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center"
          >
            {saved ? (
              <><CheckCircle2 className="w-5 h-5 mr-2" /> Saved Successfully</>
            ) : (
              'Save Branding Changes'
            )}
          </button>
        </div>

        {/* Live Preview */}
        <div>
          <h3 className="font-semibold text-slate-800 flex items-center mb-4">
            <Eye className="w-4 h-4 mr-2" />
            Public Page Preview
          </h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm h-[400px] flex flex-col bg-slate-50">
            {/* Preview Header */}
            <div 
              className="p-4 flex items-center justify-between text-white"
              style={{ backgroundColor: secondaryColor }}
            >
              <div className="flex items-center space-x-3">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="h-8 w-8 object-contain bg-white rounded p-1" />
                ) : (
                  <div className="h-8 w-8 bg-white/20 rounded flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-white" />
                  </div>
                )}
                <span className="font-bold">Winter Cup 2026</span>
              </div>
              <button 
                className="text-xs font-bold px-3 py-1.5 rounded"
                style={{ backgroundColor: primaryColor }}
              >
                Follow
              </button>
            </div>
            
            {/* Preview Content */}
            <div className="p-4 flex-1">
              <div className="flex space-x-4 border-b border-slate-200 mb-4 pb-2">
                <div 
                  className="text-xs font-bold pb-2 border-b-2"
                  style={{ color: primaryColor, borderColor: primaryColor }}
                >
                  Matches
                </div>
                <div className="text-xs font-medium text-slate-500 pb-2">Standings</div>
                <div className="text-xs font-medium text-slate-500 pb-2">Teams</div>
              </div>
              
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm mb-3">
                <div className="text-[10px] text-slate-500 mb-2">LIVE • Final</div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold">Royal Warriors</span>
                  <span className="text-sm font-bold">185/4</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500">Super Strikers</span>
                  <span className="text-sm font-bold text-slate-500">Yet to bat</span>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                <div className="text-[10px] text-slate-500 mb-2">Upcoming • Semi-Final</div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold">Mumbai Indians</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold">Chennai Super Kings</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Need to import Trophy in TournamentBranding since we use it in preview
