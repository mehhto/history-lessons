# Weryfikacja lokalnej lekcji

## Aktualny wynik po dodaniu gęsi i Augusta
**22 slajdy: 21 rdzenia + podgląd karty; 40 minut.** Legenda na slajdzie 6, ciekawostki Augusta na 18. Spójny ciąg czasów notatek 0:00–40:00, bez luk i kolizji; zadanie oraz finał zachowują swój czas. Metadane i scenariusz zsynchronizowane. Pełna kontrola bieżących 22 slajdów live pod prywatnym URL oraz offline w 1024×768, 1280×720 i 1920×1080: PASS. Zero błędów i żądań HTTP(S) offline; nowy obraz dekoduje się również w powiększeniu (1970 px), Escape wraca do tego samego slajdu, brak kredytów w lightboxie. Obejrzano świeże slajdy 6/18 i planszę 22 ujęć. Kompozycja i git diff --check: PASS. Źródła: artykuł National Geographic porównany ze Swetoniuszem 28/29/76/88, legenda z Liwiuszem V.47; obraz Motte 1889 jako późniejsza wizja, nie świadectwo ataku. Bez commit/push/PDF/PPTX.

## Wcześniejsze kontrole — zapis kolejnych wersji
Wersja do całościowej akceptacji nauczyciela, nie publikacja. **17 slajdów rdzenia + 1 podgląd karty rozdanej przed lekcją**, **18 kompletów notatek**. Plan sumuje się do **38 minut**, w tym 30 sekund jawnego buforu. Każdy uczeń zapisuje trzy uzasadnione decyzje oraz własny bilet. Przy15:6par+trójka; do20:10par.

## Wykonane kontrole
- Walidacja pakietu, tożsamości katalogu i parsowanie metadanych przez istniejące helpers — PASS.
- `npm run check:composition -- --lesson classes/5/06-ustroj-starozytnego-rzymu` — PASS.
- `npm run check:render -- --lesson classes/5/06-ustroj-starozytnego-rzymu` — PASS po lokalnej korekcie specyficzności CSS.
- `check:contract` — **POMINIĘTO**, brak opt-in; nie przedstawiamy tego jako pozytywnej walidacji nowego kontraktu.
- Pełna geometria18slajdów wChromium:1024×768,1280×720,1920×1080; zarówno live przez istniejący helper, jak i odizolowany plik `file://` — PASS.
- Plik portable skopiowany sam do pustego katalogu, sieć odcięta: **0 żądań HTTP(S), 0 błędów JS/konsoli**, wszystkie ilustracje dekodują się — PASS.
- Strzałki, powiększenie mapy/escape, B, F, S — PASS live i offline. Przy S zmierzono faktyczny prostokąt slajdu i panelu: bez obcięcia i nakładania w3rozmiarach.
- Klucz ilustrowanej karty: sprawdzono bajty obu zdjęć `sketchnote-key*.jpg` — **nie są osadzone w portable**. W slajdzie18 wyłącznie pusta karta ucznia. Klucze pozostają osobno, nauczyciel ma je w przewodniku i osobnymHTML.
- Wygenerowano świeże screenshoty całej prezentacji i obejrzano planszę; pełnowymiarowo sprawdzono otwarcie, mapę, schemat, zadanie, biografie, notatkę i kartę. Sprawdzono poprawki ciemnych/jasnych powierzchni.
- SamodzielneHTML: teacher-guide, student-summary, worksheet otwarte przez file://; brak poziomego overflow. Kontrola geometrii A4 osobno, bez wytwarzaniaPDF.
- Parent wykonał osobną kontrolę dwóchHTML sketchnotki: raport `/opt/data/cache/scratch/rome-note/note-qa.json`, źródła i korekty w `sketchnote-corrections.md`.

## Dowody i powtórzenie
- `qa-report.json` — wyniki wykonanej kontroli live/offline.
- `.hermes/reviews/5/06-ustroj-starozytnego-rzymu/index.html` w repo — pełny świeży przegląd18slajdów.
- `contact-sheet.jpg` — kopia planszy przeglądowej w katalogu lekcji.
- `qa-teacher-guide.png`, `qa-student-summary.png`, `qa-worksheet.png` — ujęcia dokumentów.
- Dodatkowy skrypt jednorazowych kontroli wykorzystujący istniejące helpers: `/opt/data/cache/scratch/rome-qa.mjs`; uruchomienie z repo: `PLAYWRIGHT_BROWSERS_PATH=/opt/data/history-lessons/.playwright-browsers node /opt/data/cache/scratch/rome-qa.mjs`.

