# Początek zimnej wojny — przebudowana wersja prywatna

Klasa VIII, 2026/2027, **45 intensywnych minut**, `new-knowledge` / `slides`. 31 slajdów: pełny zakres podręcznikowych s. 96–101 i ograniczony blok s. 102–103, pięciogałęziowa notatka skutków na początku, Poczdam i mapy, Norymberga, ONZ, sowietyzacja, pełny cytat Churchilla i cały dostarczony fragment art. 5 NATO, Truman/Marshall, Berlin, NATO, RFN/NRD i mur. Jedna rozbudowana notatka, ustne rozmowy i indywidualna pauza — bez par i bez druku.

- `slides.md`, `lesson.css`, `index.html`: kanoniczny edytowalny pakiet na istniejącym runtime; lokalne fotografie i źródłowe mapy.
- `lesson.md`, `teacher-guide.md`: identyczna kolejność i budżet 44,5 + 0,5 min; wybrany film National Geographic 3:10 w rdzeniu, przed budową muru; alternatywa TED-Ed pozostaje propozycją.
- `student-summary.md`: samodzielne wyjaśnienia po lekcji; `assessment.md`: klucz pauzy i osobny test powtórkowy 20 pkt.
- `worksheet.md`: administracyjna informacja, że niczego nie drukujemy.
- `sources.md`, `source-manifest.json`: pełne pochodzenie, daty, licencje i SHA-256 wybranych mediów, ograniczenia prawne.
- `reflection.md`: rzeczywiste uwagi nauczyciela oraz pytania do obserwacji klasowej, nie wymyślone wyniki.
- `qa.mjs`: istniejący runner po stabilnych ID; `qa/author-check.json` i `qa/contact-sheet.png` — aktualny raport i plansza. Świeże osobne ujęcia: `/opt/data/history-production/grade8/two-textbooks-2026-11-19/lesson13/current/`. `qa/review/` i stare logi render/review są archiwum poprzedniej rewizji, nie dowodem aktualnej poprawki.

## Otwieranie i kontrole
Kanoniczny `index.html` działa przez istniejący serwer pod `/classes/8/13-poczatek-zimnej-wojny/`; ładuje Markdown lokalnym HTTP. Prywatny `poczatek-zimnej-wojny-dwa-podreczniki-portable.html` działa samodzielnie przez `file://`, bez serwera; tylko film po kliknięciu wymaga Internetu. To ignorowany artefakt do przeglądu, nie zgoda na publikację.

Z repozytorium: `node classes/8/13-poczatek-zimnej-wojny/qa.mjs`. Runner obejmuje strukturę i kontrakt, porównanie pełnego cytatu z transkrypcją, sumę czasu, SHA mediów, pełną sekwencję z geometrią i offline portable. Świeże ujęcia i geometria obejmują całą sekwencję; interakcje obejmują wszystkie obrazy oraz launcher wybranego filmu. Automatyczny raport nie udaje oględzin autora; osobny raport QA zapisuje faktycznie obejrzane ujęcia. Wynik: `/opt/data/history-production/grade8/two-textbooks-2026-11-19/lesson13/author-review.json`.

Strzałki — nawigacja; S — notatki; B — wygaszenie; klik, Enter lub dotknięcie obrazu — powiększenie; Escape — zamknięcie i powrót fokusu.

## Status i ograniczenia
Nauczyciel przejrzał poprzednią wersję (`teacher_reviewed=true`), ale nowej nie zaakceptował (`teacher_accepted=false`). `source_reviewed=false` nie udaje formalnej niezależnej akceptacji. Komplet stron 96–101 oraz pełny tekst i podpisy s. 102–103 były dostępne i sprawdzone. Dwa nowe kadry ze s. 102–103 mają nieustalone prawa i ograniczoną rozdzielczość. Czas nie jest jeszcze sprawdzony w klasie. Nie wygenerowano PDF/PPTX.

Nauczycielka zleciła wysłanie tej bieżącej wersji do istniejącego publicznego remote wraz z drugim pakietem VIII. Zgoda na wysłanie nie rozstrzyga praw: GHDI ma ograniczenia dalszej publikacji, Omniatlas nie ma ustalonej otwartej licencji. Rekordy praw pozostają w sources.md. Starsze eksporty zachowano lokalnie; do publikacji wybrano tylko aktualny portable. Wszystkie media są autentyczne, bez AI; kompozycja notatki to tekst HTML/CSS, nie wygenerowana ilustracja. Faktyczne wykonanie pushu jest weryfikowane oddzielnie.

Slajd 21: cały dostarczony fragment art. 5; slajd 25: film uruchamiany kliknięciem; slajd 26: budowa i cel muru. Link awaryjny otwiera YouTube. Plan zachowuje 45 min kosztem krótszego komentarza do wybranych wcześniejszych tabel; 6 min zapisu i 3 min sprawdzenia bez zmian. Pełna ocena filmu i granice sprawdzenia w przewodniku; są w nim współczesne wypowiedzi do kamery.
