sed -i -e '/"Tournament Hub",/d' ./src/App.tsx
sed -i -e '/"Tournaments",/d' ./src/App.tsx
sed -i -e "s/const proTabs = \['Tournaments', 'Stats', 'Performance'\];/const proTabs = \['Stats', 'Performance'\];/g" ./src/pages/MyCricket.tsx
