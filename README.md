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
