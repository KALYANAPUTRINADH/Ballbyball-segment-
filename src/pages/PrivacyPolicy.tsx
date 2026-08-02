import React from 'react';
import { Logo } from '../components/Logo';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
      <div className="max-w-3xl bg-white p-8 rounded-2xl shadow-xl w-full text-slate-800">
        <button onClick={() => window.location.href = "/"} className="mb-6 inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="m15 18-6-6 6-6"/></svg>
          Back to App
        </button>
        <div className="flex items-center space-x-3 mb-6">
          <Logo size={32} className="text-teal-600" />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Privacy Policy</h1>
        </div>
        <div className="space-y-4 text-sm leading-relaxed">
          <p><strong>Effective Date:</strong> {new Date().toLocaleDateString()}</p>
          <h2 className="text-lg font-bold mt-6 mb-2">1. Introduction</h2>
          <p>Welcome to Cricket Delivery. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile and web application. Please read this privacy policy carefully.</p>
          
          <h2 className="text-lg font-bold mt-6 mb-2">2. Information We Collect</h2>
          <p>We may collect information about you in a variety of ways. The information we may collect includes:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, phone number, and email address, that you voluntarily give to us when you register with the application.</li>
            <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the app, such as your native actions that are integral to the application, like scoring matches, following teams, and streaming activities.</li>
          </ul>

          <h2 className="text-lg font-bold mt-6 mb-2">3. Use of Your Information</h2>
          <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the application to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Create and manage your account.</li>
            <li>Enable match scoring and community features.</li>
            <li>Send push notifications for live matches.</li>
          </ul>

          <h2 className="text-lg font-bold mt-6 mb-2">4. Contact Us</h2>
          <p>If you have questions or comments about this Privacy Policy, please contact us at support@streamlify.in.</p>
        </div>
      </div>
    </div>
  );
}
