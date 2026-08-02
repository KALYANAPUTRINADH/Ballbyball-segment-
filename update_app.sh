sed -i -e '/window.addEventListener(.openPlayerProfile., handleOpenPlayerProfile);/i\
    const handleOpenProModal = (e: Event) => {\
      setShowProModal((e as CustomEvent).detail);\
    };\
    window.addEventListener('"'"'openProModal'"'"', handleOpenProModal);' ./src/App.tsx

sed -i -e '/window.removeEventListener(.openPlayerProfile., handleOpenPlayerProfile);/i\
      window.removeEventListener('"'"'openProModal'"'"', handleOpenProModal);' ./src/App.tsx
