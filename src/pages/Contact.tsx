import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';
import { useToast } from '../components/ToastContext';

export default function Contact() {
  const { showToast } = useToast();
  const [msg, setMsg] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msg.trim()) return;
    showToast("Message sent successfully. We will get back to you soon!");
    setMsg('');
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-8">
      <div className="text-center mt-4">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Get in Touch</h1>
        <p className="text-slate-500">Have questions about Streamlify? We're here to help.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-4">
            <Mail className="w-6 h-6 text-[#d11a2a] shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-slate-900">Email Us</h3>
              <p className="text-sm text-slate-500 mb-1">Our friendly team is here to help.</p>
              <a href="mailto:support@streamlify.in" className="text-sm font-semibold text-blue-600">support@streamlify.in</a>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-4">
            <Phone className="w-6 h-6 text-[#d11a2a] shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-slate-900">Call Us</h3>
              <p className="text-sm text-slate-500 mb-1">Mon-Fri from 9am to 6pm.</p>
              <a href="tel:+916305605194" className="text-sm font-semibold text-blue-600">+91 63056 05194</a>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-slate-400" /> Send a Message
          </h3>
          <form onSubmit={handleSend} className="space-y-4">
            <textarea
              rows={4}
              placeholder="How can we help you?"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#d11a2a] focus:ring-1 focus:ring-[#d11a2a]"
            />
            <button
              type="submit"
              className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold text-sm shadow-sm hover:bg-slate-800 transition-colors flex items-center justify-center"
            >
              <Send className="w-4 h-4 mr-2" /> Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
