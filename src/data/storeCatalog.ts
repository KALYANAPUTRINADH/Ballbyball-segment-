import heroCricketImg from '../assets/images/store_hero_cricket_1794831346368.jpg';
import batImg from '../assets/images/product_english_willow_bat_1794831347340.jpg';
import kitBagImg from '../assets/images/product_cricket_kit_bag_1794831346884.jpg';
import multisportImg from '../assets/images/product_multisport_gear_1794831347753.jpg';
import indoorGamesImg from '../assets/images/product_indoor_games_gear_1794831348580.jpg';
import type { StoreDomain } from '../types/store';

export const STORE_HERO_IMAGE = heroCricketImg;

export const STORE_PRIMARY_DOMAINS: StoreDomain[] = [
  'Cricket',
  'Team Sports',
  'Racket & Court',
  'Fitness & Athletics',
  'Indoor & Board Games',
  'Esports & Gaming',
];

export const STORE_PRESET_IMAGES = [
  { label: 'Multi-Sport Gear (Badminton, Football, Basketball)', url: multisportImg },
  { label: 'Indoor & Tabletop Games (TT, Pickleball, Carrom)', url: indoorGamesImg },
  { label: 'English Willow Cricket Bat', url: batImg },
  { label: 'Pro Kit Bag & Protective Gear', url: kitBagImg },
  { label: 'Match Gear Showcase', url: heroCricketImg },
];

export const STORE_CATEGORIES_BY_DOMAIN: Record<string, string[]> = {
  Cricket: [
    'Bats',
    'Protective Gear',
    'Cricket Balls',
    'Kit Bags & Footwear',
    'Jerseys & Apparel',
    'Broadcast & Tech',
  ],
  'Team Sports': [
    'Match Balls & Pucks',
    'Goals, Hoops & Nets',
    'Sticks, Bats & Guards',
    'Footwear & Cleats',
    'Team Jerseys & Kits',
    'Training Cones & Agility',
  ],
  'Racket & Court': [
    'Rackets & Paddles',
    'Shuttlecocks & Balls',
    'Strings, Grips & Overgrips',
    'Court Shoes & Bags',
    'Nets & Court Accessories',
  ],
  'Fitness & Athletics': [
    'Strength & Weights',
    'Boxing & Combat Gear',
    'Running & Track Footwear',
    'Swimming & Aquatics',
    'Cycling & Helmets',
    'Yoga, Recovery & Mobility',
  ],
  'Indoor & Board Games': [
    'Table Tennis',
    'Carrom & Strikers',
    'Chess & Strategy Boards',
    'Billiards, Pool & Snooker',
    'Darts & Dartboards',
    'Foosball & Air Hockey',
    'Board, Card & Tabletop Games',
  ],
  'Esports & Gaming': [
    'Controllers & Gamepads',
    'Racing Wheels & Sim Gear',
    'Gaming Headsets & Audio',
    'Keyboards, Mice & Pads',
    'Team Esports Jerseys',
  ],
  Sports: [
    'Match Balls & Pucks',
    'Rackets & Paddles',
    'Football & Basketball',
    'Racket Sports',
    'Field & Training',
  ],
  'Indoor & Games': [
    'Table Tennis',
    'Carrom & Chess',
    'Pickleball & Dartboards',
    'Billiards & Tabletop Games',
  ],
};

export const STORE_SPORTS_BY_DOMAIN: Record<string, string[]> = {
  Cricket: ['Cricket', 'Indoor Cricket', 'Box & Tape Ball Cricket'],
  'Team Sports': [
    'Football',
    'Basketball',
    'Volleyball',
    'Field Hockey',
    'Ice Hockey',
    'Baseball',
    'Softball',
    'Rugby',
    'American Football',
    'Handball',
    'Kabaddi',
    'Lacrosse',
  ],
  'Racket & Court': [
    'Badminton',
    'Tennis',
    'Pickleball',
    'Table Tennis',
    'Squash',
    'Padel',
    'Racquetball',
  ],
  'Fitness & Athletics': [
    'Gym & Strength',
    'Running & Athletics',
    'Boxing & MMA',
    'Swimming & Aquatics',
    'Cycling',
    'Golf',
    'Skating & Skateboarding',
    'Yoga & Mobility',
  ],
  'Indoor & Board Games': [
    'Carrom',
    'Chess',
    'Billiards & Snooker',
    'Darts',
    'Foosball',
    'Air Hockey',
    'Board & Card Games',
    'Ludo & Classic Tabletop',
  ],
  'Esports & Gaming': [
    'Console & PC Gaming',
    'Sim Racing',
    'Mobile Esports',
    'VR Sports',
  ],
  Sports: ['Football', 'Basketball', 'Badminton', 'Tennis', 'Volleyball', 'Hockey'],
  'Indoor & Games': ['Table Tennis', 'Carrom', 'Chess', 'Pickleball', 'Darts', 'Billiards & Snooker'],
};

