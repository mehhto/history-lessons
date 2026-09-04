# SKILL.md — tworzenie lekcji historii, klasy IV–VIII

## Rola i granice

Tworzysz **pierwszą wersję** materiałów dla nauczyciela historii w polskiej szkole podstawowej. Nie jesteś źródłem faktów historycznych ani arbitrem zgodności z programem.

Kolejność priorytetów: **wymaganie programowe → poprawność faktograficzna → wartość dydaktyczna → estetyka**.

## Przed rozpoczęciem

1. Przeczytaj właściwy plik w `curriculum/`, `template/quality-checklist.md` oraz `template/lesson/lesson.md`.
2. Ustal: klasę, czas, temat, wymaganie szczegółowe, pytanie główne i materiały dostępne nauczycielowi.
3. Gdy danych brakuje, użyj `[DECYZJA NAUCZYCIELA]`; nigdy nie dopowiadaj ich jako faktów.
4. Używaj wyłącznie materiałów wpisanych w `sources.md` i istniejących lokalnie w `assets/`.

## Konstrukcja lekcji

Każda 45-minutowa lekcja ma: jedno wymaganie, 2–4 mierzalne cele, pytanie problemowe, krótkie minimum wiedzy, 1–2 materiały źródłowe/mapy, pytania kierujące, aktywność w parach lub grupach, widoczny rezultat i bilet wyjścia.

Typowy rytm: wejście 3–5 min → kontekst 6–8 min → praca z materiałem 16–20 min → wniosek 8–10 min → bilet wyjścia 3–5 min.

- Klasa IV: jedno źródło, duża czcionka, proste odczytywanie i krótka odpowiedź.
- Klasy V–VI: 1–2 źródła, mapa, przyczyna–skutek i porównanie.
- Klasy VII–VIII: 2–3 źródła, perspektywy, wiarygodność i argumentacja.

## Reguły `slides.md`

- Maksymalnie 12 głównych slajdów na 45 minut.
- Maksymalnie 24 słowa widocznego tekstu uczniowskiego na slajd.
- Jeden cel poznawczy na slajd.
- Każdy slajd zawiera pytanie, dowód lub funkcję organizacyjną.
- Dodawaj notatki po `notes:` (małymi literami); nie są wyświetlane uczniom.
- Zachowuj `index.html`, `theme.css`, ścieżki do bibliotek i ścieżki do lokalnych zasobów, chyba że nauczyciel wyraźnie zleci inaczej.
- Stosuj klasy: `question-slide`, `context-slide`, `source-slide`, `map-slide`, `compare-slide`, `exit-ticket-slide`.
- Każdy pakiet ma `lesson.css`, ładowany po motywie i komponentach. Ręczne poprawki konkretnej lekcji zapisuj wyłącznie tam.
- Dla niestandardowego slajdu użyj trwałego `id` w dyrektywie `.slide`; selektory w `lesson.css` odnoszą się do tego identyfikatora.
- Dostępne komponenty lokalne: `lesson-timeline` z `lesson-event` oraz `lesson-gallery` z elementami `figure[data-gallery-item]`.
- Galeria wymaga opisowych `alt` i podpisów; hover jest dodatkiem — musi działać także przez `Tab`, strzałki, `Home`, `End`, `Escape` i dotknięcie.

## Źródła, fakty i prywatność

- Nie wymyślaj cytatów, dokumentów, dat, autorów, licencji, map ani danych.
- Przy informacji nieweryfikowanej wpisz `[DO WERYFIKACJI]`.
- Oznaczaj materiał jako: źródło z epoki / opracowanie / tekst kultury / rekonstrukcja / grafika AI.
- Grafika AI nie jest dowodem historycznym.
- Dla każdego materiału utwórz wpis w `sources.md`.
- Nie używaj danych osobowych, ocen, wizerunku ani niezanonimizowanych prac uczniów.

## Oczekiwane pliki

Aktualizuj `lesson.md`, `slides.md`, `lesson.css`, `sources.md`, `assessment.md`, `reflection.md` i `metadata.json`. Przed zakończeniem uruchom `npm run check` oraz przejdź checklistę jakości.
