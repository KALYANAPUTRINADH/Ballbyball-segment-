import React, { useState } from 'react';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Radio, 
  Trophy, 
  CreditCard, 
  UserCheck, 
  Mail, 
  ArrowLeft, 
  CheckCircle2, 
  BookOpen, 
  Sparkles,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import { Logo } from '../components/Logo';

interface FAQItem {
  id: string;
  category: 'scoring' | 'streaming' | 'billing' | 'tournament' | 'account';
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  // Live Scoring
  {
    id: 'sc-1',
    category: 'scoring',
    question: 'How do I start scoring a live match?',
    answer: 'Navigate to "Start a Match" from the main menu, enter team names, select the sport (Cricket, Football, Basketball, Tennis, etc.), set overs/match format, and click "Start Match". You will be taken straight to the ball-by-ball or point-by-point live scoring interface.'
  },
  {
    id: 'sc-2',
    category: 'scoring',
    question: 'Can I undo an incorrect ball or score entry?',
    answer: 'Yes! On the scoring panel, click the "Undo" button at any time to revert the last delivery, point, or event. You can undo multiple deliveries if needed.'
  },
  {
    id: 'sc-3',
    category: 'scoring',
    question: 'How do I track player statistics like runs, wickets, or goals?',
    answer: 'When scoring, select active batsmen/bowlers or players from the dropdowns. All runs, wickets, extras, overs, and goal statistics update automatically in real-time on player profile cards and performance dashboards.'
  },
  {
    id: 'sc-4',
    category: 'scoring',
    question: 'Can multiple scorekeepers score the same match?',
    answer: 'Yes. Matches are synchronized instantly across cloud storage. Share the Match Link or PIN with co-organizers so they can assist in scoring or commentary.'
  },

  // Streaming & OBS
  {
    id: 'sc-5',
    category: 'streaming',
    question: 'How do I connect Streamlify scoreboards to OBS or vMix?',
    answer: 'Go to "Streaming Setup" or "OBS Live Stream", select your match, and copy the transparent Browser Source URL. In OBS, add a new "Browser Source", paste the URL, set width to 1920 and height to 1080, and check "Control audio via OBS". Your live score overlay will appear seamlessly over your video.'
  },
  {
    id: 'sc-6',
    category: 'streaming',
    question: 'Why is my OBS overlay not updating in real-time?',
    answer: 'Ensure your internet connection is stable on both the scoring device and the streaming PC. If updates lag, refresh the Browser Source in OBS or verify that the active match ID in your scoring tab matches the OBS source URL.'
  },
  {
    id: 'sc-7',
    category: 'streaming',
    question: 'Can I stream live directly from my mobile phone?',
    answer: 'Yes! Streamlify offers built-in mobile camera streaming with transparent graphics overlays directly on screen, eliminating the need for a PC for quick local matches.'
  },

  // Pro Plans & Payments
  {
    id: 'sc-8',
    category: 'billing',
    question: 'What are the Pro plan prices and features?',
    answer: 'Streamlify Pro is available for ₹99/month or ₹999/year. Pro unlocks unlimited tournament creation, broadcast-grade graphics overlay customization, AI match summary analytics, priority high-bandwidth stream rendering, and full player performance history.'
  },
  {
    id: 'sc-9',
    category: 'billing',
    question: 'What payment methods are supported?',
    answer: 'We support all major payment methods including Razorpay (UPI, Google Pay, PhonePe, Paytm, Indian Netbanking, Debit/Credit Cards) and Stripe (International Credit/Debit Cards, Apple Pay, Google Pay).'
  },
  {
    id: 'sc-10',
    category: 'billing',
    question: 'How do I cancel my subscription or request a refund?',
    answer: 'You can manage your plan under "Subscription Management" in your profile or app menu. If you require a refund, please refer to our Refund Policy page or contact support@streamlify.app within 7 days of purchase.'
  },

  // Tournament Management
  {
    id: 'sc-11',
    category: 'tournament',
    question: 'How do I create and manage a tournament?',
    answer: 'Pro users can click "Add a Tournament/Series" from the side drawer. Enter tournament name, location, sport type, and format (Knockout or League). You can then register teams, generate fixtures, and auto-update point tables upon match completion.'
  },
  {
    id: 'sc-12',
    category: 'tournament',
    question: 'How are Points Tables and NRR calculated?',
    answer: 'Point tables automatically award points for wins, ties, and abandonments. For Cricket, Net Run Rate (NRR) is updated after every completed match using total runs scored divided by overs faced minus runs conceded divided by overs bowled.'
  },

  // Account & Privacy
  {
    id: 'sc-13',
    category: 'account',
    question: 'How do I reset my password or update my profile?',
    answer: 'Go to Profile > Settings. You can update your display name, profile photo, contact details, and change your account security settings at any time.'
  },
  {
    id: 'sc-14',
    category: 'account',
    question: 'How do I request complete deletion of my account and data?',
    answer: 'Visit our Account Deletion page or email support@streamlify.app with your registered email address. All personal data and statistics will be permanently removed within 30 days in compliance with privacy regulations.'
  }
];