export const ALL_STORE_SPORTS: string[] = Array.from(
  new Set(Object.values(STORE_SPORTS_BY_DOMAIN).flat())
).sort();

export const SIDEBAR_FEATURED_SPORTS: string[] = [
  'Cricket',
  'Football',
  'Tennis',
  'Basketball',
  'Badminton',
  'Table Tennis',
  'Pickleball',
  'Carrom',
  'Chess',
  'Gym & Strength',
  'Console & PC Gaming',
];

export const SIDEBAR_FEATURED_CATEGORIES: string[] = [
  'Bats',
  'Balls',
  'Safety Equipment',
  'Rackets & Paddles',
  'Kit Bags & Footwear',
  'Jerseys & Apparel',
  'Goals, Hoops & Nets',
  'Indoor & Tabletop',
  'Fitness & Training',
  'Broadcast & Tech',
];

export function normalizeSportLabel(sport: string): string {
  const s = (sport || '').trim();
  if (/^football\s*(\(soccer\))?$/i.test(s) || s.toLowerCase() === 'soccer') return 'Football';
  return s;
}

export function matchesStoreSport(productSport: string | undefined, selectedSport: string): boolean {
  if (!selectedSport || selectedSport === 'All') return true;
  const prod = normalizeSportLabel(productSport || '').toLowerCase();
  const sel = normalizeSportLabel(selectedSport).toLowerCase();
  if (!prod) return false;
  if (prod === sel) return true;
  if (sel === 'cricket' && prod.includes('cricket')) return true;
  if (sel === 'football' && (prod.includes('football') && !prod.includes('american') || prod.includes('soccer'))) return true;
  return false;
}

const CATEGORY_ALIASES: Record<string, string[]> = {
  bats: ['bats', 'cricket bats', 'sticks, bats & guards'],
  balls: ['balls', 'cricket balls', 'match balls & pucks', 'shuttlecocks & balls'],
  'safety equipment': ['safety equipment', 'protective gear', 'boxing & combat gear', 'cycling & helmets', 'sticks, bats & guards'],
  'rackets & paddles': ['rackets & paddles', 'strings, grips & overgrips'],
  'kit bags & footwear': ['kit bags & footwear', 'footwear & cleats', 'court shoes & bags', 'running & track footwear'],
  'jerseys & apparel': ['jerseys & apparel', 'team jerseys & kits', 'team esports jerseys'],
  'goals, hoops & nets': ['goals, hoops & nets', 'nets & court accessories'],
  'indoor & tabletop': [
    'indoor & tabletop',
    'table tennis',
    'carrom & strikers',
    'carrom & chess',
    'chess & strategy boards',
    'billiards, pool & snooker',
    'billiards & tabletop games',
    'darts & dartboards',
    'pickleball & dartboards',
    'foosball & air hockey',
    'board, card & tabletop games',
  ],
  'fitness & training': [
    'fitness & training',
    'strength & weights',
    'training cones & agility',
    'yoga, recovery & mobility',
    'swimming & aquatics',
    'field & training',
  ],
  'broadcast & tech': [
    'broadcast & tech',
    'controllers & gamepads',
    'racing wheels & sim gear',
    'gaming headsets & audio',
    'keyboards, mice & pads',
  ],
};

export function matchesStoreCategory(productCategory: string | undefined, selectedCategory: string): boolean {
  if (!selectedCategory || selectedCategory === 'All') return true;
  const prod = (productCategory || '').trim().toLowerCase();
  const sel = selectedCategory.trim().toLowerCase();
  if (!prod) return false;
  if (prod === sel) return true;
  const aliases = CATEGORY_ALIASES[sel];
  if (aliases && aliases.includes(prod)) return true;
  return false;
}

export const STORE_BRANDS = [
  'SG',
  'SS',
  'MRF',
  'Kookaburra',
  'DSC',
  'Gray-Nicolls',
  'Nike',
  'Adidas',
  'Puma',
  'Wilson',
  'Spalding',
  'Babolat',
  'Head',
  'Yonex',
  'Li-Ning',
  'Victor',
  'Nivia',
  'Cosco',
  'Mikasa',
  'Molten',
  'Butterfly',
  'Stag',
  'Joola',
  'Selkirk',
  'Speedo',
  'Winmau',
  'Logitech G',
  'Razer',
  'Streamlify',
];

