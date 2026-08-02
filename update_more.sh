sed -i -e '/{ icon: <MapPin className="w-5 h-5 text-slate-500" \/>, label: "Privacy & Cookies" },/i\        { icon: <FileText className="w-5 h-5 text-slate-500" />, label: "Payment & Refund Policy" },' ./src/pages/More.tsx

sed -i -e '/} else if (.\["Terms of Service", "Privacy Policy"\].includes(label)) {/i\    } else if (label === "Payment & Refund Policy") {\
      window.location.href = "?page=refund-policy";' ./src/pages/More.tsx
