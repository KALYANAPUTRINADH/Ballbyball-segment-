const fs = require('fs');
let code = fs.readFileSync('src/components/PerformanceMetrics.tsx', 'utf-8');

code = code.replace(/const cricketStrikeRateData = \[[\s\S]*?\];/g, 'const [cricketStrikeRateData, setCricketStrikeRateData] = useState<any[]>([]);');
code = code.replace(/const cricketBowlingData = \[[\s\S]*?\];/g, 'const [cricketBowlingData, setCricketBowlingData] = useState<any[]>([]);');
code = code.replace(/const footballPossessionData = \[[\s\S]*?\];/g, 'const [footballPossessionData, setFootballPossessionData] = useState<any[]>([]);');
code = code.replace(/const footballAttackingData = \[[\s\S]*?\];/g, 'const [footballAttackingData, setFootballAttackingData] = useState<any[]>([]);');
code = code.replace(/const basketballShootingData = \[[\s\S]*?\];/g, 'const [basketballShootingData, setBasketballShootingData] = useState<any[]>([]);');
code = code.replace(/const basketballStatsMap = \[[\s\S]*?\];/g, 'const [basketballStatsMap, setBasketballStatsMap] = useState<any[]>([]);');
code = code.replace(/const tennisServeData = \[[\s\S]*?\];/g, 'const [tennisServeData, setTennisServeData] = useState<any[]>([]);');
code = code.replace(/const defaultPerformanceData = \[[\s\S]*?\];/g, 'const [defaultPerformanceData, setDefaultPerformanceData] = useState<any[]>([]);');

const fetchCode = `
  useEffect(() => {
    fetch(\`/api/mock-data/performance/\${sportType}\`)
      .then(res => res.json())
      .then(data => {
        if (data.cricketStrikeRateData) setCricketStrikeRateData(data.cricketStrikeRateData);
        if (data.cricketBowlingData) setCricketBowlingData(data.cricketBowlingData);
        if (data.footballPossessionData) setFootballPossessionData(data.footballPossessionData);
        if (data.footballAttackingData) setFootballAttackingData(data.footballAttackingData);
        if (data.basketballShootingData) setBasketballShootingData(data.basketballShootingData);
        if (data.basketballStatsMap) setBasketballStatsMap(data.basketballStatsMap);
        if (data.tennisServeData) setTennisServeData(data.tennisServeData);
        if (data.defaultPerformanceData) setDefaultPerformanceData(data.defaultPerformanceData);
      })
      .catch(console.error);
  }, [sportType]);
`;

code = code.replace(/export function PerformanceMetrics\(\{[^\}]*\}\) \{/, "import { useEffect, useState } from 'react';\n$&");
code = code.replace(/export function PerformanceMetrics\(\{ sportType \} \: \{ sportType\?: string \}\) \{/, "$&\n" + fetchCode);

fs.writeFileSync('src/components/PerformanceMetrics.tsx', code);
