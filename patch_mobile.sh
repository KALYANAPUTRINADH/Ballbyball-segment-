sed -i -e '/import { ChevronLeft/a import { ProBadge } from "./ProBadge";' ./src/components/MobileLayout.tsx

sed -i -e 's/{item.badge && (/{item.badge === "Pro (₹49\/m)" ? <ProBadge \/> : item.badge && (/g' ./src/components/MobileLayout.tsx
