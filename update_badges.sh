sed -i -e 's/import { X, Plus, Search, Trophy, Shield, Users, User, ArrowRight, Play, Lock } from '"'"'lucide-react'"'"';/import { X, Plus, Search, Trophy, Shield, Users, User, ArrowRight, Play, Lock } from '"'"'lucide-react'"'"';\nimport { ProBadge } from '"'"'..\/components\/ProBadge'"'"';/g' ./src/pages/Home.tsx

sed -i -e 's/{!isPro && !isAdmin && <Lock className="w-4 h-4 text-slate-300" \/>}/<ProBadge \/>/g' ./src/pages/Home.tsx

sed -i -e 's/import { Lock } from '"'"'lucide-react'"'"';/import { Lock } from '"'"'lucide-react'"'"';\nimport { ProBadge } from '"'"'..\/components\/ProBadge'"'"';/g' ./src/pages/MyCricket.tsx

sed -i -e 's/{isProTab && !isPro && !isAdmin && <Lock className="w-3.5 h-3.5 text-slate-400" \/>}/{isProTab && <ProBadge \/>}/g' ./src/pages/MyCricket.tsx

sed -i -e 's/import { Trophy, ChevronLeft, MapPin, Calendar, Search, Plus, X, Loader2 } from '"'"'lucide-react'"'"';/import { Trophy, ChevronLeft, MapPin, Calendar, Search, Plus, X, Loader2, Lock } from '"'"'lucide-react'"'"';\nimport { ProBadge } from '"'"'..\/components\/ProBadge'"'"';/g' ./src/pages/TournamentHub.tsx

sed -i -e 's/{!isPro && !isAdmin && <Lock className="w-4 h-4" \/>}/<ProBadge className="ml-0 mr-1" \/>/g' ./src/pages/TournamentHub.tsx

sed -i -e 's/import { Trophy, ChevronLeft, MapPin, Calendar, Users, Filter, Plus, X, Loader2, Lock } from '"'"'lucide-react'"'"';/import { Trophy, ChevronLeft, MapPin, Calendar, Users, Filter, Plus, X, Loader2, Lock } from '"'"'lucide-react'"'"';\nimport { ProBadge } from '"'"'..\/components\/ProBadge'"'"';/g' ./src/components/Tournaments.tsx

sed -i -e 's/{!isPro && !isAdmin && <Lock className="w-4 h-4" \/>}/<ProBadge className="ml-0 mr-1" \/>/g' ./src/components/Tournaments.tsx
