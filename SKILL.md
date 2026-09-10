# SKILL.md — tworzenie lekcji historii, klasy IV–VIII

## Rola i granice

Tworzysz **pełne, pierwsze wersje pakietów lekcji** dla nauczyciela historii w polskiej szkole podstawowej. Pakiet dostarcza uczniowi potrzebną wiedzę, wyjaśnienie, ćwiczenie i syntezę; podręcznik jest uzupełnieniem, nie miejscem, do którego odsyła się po brakujące wyjaśnienia.

Nie jesteś źródłem faktów historycznych ani arbitrem zgodności z programem. Kolejność priorytetów: **wymaganie programowe → poprawność faktograficzna → zrozumienie ucznia → wartość dydaktyczna → estetyka**.

## Przed rozpoczęciem

1. Ustal rok szkolny i klasę. Odczytaj `curriculum/rollout-2026.md`, wybierz `nowa-2026` albo `stara-przejsciowa`, a potem przeczytaj właściwy plik klasy, `template/quality-checklist.md` oraz `template/lesson/lesson.md`.
2. Ustal: klasę, czas, temat, dosłowne wymaganie z aktywnej podstawy, pytanie główne i **typ lekcji**: `new-knowledge` albo `practice`. Wymagań edukacyjnych używaj do poziomowania; nie mogą nadpisywać podstawy.
3. Zbuduj mapę: **wymaganie → wiedza konieczna → działanie ucznia → dowód zrozumienia**.
4. Wykonaj ograniczony rekonesans publicznego ZPE: wyszukaj temat, klasę i pojęcia z celu, oceń kilka najtrafniejszych materiałów i zapisz decyzję w `sources.md`. ZPE trzeba sprawdzić, ale materiału nie trzeba użyć.
5. Materiał ZPE wykorzystaj tylko wtedy, gdy wnosi konkretną wartość dla celu, jest odpowiedni dla wieku, ma zweryfikowane fakty i stronę z jasną licencją/status...[truncated]

## Dwa typy lekcji

### 1. `new-knowledge` — nowa wiedza

Cel: uczeń rozumie nowe wydarzenie, proces, pojęcie lub mechanizm.

Wymagane elementy:

1. pytanie główne;
2. **pełne minimum wiedzy** — wyjaśnienie potrzebne do samodzielnego rozumienia tematu, nie lista haseł;
3. uporządkowana narracja: chronologia, związek przyczyna–skutek, przykład albo porównanie;
4. zastosowanie wiedzy w krótkim zadaniu;
5. synteza i bilet wyjścia;
6. `student-summary.md`: jednostronicowe podsumowanie po lekcji.

### 2. `practice` — ćwiczeniowa / źródłowa

Cel: uczeń wykorzystuje wyjaśnioną wcześniej wiedzę do analizy, porównania, argumentacji lub utrwalenia.

Wymagane elementy:

1. krótkie przypomnienie wiedzy koniecznej do zadania;
2. materiał, pytania kierujące i jasny produkt ucznia;
3. model odpowiedzi lub kryteria dobrej odpowiedzi;
4. synteza / powtórka i bilet wyjścia.

Źródło, mapa lub materiał wizualny są obowiązkowe **wyłącznie wtedy, gdy rzeczywiście wzmacniają cel**. Nie dodawaj ich jako rytuału.

## Konstrukcja i objętość

Nie istnieje globalny limit liczby slajdów ani słów. Prezentacja może mieć tyle slajdów i tyle tekstu, ile wymaga zrozumienie tematu przez ucznia w danym wieku.

Każdy slajd musi mieć jasną funkcję oraz być czytelny z końca klasy:

- tekst porządkuj w krótkie bloki, tabele, osie czasu i wyróżnienia zamiast w ściany tekstu;
- wprowadzaj ograniczoną liczbę nowych pojęć naraz;
- rozdziel wyjaśnienie od ćwiczenia;
- sprawdź rzeczywiste płótno Reveal 1280×720, przepełnienia i czas całej lekcji; sam zrzut okna 16:9 nie wystarcza;
- nie ukrywaj nadmiaru przez `overflow`, przewijanie, ellipsis ani mikrotekst — popraw kompozycję lub podziel slajd, zachowując wyjaśnienie;
- nie skracaj prawidłowego wyjaśnienia tylko po to, aby spełnić liczbowy limit.

## `slides.md` i notatki nauczyciela

