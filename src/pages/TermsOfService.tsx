import React from 'react';
import { Logo } from '../components/Logo';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
      <div className="max-w-3xl bg-white p-8 rounded-2xl shadow-xl w-full text-slate-800">
        <button onClick={() => window.location.href = "/"} className="mb-6 inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="m15 18-6-6 6-6"/></svg>
          Back to App
        </button>
        <div className="flex items-center space-x-3 mb-6">
          <Logo size={32} className="text-teal-600" />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Terms of Service</h1>
        </div>
        <div className="space-y-4 text-sm leading-relaxed">
          <p><strong>Effective Date:</strong> {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-lg font-bold mt-6 mb-2">1. Acceptance of Terms</h2>
          <p>By accessing or using our application, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access or use our services.</p>
          
          <h2 className="text-lg font-bold mt-6 mb-2">2. Description of Service</h2>
          <p>Streamlify is a sports management, scoring, and streaming platform. We provide tools for users to track performance, manage tournaments, and broadcast live matches.</p>

          <h2 className="text-lg font-bold mt-6 mb-2">3. User Accounts</h2>
          <p>You must register an account to use certain features. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>

          <h2 className="text-lg font-bold mt-6 mb-2">4. User Content</h2>
          <p>You retain ownership of the content you submit (such as match data, profile pictures). However, by submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display the content in connection with providing the services.</p>

          <h2 className="text-lg font-bold mt-6 mb-2">5. Prohibited Conduct</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Use the service for any illegal purpose</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Interfere with or disrupt the service or servers</li>
            <li>Attempt to gain unauthorized access to any part of the service</li>
          </ul>

          <h2 className="text-lg font-bold mt-6 mb-2">6. Payments and Subscriptions</h2>
          <p>Some features are subject to payment of fees (e.g., PRO subscription). By selecting a premium feature, you agree to pay the applicable fees securely via Razorpay or Stripe. Please refer to our Payment & Refund Policy for more details.</p>

          <h2 className="text-lg font-bold mt-6 mb-2">7. Termination</h2>
          <p>We reserve the right to suspend or terminate your access to the service at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users of the service, us, or third parties.</p>

          <h2 className="text-lg font-bold mt-6 mb-2">8. Disclaimers and Limitation of Liability</h2>
          <p>The service is provided "as is" without warranties of any kind. We shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use the service.</p>

          <h2 className="text-lg font-bold mt-6 mb-2">9. Governing Law</h2>
          <p>These terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law principles.</p>

          <h2 className="text-lg font-bold mt-6 mb-2">10. Contact Information</h2>
          <p>If you have any questions about these Terms, please contact us at support@streamlify.in.</p>
        </div>
      </div>
    </div>
  );
}