export const CRICKET_BAT_SIZE_GUIDE = [
  { size: 'Size 3', height: '4\'3" - 4\'6" (129 - 137 cm)', age: '7 - 8 yrs', length: '29.75"' },
  { size: 'Size 4', height: '4\'6" - 4\'9" (137 - 144 cm)', age: '8 - 9 yrs', length: '30.50"' },
  { size: 'Size 5', height: '4\'9" - 5\'0" (144 - 152 cm)', age: '10 - 11 yrs', length: '31.25"' },
  { size: 'Size 6', height: '5\'0" - 5\'3" (152 - 160 cm)', age: '11 - 12 yrs', length: '32.00"' },
  { size: 'Harrow', height: '5\'3" - 5\'7" (160 - 170 cm)', age: '12 - 14 yrs', length: '32.75"' },
  { size: 'SH (Short Handle)', height: '5\'7" - 6\'2" (170 - 188 cm)', age: 'Adult Standard', length: '33.50"' },
  { size: 'LH (Long Handle)', height: '6\'2"+ (188+ cm)', age: 'Tall Adult', length: '34.30"' },
];

export const TEAM_BALL_SIZE_GUIDE = [
  { sport: 'Football (Soccer)', size: 'Size 3 / 4 / 5', spec: 'Size 3 (U-8), Size 4 (Ages 8–12 & Futsal), Size 5 (FIFA Standard 13+)' },
  { sport: 'Basketball', size: 'Size 5 / 6 / 7', spec: 'Size 5 (Youth 27.5"), Size 6 (Women & 3x3 28.5"), Size 7 (Men Pro 29.5")' },
  { sport: 'Volleyball', size: 'Size 4 / 5', spec: 'Size 4 (Youth Soft-Touch), Size 5 (FIVB Official Indoor & Beach 65–67cm)' },
  { sport: 'Rugby / American Football', size: 'Size 3 / 4 / 5 / Official', spec: 'Youth Junior Sizes 3–4, Full Match Size 5 / Official Pro' },
];

export const RACKET_GRIP_SIZE_GUIDE = [
  { sport: 'Badminton', size: '3U / 4U / 5U · G4 / G5', spec: '3U (85–89g Power), 4U (80–84g All-Round), G5 (Slim Grip), G4 (Medium Grip)' },
  { sport: 'Tennis', size: 'L1 - L4 (4 1/8" - 4 1/2")', spec: 'L1 (4 1/8" Junior/Small), L2 (4 1/4" Standard), L3 (4 3/8" Adult), L4 (4 1/2" Large)' },
  { sport: 'Pickleball', size: '13mm / 16mm Core', spec: '13–14mm (Fast Pop & Power), 16mm (Control, Spin & Soft Touch)' },
  { sport: 'Table Tennis', size: 'FL / ST / AN Handle', spec: 'FL (Flared All-Round), ST (Straight Defensive), AN (Anatomic Grip)' },
];

export const APPAREL_SIZE_GUIDE = [
  { size: 'XS / S', chest: '34" - 38" (86 - 96 cm)', waist: '28" - 31"', fit: 'Youth / Athletic Slim' },
  { size: 'M', chest: '38" - 40" (96 - 102 cm)', waist: '31" - 33"', fit: 'Regular Match Fit' },
  { size: 'L', chest: '40" - 42" (102 - 107 cm)', waist: '33" - 35"', fit: 'Regular Match Fit' },
  { size: 'XL', chest: '42" - 45" (107 - 114 cm)', waist: '36" - 38"', fit: 'Relaxed Athletic' },
  { size: '2XL / 3XL', chest: '46" - 52" (117 - 132 cm)', waist: '39" - 44"', fit: 'Pro Relaxed Cut' },
];

export const INDOOR_BOARD_SIZE_GUIDE = [
  { game: 'Carrom', edition: 'Club 29" / Tournament 32"', spec: 'Full 32"x32" playing surface with 8mm–16mm Birch/Rosewood ply frame' },
  { game: 'Chess', edition: 'FIDE Tournament Staunton', spec: '3.75" (95mm) Weighted King on 2.25" square vinyl, wood, or silicone roll-up board' },
  { game: 'Darts', edition: 'Official 18" Bristle Board', spec: '17.75"–18" sisal bristle tournament diameter, staple-free spider wiring' },
  { game: 'Billiards & Snooker', edition: '57"–58" Ash / Maple Cue', spec: '9.5mm–10mm tip (Snooker) or 12.5mm–13mm tip (8/9-Ball Pool)' },
];
