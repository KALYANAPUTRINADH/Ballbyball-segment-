export interface LocationItem {
  name: string;
  category: 'US City' | 'US State' | 'US Venue' | 'India' | 'International';
  state?: string;
}

export const USA_STATES = [
  "Alabama (AL)", "Alaska (AK)", "Arizona (AZ)", "Arkansas (AR)", "California (CA)",
  "Colorado (CO)", "Connecticut (CT)", "Delaware (DE)", "Florida (FL)", "Georgia (GA)",
  "Hawaii (HI)", "Idaho (ID)", "Illinois (IL)", "Indiana (IN)", "Iowa (IA)",
  "Kansas (KS)", "Kentucky (KY)", "Louisiana (LA)", "Maine (ME)", "Maryland (MD)",
  "Massachusetts (MA)", "Michigan (MI)", "Minnesota (MN)", "Mississippi (MS)", "Missouri (MO)",
  "Montana (MT)", "Nebraska (NE)", "Nevada (NV)", "New Hampshire (NH)", "New Jersey (NJ)",
  "New Mexico (NM)", "New York (NY)", "North Carolina (NC)", "North Dakota (ND)", "Ohio (OH)",
  "Oklahoma (OK)", "Oregon (OR)", "Pennsylvania (PA)", "Rhode Island (RI)", "South Carolina (SC)",
  "South Dakota (SD)", "Tennessee (TN)", "Texas (TX)", "Utah (UT)", "Vermont (VT)",
  "Virginia (VA)", "Washington (WA)", "West Virginia (WV)", "Wisconsin (WI)", "Wyoming (WY)"
];

export const USA_CITIES = [
  "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ",
  "Philadelphia, PA", "San Antonio, TX", "San Diego, CA", "Dallas, TX", "San Jose, CA",
  "Austin, TX", "Jacksonville, FL", "Fort Worth, TX", "Columbus, OH", "Charlotte, NC",
  "Indianapolis, IN", "San Francisco, CA", "Seattle, WA", "Denver, CO", "Washington, DC",
  "Boston, MA", "El Paso, TX", "Nashville, TN", "Oklahoma City, OK", "Las Vegas, NV",
  "Detroit, MI", "Portland, OR", "Memphis, TN", "Louisville, KY", "Milwaukee, WI",
  "Baltimore, MD", "Albuquerque, NM", "Tucson, AZ", "Mesa, AZ", "Fresno, CA",
  "Sacramento, CA", "Atlanta, GA", "Kansas City, MO", "Colorado Springs, CO", "Omaha, NE",
  "Raleigh, NC", "Miami, FL", "Virginia Beach, VA", "Long Beach, CA", "Oakland, CA",
  "Minneapolis, MN", "Tampa, FL", "Tulsa, OK", "Arlington, TX", "New Orleans, LA",
  "Wichita, KS", "Cleveland, OH", "Orlando, FL", "Bakersfield, CA", "Aurora, CO",
  "Anaheim, CA", "Honolulu, HI", "Santa Ana, CA", "Riverside, CA", "Corpus Christi, TX",
  "Lexington, KY", "Stockton, CA", "Henderson, NV", "Saint Paul, MN", "St. Louis, MO",
  "Cincinnati, OH", "Pittsburgh, PA", "Greensboro, NC", "Anchorage, AK", "Plano, TX",
  "Lincoln, NE", "Irvine, CA", "Newark, NJ", "Durham, NC", "Chula Vista, CA",
  "Toledo, OH", "Fort Wayne, IN", "St. Petersburg, FL", "Laredo, TX", "Jersey City, NJ",
  "Chandler, AZ", "Madison, WI", "Lubbock, TX", "Scottsdale, AZ", "Reno, NV",
  "Buffalo, NY", "Gilbert, AZ", "Glendale, AZ", "North Las Vegas, NV", "Winston-Salem, NC",
  "Chesapeake, VA", "Norfolk, VA", "Fremont, CA", "Garland, TX", "Irving, TX"
];

export const USA_CRICKET_VENUES = [
  "Grand Prairie Stadium, Dallas TX",
  "Central Broward Park Stadium, Lauderhill FL",
  "Church Street Park, Morrisville NC",
  "Oaks Park Cricket Ground, San Jose CA",
  "Moosa Stadium, Pearland TX",
  "Leo Magnus Cricket Complex, Los Angeles CA",
  "Indianapolis World Sports Park, IN",
  "Nassau County International Cricket Stadium, NY",
  "Woodley Cricket Field, Van Nuys CA",
  "Kenilworth Park Ground, Washington DC",
  "Prairie View Cricket Complex, Houston TX",
  "Basking Ridge Cricket Ground, NJ",
  "Fremont Cricket Oval, CA",
  "Fairfield Cricket Park, CT"
];

export const INDIA_CITIES = [
  "Hyderabad", "Mumbai", "Bengaluru", "Delhi NCR", "Chennai", "Kolkata",
  "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Chandigarh", "Kochi",
  "Visakhapatnam", "Indore", "Nagpur", "Surat", "Vadodara", "Coimbatore"
];

export const INTERNATIONAL_CITIES = [
  "London, UK", "Melbourne, Australia", "Sydney, Australia", "Toronto, Canada",
  "Vancouver, Canada", "Dubai, UAE", "Singapore", "Auckland, New Zealand",
  "Johannesburg, South Africa", "Dhaka, Bangladesh", "Colombo, Sri Lanka",
  "Karachi, Pakistan", "Port of Spain, Trinidad"
];

export const ALL_LOCATIONS: LocationItem[] = [
  ...USA_CRICKET_VENUES.map(name => ({ name, category: 'US Venue' as const })),
  ...USA_CITIES.map(name => ({ name, category: 'US City' as const })),
  ...USA_STATES.map(name => ({ name, category: 'US State' as const })),
  ...INDIA_CITIES.map(name => ({ name, category: 'India' as const })),
  ...INTERNATIONAL_CITIES.map(name => ({ name, category: 'International' as const }))
];

export const POPULAR_LOCATIONS = [
  "Dallas, TX",
  "Los Angeles, CA",
  "New York, NY",
  "San Jose, CA",
  "Miami, FL",
  "Houston, TX",
  "Chicago, IL", "Grand Prairie Stadium, Dallas TX",
  "Central Broward Park, Lauderhill FL",
  "Hyderabad", "Mumbai", "London, UK"
];
