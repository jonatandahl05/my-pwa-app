
npm install

npx json-server db.json --port 3000

npm run dev

på mobil:
npx json-server db.json --port 3000 --host 0.0.0.0

npm run build

npm run dev -- --host

i annan terminal skriv: ipconfig
för att hitta var den ligger, något i stil med http://192.168.1.106:5173

tester:


för specifika: npm run test:run -- src/tests/(testfile)

för alla samtidigt: npm run test:run