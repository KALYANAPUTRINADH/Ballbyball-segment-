sed -i -e 's/onClick={() => setShowTermsModal(true)}/onClick={() => window.location.href = "?page=terms"}/g' ./src/pages/Profile.tsx

sed -i -e 's/} else if (\["Terms of Service", "Privacy Policy"\].includes(label)) {/} else if (label === "Terms of Service") {\n      window.location.href = "?page=terms";\n    } else if (label === "Privacy Policy") {\n      window.location.href = "?page=privacy";/g' ./src/pages/More.tsx
