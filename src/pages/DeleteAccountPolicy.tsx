import React from 'react';
import { Logo } from '../components/Logo';

export default function DeleteAccountPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
      <div className="max-w-3xl bg-white p-8 rounded-2xl shadow-xl w-full text-slate-800">
        <button onClick={() => window.location.href = "/"} className="mb-6 inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="m15 18-6-6 6-6"/></svg>
          Back to App
        </button>
        <div className="flex items-center space-x-3 mb-6">
          <Logo size={32} className="text-red-600" />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Account Deletion Policy</h1>
        </div>
        <div className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-bold mt-6 mb-2">How to Delete Your Account</h2>
          <p>If you wish to delete your account and all associated data from Cricket Delivery, you can do so directly within the app or by contacting our support team.</p>
          
          <h3 className="font-bold mt-4">Option 1: In-App Deletion</h3>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Open the Cricket Delivery app and log in.</li>
            <li>Navigate to your <strong>Profile</strong> by tapping the Profile icon in the bottom navigation.</li>
            <li>Tap on the <strong>Edit Profile</strong> button.</li>
            <li>Scroll to the bottom of the edit screen and tap <strong>Delete Account</strong>.</li>
            <li>Confirm your choice in the prompt. This action is irreversible.</li>
          </ol>

          <h3 className="font-bold mt-4">Option 2: Email Request</h3>
          <p>You can also request account deletion by sending an email to our support team from the email address associated with your account.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Email:</strong> support@streamlify.in</li>
            <li><strong>Subject:</strong> Account Deletion Request</li>
            <li><strong>Body:</strong> Please include your registered phone number or email address so we can locate your account.</li>
          </ul>

          <h2 className="text-lg font-bold mt-6 mb-2">Data Deletion Scope</h2>
          <p>When your account is deleted, the following data is permanently removed from our active databases:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Personal profile information (Name, Phone Number, Email).</li>
            <li>Your customized settings and preferences.</li>
            <li>Followed teams and tournaments.</li>
          </ul>
          <p className="text-slate-500 italic text-xs mt-4">Note: Certain aggregated statistics from matches you played in or scored may remain anonymously in the system to preserve historical tournament records, but they will no longer be linked to your personal identity.</p>
        </div>
      </div>
    </div>
  );
}