## Napotkane i usunięte problemy
Domyślna zmienna środowiskowa wskazywała cache przeglądarki innej wersji: użyto istniejącego repozytoryjnego cache; niczego nie instalowano. Wspólne selektory source-split/map-focus zmniejszały obrazy, task-board robił wąskie kolumny, a takeaways układał notatkę w3kolumny — poprawione wyłącznie wlesson.css i ponownie obejrzane. Whero biała dziedziczona czcionka zniknęła na białej powierzchni — naprawiona lokalnie. Dla notatek dzielnikCSS bez jednostki dawał długość zamiast liczby — poprawiono na1280px/720px i przetestowano obie geometrie panelu.

## Otwarte granice
Nie wykonano testów całego repozytorium, bo nic wspólnego nie zmieniono. Nie generowanoPDF/PPTX ani commit/push. Filmów nie zatwierdzono do projekcji: tylko opcjonalne linki, jawne ograniczenia wteacher-guide. Autor/licencja przesłanej karty i zdjęć podręcznika nieustalone; zdjęć stron nie ma wpakiecie. Akceptacja nauczyciela i próba wklasie nadal przed nami. Żaden wynik techniczny jej nie zastępuje.

## Końcowa kontrola rodzica
Po dopasowaniu przebiegu do wybranego wariantu sketchnotka jest uzupełniana krótkimi hasłami na slajdach 6–9, a nie dopiero po lekcji. Cztery minuty syntezy obejmują kontrolę karty i krótki zapis Cezar/August na odwrocie, bez podwójnego przepisywania. Dodano widoczne ciekawostki Rubikon/Kleopatra oraz łańcuch przyczyna→wydarzenie→skutek. Ponownie wygenerowano portable, przewodnik i screenshoty. Powtórzono QA na rzeczywistym prywatnym URL index.html oraz offline w trzech rozdzielczościach — PASS. Zweryfikowano HTTP200 prezentacji, przewodnika i obu odrębnych kart.

## Rewizja — siedmiu królów
Dodano slajd 5 po monarchii: siedem imion według tradycji i infografika nauczyciela. 45 sekund w dotychczasowym bloku, nadal 38 minut. Bez uczenia niepewnych dat. Ponownie uruchomiono scoped QA: 18 slajdów live pod prywatnym URL i offline × 3 rozdzielczości, zero błędów i żądań sieci offline. Obejrzano nowy slajd 5; lista, infografika, podpis i zastrzeżenie mieszczą się bez kolizji. Odświeżono guide, portable i review.

## Rewizja — legenda i zdjęcie króla
Slajd 3: cztery etapy legendy oraz dokładny link nauczyciela https://www.youtube.com/watch?v=NKVr4Byy0PU . Slajd 5: zamiast infografiki zdjęcie srebrnego denara z wyobrażeniem Numy; nie nazywamy go portretem z czasów życia króla. Usunięto zbędne komentarze o nauczycielu z powierzchni uczniowskiej. 18 slajdów live/offline × trzy viewporty PASS, zero błędów i żądań offline; zdjęcia obejrzane. Osobny check-revision.mjs PASS: 4 etapy, dokładny link, lightbox monety i Escape online/offline. Kompozycja i git diff --check PASS. Ocena filmu w osobnym raporcie, nie jest równoważna odsłuchowi.

## Aktualna rewizja — mapa, źródła i Cezar
20 slajdów,19rdzenia+podgląd,40min. Slajd11 mapa etapów zpolskąlegendą, slajd14 trzy ciekawostki. PełneQA20slajdów live/offline×3viewporty PASS, zerobłędów/żądańoffline. Dodatkowo lightboxmapy2850px sprawdzony klawiaturą iEscape online/offline. Usunięto widoczne atrybucje. KompozycjaPASS bezostrzeżeń,gitdiffcheckPASS. Obejrzano świeże slajdy11/14; contact-sheet odświeżony20ujęć. FilmNKVr4Byy0PU ma aktualnąocenęwguide; niepełnyodsłuchjawny.
