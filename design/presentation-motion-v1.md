# Ruch prezentacji — v1

Status: **opcjonalny język ruchu dla przyszłych lekcji**. Nie włącza animacji w istniejących pilotach.

## Przejścia slajdów

Reveal używa już spokojnego przejścia `slide` oraz `fade` dla tła. To jest domyślny poziom ruchu. Nie dodawaj efektów 3D, obrotów ani przejść do każdego elementu.

- `slide` — normalne przejście między scenami;
- `fade` — tylko dla spokojnej zmiany tonu lub źródła;
- `none` — przy `prefers-reduced-motion` i w renderach kontrolnych.

## Rozwijająca się oś czasu

Dla osi, która ma ujawnić kolejność, dodaj `reveal-axis` do istniejącego komponentu:

```html
<lesson-timeline reveal-axis style="--timeline-accent: var(--color-accent)">
  <lesson-event year="1410">Pierwszy etap.</lesson-event>
  <lesson-event year="1415">Drugi etap.</lesson-event>
  <lesson-event year="1420">Trzeci etap.</lesson-event>
</lesson-timeline>
```

Komponent rysuje oś od lewej do prawej i wprowadza kolejne zdarzenia co 100 ms. Ruch uruchamia się przy wejściu na slajd i przy powrocie do niego. Bez `reveal-axis` timeline pozostaje statyczny.

## Granice

- Najwyżej **jeden** celowy efekt ruchu na slajdzie.
- Ruch pokazuje relację: kolejność, przyczynę, zmianę lub ujawnienie źródła. Nie służy do dekoracji.
- Pełne źródło, mapa i długi cytat nie wymagają animacji.
- `prefers-reduced-motion` oraz wydruk pokazują od razu pełną, statyczną oś.
- Testuj wejście na slajd, powrót do slajdu i render statyczny.
