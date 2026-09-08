# Wzorce dydaktyczne

Wzorzec wybieraj według celu ucznia, nie według efektu wizualnego. Każdy kończy się widocznym dowodem pracy ucznia oraz ma lokalny fallback do wydruku.

| Wzorzec | Użyj, gdy uczeń ma… | Minimalna sekwencja |
|---|---|---|
| `source-analysis` | odczytać i ograniczyć źródło | materiał → obserwacja → pytanie → ograniczenie |
| `comparison` | porównać dwa materiały | kryterium → materiał A/B → podobieństwo/różnica → wniosek |
| `cause-effect` | wyjaśnić mechanizm | przyczyna → wydarzenie → skutek → dowód |
| `map-question` | odczytać związek przestrzenny | mapa → lokalizacja → pytanie → wyjaśnienie |
| `retrieval` | samodzielnie odtworzyć kluczową wiedzę | pytanie → odpowiedź ucznia → omówienie → bilet wyjścia |

## Zasady

- Slajd nie zastępuje zadania ucznia.
- Źródło z epoki, późniejsze przedstawienie i schemat edukacyjny podpisuj odmiennie.
- Użyj jednego głównego komponentu na slajd; złożone interakcje pozostają dodatkiem.
- Wydruk ma zawierać treść i pytania, nie instrukcję „kliknij”.
- Dostosuj szczegóły przez `id` slajdu i lokalny `lesson.css`, nie przez kopiowanie wspólnego CSS.

## Atlas dokumentalny: wybór kompozycji

| Layout | Kiedy używać | Limit / dominanta | Nie rób |
|---|---|---|---|
| `hero-source` | otwarcie oparte na fotografii | 1 źródło, 1 data | nie kadruj map ani dokumentów |
| `statement-centered` | pytanie albo teza | do 35 słów | nie dodawaj listy |
| `map-focus` | odczyt mapy | mapa 65–78%, panel ≤35% | nie chowaj legendy |
| `source-split` | źródło i krytyka | źródło 62–68% | nie mieszaj wielu pytań |
| `photo-pair` | porównanie dwóch zdjęć | dwa równe pola | nie stosuj fałszywej galerii `div` |
| `timeline-band` | trzy–cztery daty | krótki opis przy dacie | nie łam daty `1&nbsp;IX` |
| `argument` | twierdzenie i dowody | 1 teza + 2–3 dowody | nie równaj wagi dowodów |
| `task-board` | praca ucznia | pytanie, czas, produkt, kryterium | nie zostawiaj samego polecenia |
| `comparison` | warianty A/B/C | 2–3 pola | nie używaj `auto-fit` |
| `impact-flow` | wymiana lub przyczyna–skutek | dwa kierunki i łącznik | nie sugeruj symetrii skutków |

Źródła obrazowe wymagają prawdziwego `alt`, podpisu z autorem/datą/licencją oraz `data-fit="contain"`; `cover` wolno zastosować wyłącznie do fotografii z kontrolowanym kadrem. Podpis ma minimum 18 px, zasadnicza treść minimum 24 px. Pełne przykłady obu palet są w showroomie `classes/6/katalog-komponentow-prezentacji/`.
