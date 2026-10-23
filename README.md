# Cestovní plánovač

Offline PWA (React + Vite). Cesty = dlaždice → Letenky/jízdenky, Ubytování, Program (dny → časová osa), Restaurace. Mapy, trasy MHD a ověření otevírací doby otevírá Google Maps.

## Jak se do aplikace vkládá obsah
1. **Přes Claude (doporučeno):** plán se domluví v chatu, Claude vytvoří/upraví `public/trips/<slug>/trip.json`, přidá soubory (vstupenky, fotky) do `public/trips/<slug>/files/`, zapíše slug do `public/trips/index.json` a zvýší `version`. Po pushi se aplikace sama nasadí na GitHub Pages.
2. **Ručně v aplikaci:** tlačítka „＋ Přidat" (data zůstávají jen v tomto zařízení; zálohujte přes ⬇ Záloha).

Struktura `trip.json`: viz `public/trips/ukazka/trip.json` a typy v `src/db/db.ts`. Přílohy: `"attachments": [{ "name": "...", "path": "trips/<slug>/files/soubor.pdf" }]`.
Při vyšší `version` se cesta v zařízení přepíše novou verzí (ruční úpravy seedované cesty se tím přepíšou).

## Offline použití
Otevřete nasazenou adresu v telefonu → „Přidat na plochu / Nainstalovat". Po prvním načtení se do cache uloží celá aplikace vč. dat, vstupenek a fotek. Google Maps odkazy potřebují připojení.

## Vývoj
`npm i && npm run dev` · `npm test` · `npm run build`
