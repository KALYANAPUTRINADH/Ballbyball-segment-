const fs = require('fs');

let content = fs.readFileSync('src/components/TeamChat.tsx', 'utf8');

// I will just use a precise regex to replace the fetchTeams content.
content = content.replace(/async function fetchTeams\(\) \{[^]+?\}\n    \}/, `async function fetchTeams() {
      if (!currentUser?.phoneNumber) {
        setLoading(false);
        return;
      }
      try {
        const allPlayers = await dbService.getAll('players');
        const myPlayers = allPlayers.filter((p: any) => p.mobileNumber === currentUser.phoneNumber);
        const tIds = myPlayers.map((p: any) => p.teamId).filter(Boolean);
            
        if (tIds.length > 0) {
          const allTeams = await dbService.getAll('teams');
          const myTeams = allTeams.filter((t: any) => tIds.includes(t.id));
          setTeams(myTeams);
          if (myTeams.length > 0) {
            setActiveTeam(myTeams[0]);
          }
        }
      } catch (error) {
        console.warn('Error fetching teams:', error);
      } finally {
        setLoading(false);
      }
    }`);

fs.writeFileSync('src/components/TeamChat.tsx', content);
