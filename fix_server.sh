sed -i -e 's/ws.matchId = matchId;/(ws as any).matchId = matchId;/g' ./server.ts
sed -i -e 's/client.matchId === matchId/(client as any).matchId === matchId/g' ./server.ts
