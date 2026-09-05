# History Lessons

Lokalny, *offline-first* system tworzenia lekcji historii dla klas IV–VIII szkoły podstawowej w Polsce.

**Zasada:** `Markdown` jest źródłem treści, `HTML + Reveal.js` jest prezentacją prowadzoną na lekcji, a `PDF` jest kopią awaryjną.

## Szybki start

```bash
npm install
npm run sync:reveal
npm run new -- --class 6 --title "Wielkie odkrycia geograficzne"
npm run check
npm run serve
```

Otwórz `http://127.0.0.1:8080/classes/6/wielkie-odkrycia-geograficzne/`.

## Podgląd przez SSH przed pushem

Do przeglądu pojedynczej lekcji bez publikowania zmian w Git uruchom ograniczony serwer podglądu:

```bash
npm run preview -- --lesson classes/6/wielkie-odkrycia-geograficzne-wyprawy-i-spotkanie-swiatow --host 0.0.0.0 --port 8090
```

Serwer udostępnia wyłącznie wybraną lekcję, jej zasoby oraz wymagane pliki Reveal.js, motywu i komponentów; blokuje inne lekcje, `.git` i skrypty repozytorium. W środowisku Docker nie kieruj tunelu do adresu bridge kontenera. Opublikuj port w Compose na hoście, najlepiej do loopback albo zaufanego interfejsu LAN, a następnie użyj adresu hosta:

```bash
ssh -N -L 8090:127.0.0.1:8090 USER@MINIPC
```

Po opublikowaniu portu na interfejsie LAN podgląd można też otworzyć bezpośrednio pod `http://ADRES-MINIPC:8090/`. Następnie w przeglądarce otwórz `http://127.0.0.1:8090/classes/6/wielkie-odkrycia-geograficzne-wyprawy-i-spotkanie-swiatow/`. Tunel i proces preview muszą działać przez cały czas przeglądu.

### Sterowanie prezentacją

| Klawisz | Działanie |
|---|---|
| `→`, `spacja`, `Page Down` | następny slajd / fragment |
| `←`, `Page Up` | poprzedni slajd |
| `S` | notatki prowadzącego |
| `B` lub `.` | czarny ekran podczas dyskusji |
| `F` | pełny ekran |
| `Esc` | widok wszystkich slajdów |

## Codzienny workflow

1. Uzupełnij `lesson.md`: klasa, temat, wymaganie, cele, pytanie główne i materiał, który masz.
2. Wybierz i ręcznie zweryfikuj lokalne materiały; zapisz ich pochodzenie i licencję w `sources.md`.
3. Poproś AI o pierwszy szkic `slides.md` zgodnie z `SKILL.md`; nie zlecaj mu wymyślania źródeł ani faktów.
4. Dodaj pliki do `assets/`, uruchom `npm run check`, a następnie obejrzyj lekcję lokalnie.
5. Po lekcji uzupełnij `reflection.md`; jeśli problem powtarza się, popraw szablon lub regułę, nie tylko jedną lekcję.
6. Przed lekcją utwórz PDF: `npm run export:pdf -- --lesson classes/6/wielkie-odkrycia-geograficzne`.

## Komponenty i trwałe poprawki wyglądu

`slides.md` pozostaje źródłem treści. Każdy pakiet lekcji ma też `lesson.css`, ładowany **po** wspólnym motywie i bibliotece komponentów. Ręczne zmiany wyglądu zapisuj tam, aby przetrwały generowanie, eksport PDF i pracę na innym komputerze.

Nadaj niestandardowemu slajdowi trwałe `id`:

```md
<!-- .slide: id="chronologia-wypraw" class="context-slide timeline-slide" -->
```

### Oś czasu

```md
<lesson-timeline>
  <lesson-event year="1492">Kolumb dociera do Karaibów</lesson-event>
  <lesson-event year="1498">Vasco da Gama dociera do Indii</lesson-event>
</lesson-timeline>
```

### Galeria źródeł

Galeria działa offline. Na komputerze obraz rozwija się po najechaniu; klawiatura obsługuje `Tab`, strzałki, `Home`, `End` i `Esc`; na ekranie dotykowym wybór następuje po dotknięciu.

```md
<lesson-gallery aria-label="Dwa źródła historyczne">
  <figure data-gallery-item>
    <img src="assets/zrodlo-1.jpg" alt="Opis grafiki">
    <figcaption>Autor, data — ograniczenie źródła.</figcaption>
  </figure>
  <figure data-gallery-item>
    <img src="assets/zrodlo-2.jpg" alt="Opis grafiki">
    <figcaption>Autor, data — ograniczenie źródła.</figcaption>
  </figure>
</lesson-gallery>
```

Ustawienia konkretnego slajdu przechowuj w `lesson.css`:

```css
#chronologia-wypraw { --timeline-accent: #a6502d; }
#galeria-zrodel { --gallery-focus: #c78a29; }
```

Nie wpisuj zewnętrznych adresów obrazów: zasoby należy najpierw pobrać do `assets/` i opisać w `sources.md`.

### Katalog rozszerzonych komponentów

