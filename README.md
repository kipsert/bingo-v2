# Date Night Lockout Bingo

Vieno puslapio web programėlė (be duomenų bazės) su 25 užduotimis, lockout taškų skaičiavimu, prizų atrakinimu ir duomenų išsaugojimu telefone per `localStorage`.

## Kaip paleisti lokaliai

1. Atidaryk [index.html](./index.html) naršyklėje.
2. Telefonui patogiausia naudoti hostinimą (žr. žemiau), nes tiesioginis failo atidarymas kartais ribojamas.

## Nemokamas hostinimas (rekomenduojama: GitHub Pages)

1. Susikurk naują GitHub repozitoriją.
2. Įkelk šiuos failus į `main` branch:
   - `index.html`
   - `styles.css`
   - `app.js`
3. GitHub repo lange eik į `Settings` -> `Pages`.
4. `Build and deployment` skiltyje pasirink:
   - `Source`: `Deploy from a branch`
   - `Branch`: `main` ir folder `/(root)`
5. Išsaugok. Po ~1-2 min gausi nuorodą:
   - `https://<tavo-vardas>.github.io/<repo-pavadinimas>/`
6. Atidaryk tą nuorodą telefone ir prisisek prie Home Screen.

## Alternatyvos (taip pat nemokamai)

- Netlify Drop: nutempi visus failus į https://app.netlify.com/drop ir iškart gauni URL.
- Vercel: importuoji repo, deploy automatinis.

## Pastabos naudojimui

- Bingo lenta yra viršuje, o pagrindiniai veiksmai `Užbaigti vakarą`, `Nustatymai` ir `Prizai` yra apatiniame meniu.
- `Nustatymai` lange gali keisti abiejų žaidėjų vardus.
- `Prizai` lange matai abiejų žaidėjų progresą ir atrakintus prizus.
- `Naujas raundas` išvalo lentą, bet palieka vardus.
- `Pilnas reset` išvalo viską.
- Visa būsena saugoma lokaliai konkrečiame įrenginyje/naršyklėje.
- Jei atidarysi tą patį URL kitame telefone, tai bus atskiras žaidimo state.
