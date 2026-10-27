# Wolbrom — pakiet do akceptacji nauczyciela

## Uruchomienie
- Live: https://ai-agent.tail53435f.ts.net/classes/4/04-wolbrom-700-lat/index.html — wymagany dokładny `index.html`; katalog z końcowym `/` może zwracać 404.
- Offline: `04-wolbrom-700-lat-portable.html` — jeden samowystarczalny plik, otwierany dwuklikiem, bez serwera i internetu.
- Przewodnik: `teacher-guide.html`, również lokalnie i offline. Zawiera zegar, cały scenariusz, rozwijane notatki oraz pełne źródła i prawa.

17 slajdów: 13 narracyjnych, zadanie, pomoc, synteza / bilet i zaplecze źródłowe. 15 minut narracji + 2 instrukcji + 16 samodzielnej pracy + 3 dzielenia + 2 biletu + 2 buforu = 40 minut. 18 dzieci, 18 czystych A4, kredki i ołówki. Bez wydruków, wycinania i pracy grupowej.

## Treść i źródła
16 autentycznych oryginałów w 17 plikach obrazu (pocztówka pełna i jej kadr to jeden oryginał). Pięć dawnych źródeł: rynek 1912, fotografia 1916, drukowana pocztówka wydana 1918–1939, panorama lat 70. i dawna fabryka. Wszystkie użyte obrazy obejrzano. Pary dotyczą potwierdzonego rynku i kościoła Katarzyny, nie identycznego punktu widzenia. Dwóch fabryk nie utożsamiamy.

Per-image dokumentacja: `sources.md` i `assets/manifest.json`. Pełne wpisy są także w notatkach ostatniego slajdu pliku portable. Daty nieustalone są oznaczone; daty miejskich załączników nie są traktowane jako niezależna ekspertyza. Panorama udostępniona w 2009 nie ma pewnej daty wykonania. Mural to współczesne upamiętnienie. Map projektu / wizualizacji zalewu nie wykorzystano jako fotografii. Bez AI.

**Prawa miejskich archiwaliów i jednego współczesnego rynku są nieustalone — to nie CC. Pakiet prywatnej lekcji nie ma zgody na otwartą publikację.** Instytucja ocenia podstawę wykorzystania dydaktycznego. Commons i Polona mają indywidualne wpisy praw; nie przenosimy ich licencji na cały pakiet.

## QA — polecenia od katalogu repozytorium
```sh
node classes/4/04-wolbrom-700-lat/build-guide.mjs
npm run check:composition -- --lesson classes/4/04-wolbrom-700-lat
node classes/4/04-wolbrom-700-lat/with-browser.mjs scripts/render-check.mjs --lesson classes/4/04-wolbrom-700-lat
node classes/4/04-wolbrom-700-lat/with-browser.mjs scripts/review-slides.mjs --lesson classes/4/04-wolbrom-700-lat
npm run export:portable -- --lesson classes/4/04-wolbrom-700-lat
LESSON_LIVE_URL=https://ai-agent.tail53435f.ts.net/classes/4/04-wolbrom-700-lat/index.html node classes/4/04-wolbrom-700-lat/qa.mjs
```
Bez `LESSON_LIVE_URL` test uruchamia lokalny serwer testowy, korzystając z istniejącego helpera repozytorium, i zawsze go zamyka. `with-browser.mjs` wykorzystuje istniejące `localChromiumExecutable`, bez twardego adresu binarki i bez zmian shared.

Zweryfikowane: live na rzeczywistym prywatnym adresie i `file://` z odciętym internetem, 1024×768, 1280×720, 1920×1080; 17 slajdów w każdym przebiegu; 102 otwarcia i zamknięcia lightboxów bez podpisów źródłowych; komplet obrazów; notatki i brak kolizji ich panelu ze slajdem; nawigacja; przewodnik HTML offline. Zero błędów płótna, JS, HTTP oraz prób HTTP w portable. Raport: `qa-report.json`.

Screenshoty i pełny przegląd: `.hermes/reviews/4/04-wolbrom-700-lat/index.html`; arkusz: `contact.jpg` w tym katalogu. Test jest package-specific; nie uruchamiano całego repo ani testów innych, nieśledzonych lekcji. Nie utworzono PDF/PPTX, commita ani pushu. Akceptacja nauczyciela nadal wymagana.
