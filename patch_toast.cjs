const fs = require('fs');
let code = fs.readFileSync('src/components/ToastContext.tsx', 'utf-8');

code = code.replace(/const showToast = useCallback\(\(message: string\) => \{\n    setToast\(message\);\n    setTimeout\(\(\) => \{\n      setToast\(null\);\n    \}, 4000\);\n  \}, \[\]\);/, `const timeoutRef = useRef<NodeJS.Timeout | null>(null);\n  const showToast = useCallback((message: string) => {\n    setToast(message);\n    if (timeoutRef.current) {\n      clearTimeout(timeoutRef.current);\n    }\n    timeoutRef.current = setTimeout(() => {\n      setToast(null);\n    }, 4000);\n  }, []);`);

fs.writeFileSync('src/components/ToastContext.tsx', code);
