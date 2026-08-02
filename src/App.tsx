import React, { useState, useEffect } from "react";
import { MobileLayout } from "./components/MobileLayout";
import { CookieConsent } from "./components/CookieConsent";
import { LocationConsentModal } from "./components/LocationConsentModal";
import Home from "./pages/Home";
import TournamentHub from "./pages/TournamentHub";
import Looking from "./pages/Looking";
import MyCricket from "./pages/MyCricket";
import Community from "./pages/Community";
import { LiveScoring } from "./components/LiveScoring";
import { MatchStreamer } from "./components/MatchStreamer";
import VideoSegmentation from "./pages/VideoSegmentation";
import { AIAnalytics } from "./components/AIAnalytics";
import { Leaderboard } from "./components/Leaderboard";
import StartMatch from "./pages/StartMatch";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import CoachPortal from "./pages/CoachPortal";
import CalendarView from "./pages/CalendarView";

import StreamlifyAwards from "./pages/StreamlifyAwards";
import AppCode from "./pages/AppCode";
import Clubs from "./pages/Clubs";
import Associations from "./pages/Associations";
import Contact from "./pages/Contact";
import More from "./pages/More";
import RulesHandbook from "./pages/RulesHandbook";
import StreamingSetup from "./pages/StreamingSetup";
import OBSLiveStream from "./pages/OBSLiveStream";
import { AdminPanel } from "./components/AdminPanel";
import PlayerProfile from "./pages/PlayerProfile";
import { ProDashboard } from "./pages/ProDashboard";
import { ProUpgradeModal } from "./components/ProUpgradeModal";
import { useAuth } from "./contexts/AuthContext";
import { ScoreboardOverlay } from "./components/ScoreboardOverlay";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DeleteAccountPolicy from "./pages/DeleteAccountPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import TermsOfService from "./pages/TermsOfService";
import { Logo } from "./components/Logo";
import { AdSenseLoader } from "./components/AdSenseLoader";

