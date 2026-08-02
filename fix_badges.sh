sed -i -e 's/import { Trophy, ChevronLeft, Lock/import { Trophy, ChevronLeft, Lock/g' ./src/pages/TournamentHub.tsx
sed -i -e '/import { Trophy, ChevronLeft, Lock/a import { ProBadge } from "../components/ProBadge";' ./src/pages/TournamentHub.tsx

sed -i -e 's/{!isPro && !isAdmin && <Lock className="w-4 h-4" \/>}/<ProBadge className="ml-0 mr-1" \/>/g' ./src/pages/TournamentHub.tsx

sed -i -e '/import { Trophy, Plus/a import { ProBadge } from "../components/ProBadge";' ./src/components/Tournaments.tsx

sed -i -e 's/{!isPro && !isAdmin && <Lock className="w-4 h-4" \/>}/<ProBadge className="ml-0 mr-1" \/>/g' ./src/components/Tournaments.tsx
