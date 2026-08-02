import React from 'react';
import { 
  LayoutGrid, 
  Target, 
  Goal, 
  Dribbble, 
  Volleyball, 
  Circle, 
  Feather, 
  Swords, 
  Disc, 
  Activity,
  Trophy
} from 'lucide-react';

interface SportIconProps {
  sport: string;
  className?: string;
}

export function SportIcon({ sport, className = "w-4 h-4" }: SportIconProps) {
  switch (sport) {
    case 'All': return <LayoutGrid className={className} />;
    case 'Cricket': return <Target className={className} />;
    case 'Football': return <Goal className={className} />;
    case 'Basketball': return <Dribbble className={className} />;
    case 'Volleyball': return <Volleyball className={className} />;
    case 'Tennis': return <Circle className={className} />;
    case 'Hockey': return <Swords className={className} />;
    case 'Badminton': return <Feather className={className} />;
    case 'Table Tennis': return <Disc className={className} />;
    case 'Pickleball': return <Activity className={className} />;
    default: return <Trophy className={className} />;
  }
}
