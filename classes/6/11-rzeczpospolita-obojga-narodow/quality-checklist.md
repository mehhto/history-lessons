# Kontrola pakietu — VI Rzeczpospolita Obojga Narodów

## Zakres i status
Przegląd nauczycielki odbył się w rozmowie: wdrożono zmianę kolejności diagramu i rozszerzenie mapy/mieszkańców. Końcowa akceptacja całego pakietu pozostaje otwarta; historyczne pola metadata nie są dowodem braku przeglądu. `offline_checked:true` wynika z realnego uruchomienia samodzielnego HTML przez file://. PDF/PPTX nie zamawiano i nie wygenerowano; brak tych plików nie jest w tym zleceniu defektem. Bez commit/push. Zmieniono tylko nowy katalog lekcji i dedykowany test; pozostałe pakiety zastane dirty pozostawiono nietknięte.

## Treść i praca ucznia
- [x] KlasaVI,2026/2027, stara podstawa, literalny IX.7; rozróżniono wprowadzenie wielonarodowości od realizacji całego X.1.
- [x] Po rozszerzeniu mapy38min:2+4+6+7+5+8+4+2; wariant35 skraca komentarze, opcja40 ma2min buforu, bez nowej karty.
- [x] 16 slajdów,16 notatek (w tym plansza źródeł przed biletem), pełny osobny storyboard każdego slajdu; tytuł i istotny obraz na otwarciu.
- [x] Zobowiązania1385 i realizacja1386; przyczyny1569, śmierć1572 później; opór i cztery wcielenia, nie wyłącznie szczęśliwe zjednoczenie.
- [x] Pełny dostarczony akt3/4/7 ze wstępem, archaizmami, objaśnieniami i kredytem; dwa pytania najpierw, odpowiedzi tylko nauczycielskie.
- [x] Venn to notatka, nie zastępcza tabela:4wspólne pola i4+4odrębne. Cztery środkowe strefy blankietu odróżnione obramowaniem, bez odpowiedzi i kodów.
- [x] Najpierw samodzielna lektura s.67 i uzupełnienie (slajd6 po5), potem omówienie wspólnych i odrębnych elementów (7–8); model w syntezie i osobno dla nauczyciela.
- [x] Orzeł i Pogoń to wierne kadry z arrasu1560 (źródło z epoki), nie współczesne godła ani autorskie przerysowanie.
- [x] Doprecyzowano monetę; nie utożsamiono Rusinów z Rosjanami i różnorodności z równymi prawami.
- [x] Pięć pytań z odpowiedziami, bilet, synteza, trzy źródłowe ciekawostki i pełny35/40min wariant bez slajdów z podręcznikiem.

## Źródła i wygląd
- [x] Obejrzano pięć dostarczonych zdjęć; pełnych skanów podręcznika nie dołączono.
- [x] Sześć literalnych URL i jawne use/optional/reject w sources.md. Materiały licealne wyłącznie zaplecze; filmy bez embedu, Sejm z jawnym brakiem pełnego odsłuchu.
- [x] Lokalna proweniencja, kadry, licencje i SHA256 wszystkich plików w assets/provenance.json.
- [x] Paleta civic-debate z biblioteki, fonty Atkinson Hyperlegible + Alegreya, bez gradientów. Rytm nie kopiuje VI10: duży obraz otwarcia, oś, argumenty, spór, instytucje, pełne źródło, mapa, diagram i bilet.
- [x] Źródło28px, wstęp24px, kredyt20px. Mapa maksymalizowana bez podpisu; lightboxy bez źródła i automatycznego podpisu, także heraldyka.

## Uruchamialne kontrole
```sh
node --test test/rzeczpospolita-obojga-narodow.test.mjs
RON_LIVE_URL=https://ai-agent.tail53435f.ts.net/classes/6/11-rzeczpospolita-obojga-narodow/ node --test test/rzeczpospolita-obojga-narodow.test.mjs
PLAYWRIGHT_BROWSERS_PATH=/opt/data/history-lessons/.playwright-browsers npm run check:render -- --lesson classes/6/11-rzeczpospolita-obojga-narodow
npm run check:composition -- --lesson classes/6/11-rzeczpospolita-obojga-narodow
npm run export:portable -- --lesson classes/6/11-rzeczpospolita-obojga-narodow --output review-11-rzeczpospolita-obojga-narodow-portable.html
```
Dedykowany test:4kontrole,0błędów w zakończonych uruchomieniach. Pełnego testu całego repozytorium nie uruchamiano: zmiany są ograniczone do nowego pakietu, bez wspólnych komponentów. Kontrola kontraktu slajdów i mapy celów jest wykonywana bezpośrednio, nie udajemy sukcesu z `POMINIĘTO` przy braku opt-in wspólnego kontraktu.

## Dowody
Katalog: `.hermes/reviews/6/11-rzeczpospolita-obojga-narodow/`.
- `qa/report.json`: wszystkie16slajdów ×3viewporty (1024×768,1280×720,1920×1080) ×live/offline; bez przepełnienia, błędów konsoli i żądańHTTP(S) offline.
- `qa/live-1920-01.png` … `qa/live-1920-16.png`: aktualna cała sekwencja. `contact-final.jpg` dokumentuje wcześniejszą wersję 14 slajdów; aktualne pojedyncze pliki obejmują dodaną planszę źródeł.
- `qa/live-1920-10.png`: pełny tekst aktu; `qa/live-1920-11.png`: mapa; `qa/live-1920-12.png`: mapa języków z granicami1618; `qa/live-1920-13.png`: mieszkańcy; `qa/live-1920-14.png`: model.
- `qa/live-lightbox-10-0.png`, `qa/live-lightbox-7-0.png`, `qa/live-lightbox-11-0.png`: mapa i źródłowy Orzeł bez podpisów.
- `qa/live-notes.png`, `qa/offline-notes.png`: notatki w tym samym oknie; lokalnie poprawiono przycinanie płótna w trybieS i dodano test trzech rozmiarów.
- `qa/worksheet-a4.png`, `qa/worksheet-teacher-a4.png`: druk monochromatyczny. Geometria DOM w emulacji print mieści się w jednymA4poziomo (277×190mm obszaru po marginesach10mm). Nie testowano konkretnej fizycznej drukarki.
- Test otwiera każdą ilustrację klawiszemEnter, sprawdza blokowanie zmiany slajdu, Escape i przywrócenie focusu:36otwarć łącznie live/offline. Sprawdza S,B,F i strzałki.
- Wersja live slides.md,lesson.css,metadata.json porównywana literalnie z plikami roboczymi.

## Pozostaje do oceny
- Końcowa akceptacja po wdrożeniu zgłoszonych korekt oraz rzeczywista czytelność na projektorze; nie prosimy o powtarzanie już odbytego przeglądu.
- Status praw współczesnego podręcznikowego wyboru/opracowania źródła: wyłącznie prywatny ograniczony podgląd edukacyjny; nie publikować automatycznie.
- Pełny odsłuch filmu Sejmu przed ewentualnym przyszłym użyciem; obecny rdzeń go nie wymaga.
