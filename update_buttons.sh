sed -i -e 's/Trophy, ChevronLeft/Trophy, ChevronLeft, Lock/g' ./src/pages/TournamentHub.tsx

sed -i -e '/<span className="hidden sm:inline">Create Tournament<\/span>/i\            {!isPro && !isAdmin && <Lock className="w-4 h-4" />}' ./src/pages/TournamentHub.tsx

sed -i -e 's/import { Trophy, ChevronLeft, MapPin, Calendar, Users, Filter, Plus, X, Loader2 } from '"'"'lucide-react'"'"';/import { Trophy, ChevronLeft, MapPin, Calendar, Users, Filter, Plus, X, Loader2, Lock } from '"'"'lucide-react'"'"';/g' ./src/components/Tournaments.tsx

sed -i -e '/<span>Create Tournament<\/span>/i\              {!isPro && !isAdmin && <Lock className="w-4 h-4" />}' ./src/components/Tournaments.tsx
