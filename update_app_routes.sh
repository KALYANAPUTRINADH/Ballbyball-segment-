sed -i -e '/import DeleteAccountPolicy from ".\/pages\/DeleteAccountPolicy";/a\
import RefundPolicy from "./pages/RefundPolicy";\
import TermsOfService from "./pages/TermsOfService";' ./src/App.tsx

sed -i -e '/if (typeof window !== '"'"'undefined'"'"' && new URLSearchParams(window.location.search).get('"'"'page'"'"') === '"'"'delete-account'"'"') {/i\
  if (typeof window !== '"'"'undefined'"'"' && new URLSearchParams(window.location.search).get('"'"'page'"'"') === '"'"'refund-policy'"'"') {\
    return <RefundPolicy />;\
  }\
\
  if (typeof window !== '"'"'undefined'"'"' && new URLSearchParams(window.location.search).get('"'"'page'"'"') === '"'"'terms'"'"') {\
    return <TermsOfService />;\
  }' ./src/App.tsx