export default function HelpCenter({ setFullScreenView }: { setFullScreenView?: (view: string | null) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openFaqId, setOpenFaqId] = useState<string | null>('sc-1');
  
  // Support Form State
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const handleBack = () => {
    if (setFullScreenView) {
      setFullScreenView(null);
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  const filteredFaqs = FAQ_DATA.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesQuery = searchQuery.trim() === '' || 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactSubject.trim() || !contactMessage.trim()) return;
    
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubject('');
      setContactMessage('');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Header Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleBack()}>
            <Logo size={28} className="text-white" />
            <span className="font-extrabold text-xl tracking-tight text-white">Streamlify</span>
            <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-500/30">
              Help & FAQ
            </span>
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

      {/* Hero Search Section */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white py-12 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Support Center & FAQ</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            How can we help you today?
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
            Search our knowledge base for answers regarding live scoring, OBS live streaming, pro subscriptions, and tournament management.
          </p>

          {/* Search Box */}
          <div className="relative max-w-xl mx-auto pt-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search answers (e.g. OBS, scoring, ₹99 plan, reset password)..."
              className="w-full bg-slate-800/90 border border-slate-700 text-white pl-11 pr-10 py-3.5 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-lg"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-white bg-slate-700 rounded-full px-2 py-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 py-10 space-y-10 flex-1">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            { id: 'all', label: 'All FAQs', icon: <HelpCircle className="w-4 h-4" /> },
            { id: 'scoring', label: 'Live Scoring', icon: <Trophy className="w-4 h-4" /> },
            { id: 'streaming', label: 'OBS & Streaming', icon: <Radio className="w-4 h-4" /> },
            { id: 'billing', label: 'Pro & Billing', icon: <CreditCard className="w-4 h-4" /> },
            { id: 'tournament', label: 'Tournaments', icon: <Sparkles className="w-4 h-4" /> },
            { id: 'account', label: 'Account & Privacy', icon: <UserCheck className="w-4 h-4" /> },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {selectedCategory === 'all' ? 'Frequently Asked Questions' : `${selectedCategory.toUpperCase()} FAQs`}
              </h2>
              <p className="text-xs text-slate-500">
                Showing {filteredFaqs.length} results
              </p>
            </div>
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No matching questions found</p>
              <p className="text-xs text-slate-500">Try adjusting your search query or select another category above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map((faq) => {
                const isOpen = openFaqId === faq.id;
                return (
                  <div 
                    key={faq.id}
                    className="border border-slate-200/80 rounded-xl overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                      className="w-full flex items-center justify-between p-4 text-left bg-slate-50/50 hover:bg-slate-100/80 transition-colors"
                    >
                      <span className="font-semibold text-sm text-slate-900 pr-4 flex items-center gap-2">
                        <span className="text-red-500 font-bold">•</span>
                        {faq.question}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="p-4 bg-white text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Help & External Resource Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="?page=rules"
            onClick={(e) => {
              if (setFullScreenView) {
                e.preventDefault();
                setFullScreenView("Rules Handbook");
              }
            }}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all flex items-center space-x-3 group"
          >
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-900">Rules Handbook</h3>
              <p className="text-[11px] text-slate-500">View official scoring rules</p>
            </div>
          </a>

          <a
            href="?page=about"
            onClick={(e) => {
              if (setFullScreenView) {
                e.preventDefault();
                setFullScreenView("About Us");
              }
            }}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all flex items-center space-x-3 group"
          >
            <div className="p-2.5 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-100 transition-colors">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-900">About Streamlify</h3>
              <p className="text-[11px] text-slate-500">Learn about our mission</p>
            </div>
          </a>

          <a
            href="?page=terms"
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all flex items-center space-x-3 group"
          >
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100 transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-900">Terms & Policies</h3>
              <p className="text-[11px] text-slate-500">Privacy, terms, and refunds</p>
            </div>
          </a>
        </div>

        {/* Contact Support Form Section */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
            <div className="p-3 bg-red-500/20 text-red-400 rounded-xl">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Need Additional Assistance?</h2>
              <p className="text-xs text-slate-400">Our support team responds within 24 hours</p>
            </div>
          </div>

          {contactSubmitted ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center space-y-2 animate-in fade-in">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="font-bold text-base text-white">Message Sent Successfully!</h3>
              <p className="text-xs text-slate-300">
                Thank you for contacting Streamlify Support. We have received your query and will reply via email shortly.
              </p>
              <button
                onClick={() => setContactSubmitted(false)}
                className="mt-3 text-xs font-bold text-emerald-400 hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Subject / Topic
                </label>
                <input
                  type="text"
                  required
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  placeholder="e.g. Query regarding OBS score overlay delay"
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3.5 py-2.5 rounded-lg text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Message / Details
                </label>
                <textarea
                  required
                  rows={4}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Describe what you need help with in detail..."
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3.5 py-2.5 rounded-lg text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center space-x-2 text-slate-400 text-xs">
                  <Mail className="w-4 h-4 text-red-400" />
                  <span>Direct email: <a href="mailto:support@streamlify.app" className="text-red-400 hover:underline">support@streamlify.app</a></span>
                </div>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-6 py-2.5 rounded-lg transition-colors shadow-md"
                >
                  Submit Support Ticket
                </button>
              </div>
            </form>
          )}
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
