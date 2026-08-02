import { useEffect } from 'react';

export function AdSenseLoader() {
  useEffect(() => {
    fetch('/api/publisher-config')
      .then(res => res.json())
      .then(data => {
        if (data.clientId) {
          const script = document.createElement('script');
          script.async = true;
          script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${data.clientId}`;
          script.crossOrigin = 'anonymous';
          document.head.appendChild(script);
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