- Widoczna prezentacja ma zawierać pełne, zwięzłe wyjaśnienia dla ucznia.
- Dodawaj notatki po `notes:` (małymi literami); nie są wyświetlane uczniom.
- Szczegółowe notatki są wymagane tylko przy trudnym wyjaśnieniu, nowym pojęciu, źródle, materiale kontrowersyjnym, pytaniu wymagającym moderacji albo zadaniu z typowymi błędami.
- Każdy pakiet ma `lesson.css`, ładowany po motywie i komponentach. Ręczne poprawki konkretnej lekcji zapisuj wyłącznie tam.
- Dla niestandardowego slajdu użyj trwałego `id` w dyrektywie `.slide`; selektory w `lesson.css` odnoszą się do tego identyfikatora.
- Zachowuj wspólny bootstrap prezentacji, ścieżki do bibliotek i ścieżki do lokalnych zasobów. Wygląd wybieraj przez `metadata.json.appearance`: `museum`, `editorial` lub `atlas` i zatwierdzoną dla niego paletę; nie dodawaj dowolnego CSS ani zdalnych fontów.
- Stosuj klasy zależnie od funkcji, np. `question-slide`, `explanation-slide`, `context-slide`, `source-slide`, `map-slide`, `practice-slide`, `compare-slide`, `exit-ticket-slide`.

Dostępne komponenty lokalne: `lesson-timeline` / `lesson-event`, `lesson-gallery`, `lesson-map`, `lesson-disclosure`, `lesson-stats` / `lesson-stat` / `lesson-counter`, `lesson-stepper` / `lesson-step`, `lesson-table`, `lesson-quote`, `lesson-icon-list`, `lesson-video` i `lesson-compare`. Pełne przykłady są w `classes/6/katalog-komponentow-prezentacji/`.

Mapy Google i YouTube są opcjonalne: iframe uzyskuje `src` wyłącznie po kliknięciu, a slajd ma lokalną alternatywę. Galeria wymaga opisowych `alt` i podpisów; hover jest dodatkiem — musi działać także przez `Tab`, strzałki, `Home`, `End`, `Escape` i dotknięcie.

## Przenośna prezentacja bez konfiguracji sali

Gdy nauczyciel potrzebuje pracy na obcych komputerach bez Node.js, serwera i Internetu, po ustabilizowaniu źródeł wygeneruj samodzielny plik:

```bash
npm run export:portable -- --lesson classes/4/temat
```

Wynik `*-portable.html` jest artefaktem lokalnym, nie źródłem i nie trafia do Git. Można go przenieść niezależnie od repozytorium i otworzyć dwuklikiem. Po każdej zmianie slajdów, CSS, metadanych, komponentów albo obrazów wygeneruj go ponownie. Przed przekazaniem otwórz wynik przez `file://` bez serwera, potwierdź brak żądań sieciowych dla podstawowej treści, pełne wczytanie obrazów, geometrię wszystkich slajdów oraz działanie klawiatury, notatek i komponentów interaktywnych.

## Źródła, fakty i prywatność

- Nie wymyślaj cytatów, dokumentów, dat, autorów, licencji, map ani danych.
- Przy informacji nieweryfikowanej wpisz `[DO WERYFIKACJI]`.
- Oznaczaj materiał jako: źródło z epoki / opracowanie / tekst kultury / rekonstrukcja / grafika AI.
- Grafika AI nie jest dowodem historycznym.
- Dla każdego materiału utwórz wpis w `sources.md`.
- Nie używaj danych osobowych, ocen, wizerunku ani niezanonimizowanych prac uczniów.

## Status jakości

`npm run check` rozdziela:

1. kompletność pakietu;
2. sprawność techniczną i aktualność PDF;
3. przegląd źródeł oraz nauczyciela;
4. **ostrzeżenia dydaktyczne** — brak mapy wymagań, pełnego minimum wiedzy, podsumowania ucznia lub sekcji trudnych momentów.

Ostrzeżenia dydaktyczne nie blokują statusu technicznego. Braki struktury, bezpieczeństwa, aktualnych artefaktów, przeglądu faktów i nierozwiązane znaczniki pozostają blokujące.

## Oczekiwane pliki

Aktualizuj `lesson.md`, `slides.md`, `lesson.css`, `sources.md`, `assessment.md`, `reflection.md`, `teacher-guide.md`, `student-summary.md` i `metadata.json`. W `metadata.json` wpisz `lesson_type`. Przed zakończeniem uruchom `npm run check`, sprawdź render, wygeneruj tylko artefakty wymagane w aktualnym zakresie i przejdź checklistę jakości. PDF/PPTX powstają dopiero po wyraźnym żądaniu lub akceptacji nauczyciela.
