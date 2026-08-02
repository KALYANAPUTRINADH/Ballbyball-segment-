sed -i -e 's/app.post('\''\/api\/stripe\/create-checkout-session'\'', requireAuth, async (req, res) => {/app.post('\''\/api\/stripe\/create-checkout-session'\'', requireAuth, async (req, res) => {\n  const { amount, description } = req.body;/g' ./server.ts

sed -i -e 's/name: '\''Premium Subscription'\'',/name: description || '\''Premium Subscription'\'',/g' ./server.ts

sed -i -e 's/unit_amount: 50000, \/\/ 500.00 INR/unit_amount: (amount || 49) * 100,/g' ./server.ts

sed -i -e 's/\/api\/payments\/stripe\/create-checkout-session/\/api\/stripe\/create-checkout-session/g' ./src/components/ProUpgradeModal.tsx

sed -i -e 's/\/api\/payments\/stripe\/create-checkout-session/\/api\/stripe\/create-checkout-session/g' ./src/components/MobileLayout.tsx