Pełny, gotowy do obejrzenia wzornik znajduje się w `classes/6/katalog-komponentow-prezentacji/`. Zawiera przykładowe slajdy i źródłowy markup dla: aktywnej mapy lokalnej, opcjonalnego iframe Google Maps, rozwijanych haseł, kart statystyk/liczników, steppera, tabeli, cytatu z portretem, pionowej i poziomej osi czasu, odtwarzanego na żądanie YouTube, listy ikon oraz compare slidera.

| Potrzeba | Element |
|---|---|
| lokalna mapa z punktami | `lesson-map` + przyciski `data-map-pin` |
| rozwijane hasła | `lesson-disclosure` + natywne `details` |
| statystyki | `lesson-stats`, `lesson-stat`, `lesson-counter` |
| proces | `lesson-stepper`, `lesson-step` |
| tabela / cytat / lista | `lesson-table`, `lesson-quote`, `lesson-icon-list` |
| porównanie obrazów | `lesson-compare` z `input type="range"` |
| film online | `lesson-video` — iframe ładuje się dopiero po kliknięciu |

Integracje Google Maps i YouTube są opcjonalne oraz wymagają Internetu. Każdy ich slajd musi mieć lokalną treść alternatywną — źródło, schemat, transkrypcję lub zadanie offline.

## Status jakości i pakiet do druku

`npm run check` rozdziela trzy sprawy: kompletność pakietu, sprawność techniczną oraz akceptację nauczyciela. Wynik techniczny nie zatwierdza faktów ani zgodności z programem; nierozwiązane znaczniki i brak przeglądu pozostają jawne. Gdy choć jeden pakiet jest niegotowy, polecenie kończy się kodem niepowodzenia — użyj `npm run check -- --allow-pending` wyłącznie do nieblokującego raportu stanu.

Każda lekcja ma dodatkowo:
- `teacher-guide.md` — operacyjna ściąga prowadzącego; podczas eksportu dołączany jest do niej `assessment.md`;
- `student-summary.md` — jednostronicowe podsumowanie dla ucznia: główna odpowiedź, wnioski, pojęcia, porządek wiedzy, częsty błąd i pytania do powtórki.

Wygeneruj materiały A4 lokalnie:

```bash
npm run export:print -- --lesson classes/6/wielkie-odkrycia-geograficzne-wyprawy-i-spotkanie-swiatow
```

Powstaną `worksheet.pdf`, `teacher-guide.pdf` i `student-summary.pdf`. Klucz z `assessment.md` trafia wyłącznie do dokumentu prowadzącego. Eksport odrzuca podsumowanie ucznia dłuższe niż jedna strona A4. Manifest przy wydrukach wykrywa zmianę źródłowego Markdown, CSS, eksportera lub przypiętej wersji Playwright i oznacza stary pakiet jako nieaktualny.

Techniczną kontrolę renderu wykonaj lokalnie przed oceną wizualną:

```bash
npm run check:render -- --lesson classes/6/katalog-komponentow-prezentacji
```

Sprawdza błędy konsoli i przepełnienia; nie zastępuje obejrzenia slajdów przez człowieka.

## Eksport PDF

Automatycznie (wymaga jednorazowej instalacji przeglądarki Playwright):

```bash
PLAYWRIGHT_BROWSERS_PATH=.playwright-browsers npx playwright install chromium
npm run export:pdf -- --lesson classes/6/wielkie-odkrycia-geograficzne
```

PDF zapisze się jako `presentation-backup.pdf` w katalogu lekcji. Możesz też uruchomić `npm run serve`, otworzyć daną lekcję z `?print-pdf` na końcu adresu i użyć drukowania przeglądarki: **poziomo**, **marginesy: brak**, **grafika w tle: włączona**.

## Struktura

- `curriculum/` — wymagania i szkolny wariant programu; uzupełnij je tylko zweryfikowanym tekstem.
- `template/` — stały motyw, lokalny Reveal.js, szablony i checklista.
- `asset-library/` — ponownie wykorzystywane lokalne materiały wraz z rejestrem praw/licencji.
- `classes/4` … `classes/8` — katalogi rzeczywistych lekcji.
- `archive/` — materiały wycofane, starsze wersje i ukończone roczniki.
- `scripts/` — tworzenie pakietu lekcji, kontrola struktury, serwer i eksport PDF.

## Jakość i bezpieczeństwo

- Ten repozytorium nie zawiera tekstu podstawy programowej. Wklej jej właściwy wariant dla szkoły do `curriculum/` i zapisz źródło oraz datę weryfikacji.
- Nie przedstawiaj grafiki AI jako źródła historycznego.
- Nie dodawaj danych osobowych ani prac uczniów bez anonimizacji i podstawy prawnej.
- Każda data, cytat, autor, mapa, licencja i podpis wymaga kontroli nauczyciela przed użyciem.
- Gotowa lekcja ma działać bez Internetu: obrazy, fonty i biblioteki pozostają lokalne.

## Kontrola wersji

```bash
git add .
git commit -m "Dodaj lekcję: wielkie odkrycia geograficzne, klasa 6"
```
