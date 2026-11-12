# Wolbrom — pakiet do akceptacji nauczyciela

> **Aktualna decyzja o publikacji (2026-11-12):** nauczycielka potwierdziła wysyłkę wszystkich aktualnych materiałów do publicznego repozytorium, także przy nieustalonych prawach. Ta decyzja zastępuje starsze wzmianki „bez publikacji” i „bez push”; nie potwierdza otwartej licencji ani końcowej akceptacji dydaktycznej.


## Uruchomienie
- Prywatny podgląd: https://ai-agent.tail53435f.ts.net/classes/4/04-wolbrom-700-lat/index.html — użyj dokładnego `index.html`.
- Offline: `04-wolbrom-700-lat-portable.html` — samowystarczalny plik, dwuklik bez serwera i internetu.
- Przewodnik: `teacher-guide.html`, również offline; zegar, scenariusz, 23 rozwijane notatki i pełne źródła.

**23 slajdy:** 20 narracyjnych, zadanie, pomoc i synteza / bilet. Bez slajdu bibliografii i bez kredytów na slajdach lub w lightboxach. Tylko użyteczne podpisy miejsca i daty; znaki wodne wewnątrz przekazanych obrazów zachowano.

**40 minut:** 15 narracji + 2 instrukcji + **16 samodzielnej pocztówki** + 3 dzielenia + 2 biletu + 2 buforu. Notatki narracji mają ciągły zegar 0:00–15:00. 18 dzieci, 18 czystych A4, kredki i ołówki. Bez drukowania, wycinania i pracy grupowej.

## Zmiana fotograficzna
Obejrzano wszystkie 10 nowych uploadów. Włączono 9 bez modyfikacji plików:
- zastąpiono zdjęcia obu dworców — dawny ma czytelny napis WOLBROM; współczesne zdjęcie zgodnie z korektą nauczyciela nie jest archiwalne;
- dawną panoramę fabryki zastąpiono wejściem i portiernią;
- Krakowska **ok. 1918** zastępuje reprodukcję tej samej sceny, nie dodaje duplikatu. Datowanie przekazane przez nauczyciela, niezależnie niezweryfikowane;
- slajd 15 `pamiec-mieszkancow`: duży pomnik na cmentarzu żydowskim i pamięć dawnych mieszkańców. **1988 na pomniku nie jest datą zdjęcia**; bez liczby ofiar do nauki;
- slajdy 16–18: `dom-kultury`, `zalew-park`, `basen` — trzy duże plansze współczesnego życia przed pocztówką i przyszłością.

Nie włączono `img_22b093232d89.jpg` (dawny drewniany kościół nad wodą): brak pewnego rekordu konkretnej fotografii potwierdzającego NMP. Nie podpisano jej jako NMP ani kaplicy cmentarnej. Pewna współczesna fotografia NMP pozostaje.

**26 użytych plików obrazu, 27 wystąpień, 25 oryginałów** (pocztówka pełna i jej kadr to jeden obiekt). Dziewięć dawnych źródeł i szesnaście nowszych fotografii. Archiwalne datowania miejskie są opisami źródła, nie niezależną ekspertyzą. Ujęć nie przedstawiamy jako zdjęć z identycznego punktu widzenia; nie utożsamiamy bez potwierdzenia budynków dworca czy fabryk. Bez AI i bez wizualizacji zalewu udających zdjęcia.

## Pochodzenie i prawa
`sources.md` oraz aktywny `assets/manifest.json` zawierają pochodzenie każdego użytego pliku. Starsze, wycofane widoki zachowano w dokumentacji jako historię rewizji, wyraźnie odróżnioną od aktywnych slajdów. Dziewięć nowych kopii ma SHA-256 sprawdzany przez QA; zachowano pełne obrazy i znaki wodne.

**Dokładne daty, autorzy i prawa zdjęć przekazanych przez nauczyciela są nieustalone** (wyjątek: przybliżone datowanie Krakowskiej podane przez nauczyciela). Współczesność sześciu zdjęć potwierdzono jego opisem / korektą, nie zgadywaniem z wyglądu. Upload nie oznacza autorstwa ani otwartej licencji. Część miejskich archiwaliów i współczesny rynek także nie mają potwierdzonych praw. Prywatna lekcja nie ma automatycznej zgody na otwartą publikację; instytucja ocenia podstawę wykorzystania dydaktycznego. Licencji Commons / Polony nie przenosimy na cały pakiet.

Galeria Naszemiasto wskazana w `sources.md` pozostaje osobnym badaniem z blokadą dostępu; ten pakiet **nie deklaruje przeglądu wszystkich stron ani liczby zdjęć galerii**.

## QA — od katalogu repozytorium
```sh
node classes/4/04-wolbrom-700-lat/build-guide.mjs
npm run check:composition -- --lesson classes/4/04-wolbrom-700-lat
node classes/4/04-wolbrom-700-lat/with-browser.mjs scripts/render-check.mjs --lesson classes/4/04-wolbrom-700-lat
PLAYWRIGHT_BROWSERS_PATH=/opt/data/history-lessons/.playwright-browsers node classes/4/04-wolbrom-700-lat/with-browser.mjs scripts/review-slides.mjs --lesson classes/4/04-wolbrom-700-lat
npm run export:portable -- --lesson classes/4/04-wolbrom-700-lat
LESSON_LIVE_URL=https://ai-agent.tail53435f.ts.net/classes/4/04-wolbrom-700-lat/index.html node classes/4/04-wolbrom-700-lat/qa.mjs
```
Bez `LESSON_LIVE_URL` QA uruchamia istniejący lokalny serwer testowy i zawsze go zamyka. `with-browser.mjs` używa istniejącego helpera Chromium; bez zmian shared i nowych zależności.

Zweryfikowane: prywatny live i rzeczywisty `file://` przy odciętym internecie, każdy w 1024×768, 1280×720, 1920×1080; wszystkie 23 slajdy i 27 obrazów w każdym przebiegu; **162 otwarcia i zamknięcia lightboxów**, dotyk, kliknięcie, klawiatura, Escape i powrót fokusu, brak podpisów źródłowych i zachowane proporcje (`object-fit: contain`). Notatki bez kolizji ze slajdem; nawigacja i przewodnik HTML offline. Zero błędów płótna, JS, HTTP oraz prób HTTP w portable. QA porównuje również bajty prywatnego podglądu z lokalnymi źródłami, eksportem, przewodnikiem i wszystkimi aktywnymi obrazami.

Dowody: `qa-report.json`; świeży przegląd `.hermes/reviews/4/04-wolbrom-700-lat/index.html`, plansza `contact.jpg`, wszystkie ujęcia slajdów oraz powiększenia dworca i pomnika w tym katalogu. Poprawione miejsca obejrzano, nie tylko zmierzono. Package-specific QA i `git diff --check` przechodzą. Bez testów całego repo przy zmianie tylko tej lekcji; bez PDF/PPTX, stagingu, commita i pushu. Akceptacja nauczyciela nadal wymagana.