function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 pt-20">
      <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center">
        <span className="text-2xl">🚧</span>
      </div>
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <p>This feature is currently under development.</p>
    </div>
  );
}
export default function App() {
  const { isPro, isAdmin } = useAuth();
  
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('overlay')) {
    return <ScoreboardOverlay />;
  }
  
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('page') === 'privacy') {
    return <PrivacyPolicy />;
  }
  
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('page') === 'refund-policy') {
    return <RefundPolicy />;
  }

  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('page') === 'terms') {
    return <TermsOfService />;
  }
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('page') === 'delete-account') {
    return <DeleteAccountPolicy />;
  }
  
  const [showProModal, setShowProModal] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("last_tab") || "home"
      : "home",
  );
  const [fullScreenView, setFullScreenView] = useState<string | null>(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("last_fullscreen")
      : null,
  );
  const handleSetFullScreenView = (view: string | null) => {
    const proFeatures = [
      "My Performance",
      "Pro Dashboard",
      "Stats",
      "Career Stats",
      "Performance",
    ];
    if (view && proFeatures.includes(view) && !isPro && !isAdmin) {
      setShowProModal(view);
      return;
    }
    setFullScreenView(view);
  };
  const [isProOpen, setIsProOpen] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

  React.useEffect(() => {
    const handleOpenPlayerProfile = (e: Event) => {
      setSelectedPlayer((e as CustomEvent).detail);
    };
    const handleWatchLiveMatch = (e: Event) => {
      const matchId = (e as CustomEvent).detail;
      localStorage.setItem("active_match_id", matchId);
      setFullScreenView("Match Streamer");
    };
    const handleOpenProModal = (e: Event) => {
      setShowProModal((e as CustomEvent).detail);
    };
    window.addEventListener('openProModal', handleOpenProModal);
    window.addEventListener('openPlayerProfile', handleOpenPlayerProfile);
    window.addEventListener('watchLiveMatch', handleWatchLiveMatch);
    return () => {
      window.removeEventListener('openProModal', handleOpenProModal);
      window.removeEventListener('openPlayerProfile', handleOpenPlayerProfile);
      window.removeEventListener('watchLiveMatch', handleWatchLiveMatch);
    };
  }, []);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("last_tab", currentTab);
      if (fullScreenView) {
        localStorage.setItem("last_fullscreen", fullScreenView);
      } else {
        localStorage.removeItem("last_fullscreen");
      }
    }
  }, [currentTab, fullScreenView]);

  const renderContent = () => {
    switch (currentTab) {
      case "home":
        return (
          <Home
            setFullScreenView={handleSetFullScreenView}
            openProModal={() => setIsProOpen(true)}
          />
        );
      case "looking":
        return <Looking />;
      case "mycricket":
        return <MyCricket setFullScreenView={handleSetFullScreenView} />;
      case "community":
        return <Community />;
      default:
        return <Home />;
    }
  };

  if (fullScreenView === "Match Scoring") {
    return (
      <>
        
          <CookieConsent />
          <AdSenseLoader />
          <LocationConsentModal />
          <div className="font-sans min-h-screen bg-slate-50 flex flex-col relative">
            {!compactMode && (
              <div className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md z-50">
                <div className="flex items-center space-x-3">
                  <Logo size={24} className="text-white" />
                  <span className="text-red-500 animate-pulse text-xl">●</span>
                  <h1 className="font-bold text-lg">Scoring</h1>
                </div>
                <button
                  onClick={() => handleSetFullScreenView(null)}
                  className="text-sm font-semibold bg-white/20 hover:bg-white/30 transition-colors px-3 py-1.5 rounded"
                >
                  Exit to App
                </button>
              </div>
            )}
            <div
              className={`flex-1 overflow-y-auto ${compactMode ? "p-0 bg-black" : "p-4"}`}
            >
              <LiveScoring
                isCompactMode={compactMode}
                setIsCompactMode={setCompactMode}
                setFullScreenView={handleSetFullScreenView}
              />
            </div>
          </div>
          <ProUpgradeModal
            isOpen={!!showProModal}
            onClose={() => setShowProModal(null)}
            featureName={showProModal || "Pro Feature"}
          />
        
      </>
    );
  }

  if (fullScreenView === "Tournament Hub") {
    return (
      <>
        <CookieConsent />
        <AdSenseLoader />
        <LocationConsentModal />
        <TournamentHub setFullScreenView={handleSetFullScreenView} />
      </>
    );
  }

  if (fullScreenView === "Match Streamer") {
    return (
      <>
        
          <CookieConsent />
          <AdSenseLoader />
          <LocationConsentModal />
          <MatchStreamer
            matchId={localStorage.getItem("active_match_id") || ""}
            setFullScreenView={handleSetFullScreenView}
          />
          <ProUpgradeModal
            isOpen={!!showProModal}
            onClose={() => setShowProModal(null)}
            featureName={showProModal || "Pro Feature"}
          />
        
      </>
    );
  }

  if (
    [
      "My Performance",
      "Pro Dashboard",
      "Leaderboards",
      "Streamlify Awards",
      "Video Segmentation",
      "Start A Match",
      "Profile",
      "Team Chat",
      "Coach Portal",
      "Calendar & Schedule",
      "App code",
      "Clubs",
      "Associations",
      "Contact",
      "Rules Handbook",
      "More",
      "Admin Panel",
      "Streaming Setup",
      "OBS Live Stream",
    ].includes(fullScreenView || "")
  ) {
    return (
      <>
        
          <CookieConsent />
          <AdSenseLoader />
          <LocationConsentModal />
          <div className="font-sans min-h-screen bg-slate-50 flex flex-col relative">
            <div className="bg-[#d11a2a] text-white p-4 flex justify-between items-center shadow-md z-50">
              <div className="flex items-center space-x-3">
                <Logo size={24} className="text-white" />
                <h1 className="font-bold text-lg">{fullScreenView}</h1>
              </div>
              <button
                onClick={() => handleSetFullScreenView(null)}
                className="text-sm font-semibold bg-white/20 hover:bg-white/30 transition-colors px-3 py-1.5 rounded"
              >
                Back
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
              {fullScreenView === "My Performance" && <AIAnalytics />}
              {fullScreenView === "Leaderboards" && <Leaderboard />}
              {fullScreenView === "Video Segmentation" && <VideoSegmentation />}
              {fullScreenView === "Start A Match" && (
                <StartMatch setFullScreenView={handleSetFullScreenView} />
              )}
              {fullScreenView === "Profile" && (
                <Profile setFullScreenView={handleSetFullScreenView} />
              )}
              {fullScreenView === "Team Chat" && <Chat />}
              {fullScreenView === "Coach Portal" && <CoachPortal />}
              {fullScreenView === "Calendar & Schedule" && <CalendarView />}
              {fullScreenView === "Streamlify Awards" && <StreamlifyAwards />}
              {fullScreenView === "App code" && <AppCode />}
              {fullScreenView === "Pro Dashboard" && <ProDashboard onBack={() => handleSetFullScreenView(null)} />}
              {fullScreenView === "Clubs" && <Clubs />}
              {fullScreenView === "Associations" && <Associations />}
              {fullScreenView === "Contact" && <Contact />}
              {fullScreenView === "Rules Handbook" && <RulesHandbook />}
              {fullScreenView === "More" && <More setFullScreenView={handleSetFullScreenView} />}
              {fullScreenView === "Admin Panel" && <AdminPanel />}
              {fullScreenView === "Streaming Setup" && (
                <StreamingSetup setFullScreenView={handleSetFullScreenView} />
              )}
              {fullScreenView === "OBS Live Stream" && (
                <OBSLiveStream setFullScreenView={handleSetFullScreenView} />
              )}
            </div>
          </div>
          <ProUpgradeModal
            isOpen={!!showProModal}
            onClose={() => setShowProModal(null)}
            featureName={showProModal || "Pro Feature"}
          />
        
      </>
    );
  }

  return (
    <>
      
        <CookieConsent />
        <AdSenseLoader />
        <LocationConsentModal />
        <div className="font-sans">
          <MobileLayout
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            setFullScreenView={handleSetFullScreenView}
            isProOpen={isProOpen}
            setIsProOpen={setIsProOpen}
          >
            {renderContent()}
          </MobileLayout>
        </div>
        <ProUpgradeModal
          isOpen={!!showProModal}
          onClose={() => setShowProModal(null)}
          featureName={showProModal || "Pro Feature"}
        />
        {selectedPlayer && (
          <div className="fixed inset-0 z-[200] bg-white overflow-y-auto">
            <PlayerProfile player={selectedPlayer} onBack={() => setSelectedPlayer(null)} />
          </div>
        )}
      
    </>
  );
}
