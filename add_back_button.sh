for file in src/pages/RefundPolicy.tsx src/pages/TermsOfService.tsx src/pages/PrivacyPolicy.tsx src/pages/DeleteAccountPolicy.tsx; do
  sed -i -e '/<div className="flex items-center space-x-3 mb-6">/i\        <button onClick={() => window.location.href = "/"} className="mb-6 inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">\
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="mr-2"><path d="m15 18-6-6 6-6"/></svg>\
          Back to App\
        </button>' "$file"
done
