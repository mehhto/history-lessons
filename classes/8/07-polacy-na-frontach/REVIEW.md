# Przegląd · wersja 2, osiem teczek
Materiały do akceptacji, bez obowiązkowej prezentacji. Osiem krótkich teczek zastępuje dawny pakiet; nie jest dodatkiem do niego. Kolejność: 303, Maczek, Anders, Marynarka, Berling, Sosabowski, Karpaccy, Podhalańscy.

## Generowanie i kontrola
Z katalogu głównego repozytorium, przy istniejących zależnościach:
```bash
node classes/8/07-polacy-na-frontach/build-review.mjs --output /opt/data/cache/scratch/polacy-fronty-v2-review
node scripts/with-local-playwright.mjs test/polacy-fronty-browser.test.mjs
node --test test/polacy-fronty-dossiers.test.mjs
npm run check -- --allow-pending
```
Lokalny eksporter odtwarza mapy z Natural Earth i wbudowuje wszystkie obrazy. Nie używaj samego `export:print`: nie obejmuje dodatkowych teczek ani map. Nie eksportuj PDF/PPTX przed akceptacją. Istniejące `worksheet.pdf`, `teacher-guide.pdf` i `student-summary.pdf` są nieaktualne i nie należą do wersji 2.

## Gotowe pliki · 16 samodzielnych HTML
- `teczka-1-v2-review.html` do `teczka-8-v2-review.html`: po jednej zaprojektowanej stronie A4 i jednej fotografii.
- `wszystkie-teczki-v2-review.html`: ten sam komplet 8 A4. Drukuj komplet **albo** osiem osobnych teczek, nie oba warianty.
- `karta-pracy-v2-review.html`: jedna jednostronna A4 na ucznia; pięć pól, mapa do własnych oznaczeń i bilet.
- `mapa-wspolna-a3-v2-review.html`: jedna A3 poziomo na tablicę, uczniowie wpisują numery przy miejscach.
- `mapa-ekran-v2-review.html`: ta sama mapa do opcjonalnego projektora, pełny ekran F11. Nie edytor map i nie obowiązkowa prezentacja.
- `scenariusz-v2-review.html`: 4 projektowane A4 z gotowymi słowami „Powiedz”, działaniami „Uczniowie / Ty”, przygotowaniem, grupowaniem i pomocą.
- `klucz-v2-review.html`: 3 A4, tylko nauczyciel; pięć pól dla wszystkich ośmiu, pytania śledczych, fotografia, mapa i bilet.
- `mapa-klucz-a3-v2-review.html`: osobna A3 z przyporządkowaniami, tylko nauczyciel.
- `podsumowanie-v2-review.html`: 1 A4 po lekcji.

## Druk i prowadzenie
Otwieranie dwuklikiem, internet niepotrzebny. Papier A4 pionowo lub A3 poziomo zgodnie z nazwą pliku, skala 100%, marginesy 10 mm z CSS, bez nagłówków i stopek przeglądarki. Zacznij od wydruku próbnego; fotografie nie wymagają koloru.

35 minut: **4 + 3 + 13 + 7 + 5 + 3**. Osiem raportów po 30 sekund = 4 min mowy i 3 min na wskazanie, oznaczenia, przejścia i korekty. Jedna grupa bada jedną teczkę, bez rotacji; każdy ma własną kartę i uzupełnia mapę o wszystkie raporty. Podstawowy wariant 16–24 uczniów w ośmiu zespołach 2–3-osobowych, inne liczebności w scenariuszu. Nie przenosimy liczebności z klasy VII.

## Weryfikacja i ograniczenia
Testy lokalne: 8 teczek/zdjęć, osiem pytań śledczych, opisy 107–111 słów, pięć pól, kolejność przypadków i klucza, 35 min, źródła i hashe. Chromium: każdy osobny HTML i zbiorczy komplet, tryb print, wszystkie obrazy, zero żądań HTTP(S), zero błędów i brak przepełnień; także wersja ekranowa przy 1280×800. Świeże obrazy i `geometry.json`: `/opt/data/cache/scratch/polacy-fronty-v2-evidence/`.

To kontrola geometrii projektowanych stron HTML, **nie paginacja nieutworzonego PDF**, pomiar klasy ani potwierdzenie konkretnej drukarki. Nauczyciel musi sprawdzić wydruk i tempo uczniów. Formalna akceptacja i nowe zaakceptowane manifesty pozostają otwarte. Mapa: realne granice/wybrzeża, współczesne granice orientacyjne, nie wojenne; miasta są neutralnymi punktami, jednostki uczeń przyporządkowuje sam. Rejestry praw i źródeł w `sources.md` i `assets/*provenance.json`.

Nowy ZIP: `/opt/data/cache/scratch/polacy-fronty-v2-review.zip`; starego załącznika nie nadpisano. Nie wykonywano commitów ani push.
