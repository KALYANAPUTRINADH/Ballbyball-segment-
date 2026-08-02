import React from 'react';
import { Logo } from '../components/Logo';

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
      <div className="max-w-3xl bg-white p-8 rounded-2xl shadow-xl w-full text-slate-800">
        <button onClick={() => window.location.href = "/"} className="mb-6 inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="m15 18-6-6 6-6"/></svg>
          Back to App
        </button>
        <div className="flex items-center space-x-3 mb-6">
          <Logo size={32} className="text-teal-600" />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payment & Refund Policy</h1>
        </div>
        <div className="space-y-4 text-sm leading-relaxed">
          <p><strong>Effective Date:</strong> {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-lg font-bold mt-6 mb-2">1. Payments and Subscriptions</h2>
          <p>
            Streamlify offers premium features through a "PRO" subscription plan. Payments can be made on a monthly or yearly basis. All payments are processed securely through our payment partners, such as Razorpay and Stripe.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Payments are billed in advance on a recurring basis.</li>
            <li>Your subscription will automatically renew unless canceled before the end of the current billing period.</li>
            <li>You must provide accurate billing and contact information.</li>
          </ul>

          <h2 className="text-lg font-bold mt-6 mb-2">2. Cancellation Policy</h2>
          <p>
            You may cancel your subscription at any time through the application settings or by contacting our support team. Upon cancellation, your subscription will be terminated immediately, and you will lose access to all PRO features immediately.
          </p>

          <h2 className="text-lg font-bold mt-6 mb-2">3. Refund Policy</h2>
          <p>
            We strive to ensure complete satisfaction with our PRO features. However, due to the digital nature of our services, our refund policy is as follows:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Monthly Subscriptions:</strong> Payments for monthly subscriptions are non-refundable. You can cancel at any time to prevent future charges.</li>
            <li><strong>Yearly Subscriptions:</strong> If you are not satisfied with your yearly subscription, you may request a refund within <strong>7 days</strong> of your initial purchase. After 7 days, no refunds will be issued.</li>
            <li><strong>Exceptions:</strong> Refunds may be granted at our discretion in cases of technical errors, duplicate charges, or if the service was completely unavailable due to server issues on our end.</li>
          </ul>

          <h2 className="text-lg font-bold mt-6 mb-2">4. Requesting a Refund</h2>
          <p>
            To request a refund, please contact us at <strong>support@streamlify.in</strong> within the applicable refund period. Please include:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Your registered email address or phone number</li>
            <li>Transaction ID or Order ID</li>
            <li>A brief explanation of your reason for requesting a refund</li>
          </ul>
          <p>
            Refunds are typically processed within 5-7 business days, depending on your payment method and financial institution.
          </p>

          <h2 className="text-lg font-bold mt-6 mb-2">5. Pricing Changes</h2>
          <p>
            We reserve the right to modify our pricing at any time. Any price changes will be communicated to you in advance and will only apply to your next billing cycle.
          </p>
          
          <h2 className="text-lg font-bold mt-6 mb-2">6. Contact Us</h2>
          <p>
            If you have any questions about this Payment & Refund Policy, please contact us at:
            <br />
            <strong>Email:</strong> support@streamlify.in
            <br />
            <strong>Phone:</strong> +91 63056 05194
          </p>
        </div>
      </div>
    </div>
  );
}
