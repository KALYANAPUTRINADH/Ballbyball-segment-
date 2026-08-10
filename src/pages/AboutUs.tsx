import React from 'react';
import { Trophy, ShieldCheck, Video, Users, Sparkles, BarChart3, Mail, ArrowLeft, Heart, Zap, Globe2 } from 'lucide-react';
import { Logo } from '../components/Logo';

export default function AboutUs() {
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.location.href = "/"}>
            <Logo size={28} className="text-white" />
            <span className="font-extrabold text-xl tracking-tight text-white">Streamlify</span>
          </div>
          <button
            onClick={handleBack}
            className="flex items-center space-x-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg transition-colors border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to App</span>
          </button>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center space-x-2 bg-red-500/10 border border-red-500/20 text-red-400 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Empowering Grassroots & Professional Sports</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Revolutionizing Live Sports Scoring & Broadcasting
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
            Streamlify is built for players, coaches, tournament organizers, and sports enthusiasts to capture every run, goal, shot, and highlight with professional-grade broadcasting overlays and real-time statistics.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-12 space-y-12 flex-1">
        {/* Mission Statement */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-50 text-[#d11a2a] rounded-xl">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Our Mission</h2>
              <p className="text-xs text-slate-500">Democratizing sports technology for everyone</p>
            </div>
          </div>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Every match played—from local park tournaments to national championships—deserves high-quality digital scoring, real-time leaderboards, and broadcast-ready video overlays. Streamlify bridges the gap between grassroots passion and professional sports media by turning any smartphone or camera into a complete broadcast studio.
          </p>
        </div>

        {/* Core Pillars */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">What Makes Streamlify Special</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Real-Time Ball-by-Ball Scoring</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Intuitive controls for instant ball-by-ball scoring, player statistics updates, wagon wheels, and performance analytics across multiple sports disciplines.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="p-3 bg-red-50 text-[#d11a2a] rounded-xl w-fit">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Broadcast Graphics & Overlays</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Professional TV-style scoreboard overlays compatible with OBS, vMix, and mobile live streaming so your viewers experience premium broadcast quality.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Tournament Management</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Complete tournament organization tools including standings tables, knockout bracket generation, team rosters, and automated leaderboards.
              </p>
            </div>
          </div>
        </div>

        {/* Multi-sport Support */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-slate-800 text-amber-400 rounded-xl">
              <Globe2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Multi-Sport Analytics Platform</h2>
              <p className="text-xs text-slate-400">Customized rules and telemetry tailored for every game</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            {['Cricket', 'Football', 'Basketball', 'Tennis', 'Pickleball', 'Hockey', 'Volleyball', 'Badminton', 'Table Tennis', 'Squash'].map((sport, i) => (
              <div key={i} className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-xl text-xs font-semibold text-slate-200">
                {sport}
              </div>
            ))}
          </div>
        </div>

        {/* Commitment to Trust & Quality */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">User Safety & Data Protection</h2>
              <p className="text-xs text-slate-500">Built with standard security practices and complete transparency</p>
            </div>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            We value user privacy and security. Streamlify maintains strict data safeguards, transparent billing policies, and compliant terms of service. Users maintain full control over their account data and statistics.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a href="?page=privacy" className="text-xs font-semibold text-[#d11a2a] hover:underline">Privacy Policy</a>
            <span className="text-slate-300">•</span>
            <a href="?page=terms" className="text-xs font-semibold text-[#d11a2a] hover:underline">Terms of Service</a>
            <span className="text-slate-300">•</span>
            <a href="?page=refund-policy" className="text-xs font-semibold text-[#d11a2a] hover:underline">Refund Policy</a>
            <span className="text-slate-300">•</span>
            <a href="?page=delete-account" className="text-xs font-semibold text-[#d11a2a] hover:underline">Account Deletion</a>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-slate-100 rounded-2xl p-6 sm:p-8 border border-slate-200 text-center space-y-3">
          <Mail className="w-8 h-8 text-[#d11a2a] mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Have Questions or Suggestions?</h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Our support team is always here to assist tournament organizers, players, and media partners.
          </p>
          <a
            href="mailto:support@streamlify.app"
            className="inline-block bg-[#d11a2a] hover:bg-red-700 text-white font-bold text-xs px-6 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            Contact Support
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-6 px-4 text-center text-xs">
        <div className="max-w-5xl mx-auto space-y-2">
          <div className="flex justify-center items-center space-x-2">
            <Logo size={20} className="text-slate-400" />
            <span className="font-bold text-slate-200">Streamlify Sports Media</span>
          </div>
          <p>© {new Date().getFullYear()} Streamlify. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
