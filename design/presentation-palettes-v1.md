# Biblioteka palet prezentacji — v1

Status: **zasób wspólny dla przyszłych prezentacji**. Nie zmienia istniejących pilotów automatycznie.

## Źródło i sposób doboru

30 palet to praktyczna selekcja z danych [ColorBrewer 2](https://colorbrewer2.org/export/colorbrewer.json), pobranych 19 IX 2026. Każda pozycja ma przypisane role, więc autor nie wybiera pojedynczych kolorów losowo. Dane maszynowe: [`presentation-palettes-v1.json`](presentation-palettes-v1.json).

`canvas` jest tłem, `surface` polem treści, `ink` tekstem, `accent` prowadzi hierarchię, `evidence` oznacza materiał/dowód, a `signal` jest pojedynczym sygnałem zadania, daty lub ostrzeżenia. Nie stosuj wszystkich ról naraz: zwykle wystarczają `canvas`, `ink`, `accent` i jedna z `evidence`/`signal`.

## Zasady użycia

1. Wybierz paletę po funkcji i tonie lekcji, nie po tym, czy jest „ładna” w próbniku.
2. Nie używaj gradientów. Kolory są płaskimi powierzchniami i liniami.
3. Nie używaj kremu jako automatycznego `canvas`; korzystaj z wartości palety.
4. Na jednym slajdzie użyj maksymalnie dwóch aktywnych kolorów poza `canvas`, `surface` i `ink`.
5. W decku zachowaj jedną paletę. Zmieniaj geometrię slajdów, nie jej fundament kolorystyczny.
6. Przed użyciem sprawdź kontrast tekstu na finalnym renderze; biblioteka jest punktem startowym, nie zwalnia z kontroli projektorowej.

## 30 palet

| Paleta | Najlepsza dla | Canvas | Ink | Accent | Evidence | Signal |
|---|---|---|---|---|---|---|
| `atlas-blue` | mapy, geografia i sieci | `#EFF3FF` | `#1F2933` | `#08519C` | `#3182BD` | `#6BAED6` |
| `maritime-teal` | morze, handel i podróże | `#EDF8FB` | `#1F2933` | `#006D2C` | `#2CA25F` | `#66C2A4` |
| `archive-violet` | źródła, prawo i pamięć | `#EDF8FB` | `#1F2933` | `#810F7C` | `#8856A7` | `#8C96C6` |
| `river-cyan` | rzeki, miasta i rozwój | `#F0F9E8` | `#1F2933` | `#0868AC` | `#43A2CA` | `#7BCCC4` |
| `field-green` | środowisko, rolnictwo i krajobraz | `#EDF8E9` | `#1F2933` | `#006D2C` | `#31A354` | `#74C476` |
| `newsprint-grey` | fotografia dokumentalna i statystyka | `#F7F7F7` | `#1F2933` | `#252525` | `#636363` | `#969696` |
| `terracotta` | starożytność, architektura i rzemiosło | `#FEEDDE` | `#1F2933` | `#A63603` | `#E6550D` | `#FD8D3C` |
| `warning-oxide` | konflikt, ograniczenia i ryzyko | `#FEF0D9` | `#1F2933` | `#B30000` | `#E34A33` | `#FC8D59` |
| `civic-blue` | państwo, instytucje i prawo | `#F1EEF6` | `#1F2933` | `#045A8D` | `#2B8CBE` | `#74A9CF` |
| `coastal-green` | kontakty, porty i wymiana | `#F6EFF7` | `#1F2933` | `#016C59` | `#1C9099` | `#67A9CF` |
| `archive-magenta` | biografia, listy i pamięć kultury | `#F1EEF6` | `#1F2933` | `#980043` | `#DD1C77` | `#DF65B0` |
| `royal-purple` | dwór, kultura i władza | `#F2F0F7` | `#1F2933` | `#54278F` | `#756BB1` | `#9E9AC8` |
| `rose-index` | idee, prądy i sieci społeczne | `#FEEBE2` | `#1F2933` | `#7A0177` | `#C51B8A` | `#F768A1` |
| `historical-red` | wojna, represje i ostrzeżenia | `#FEE5D9` | `#1F2933` | `#A50F15` | `#DE2D26` | `#FB6A4A` |
| `botanical` | kultura materialna i środowisko | `#FFFFCC` | `#1F2933` | `#006837` | `#31A354` | `#78C679` |
| `map-depth` | migracje, przestrzeń i wody | `#FFFFCC` | `#1F2933` | `#253494` | `#2C7FB8` | `#41B6C4` |
| `ochre-atlas` | szlaki, gospodarka i starożytne miasta | `#FFFFD4` | `#1F2933` | `#993404` | `#D95F0E` | `#FE9929` |
| `amber-signal` | oś czasu, zmiana i konsekwencje | `#FFFFB2` | `#1F2933` | `#BD0026` | `#F03B20` | `#FD8D3C` |
| `gentle-accent` | lekka klasyfikacja lub zadania klas V–VI | `#F4F7F8` | `#1F2933` | `#BEAED4` | `#7FC97F` | `#FFFF99` |
| `vivid-dark2` | wyraźne kategorie, maksymalnie pięć naraz | `#F4F7F8` | `#1F2933` | `#D95F02` | `#1B9E77` | `#E7298A` |
| `civic-paired` | porównania A/B i mapy polityczne | `#F4F7F8` | `#1F2933` | `#1F78B4` | `#A6CEE3` | `#33A02C` |
| `balanced-set2` | łagodne role w ćwiczeniu lub syntezie | `#F4F7F8` | `#1F2933` | `#FC8D62` | `#66C2A5` | `#E78AC3` |
| `soft-set3` | wprowadzanie pojęć klas V–VI | `#F4F7F8` | `#1F2933` | `#FFFFB3` | `#8DD3C7` | `#FB8072` |
| `land-sea` | dwie strony konfliktu lub zmiany środowiska | `#F5F5F5` | `#1F2933` | `#A6611A` | `#018571` | `#DFC27D` |
| `growth-contrast` | dwie rozbieżne postawy lub skutki | `#F7F7F7` | `#1F2933` | `#D01C8B` | `#4DAC26` | `#F1B6DA` |
| `civic-debate` | spór polityczny, religijny lub prawny | `#F7F7F7` | `#1F2933` | `#7B3294` | `#008837` | `#C2A5CF` |
| `warm-cool` | porównanie dwóch modeli | `#F7F7F7` | `#1F2933` | `#E66101` | `#5E3C99` | `#FDB863` |
| `conflict-map` | front, granice i zestawienie stanowisk | `#F7F7F7` | `#1F2933` | `#CA0020` | `#0571B0` | `#F4A582` |
| `evidence-grey` | materiał źródłowy kontra komentarz | `#FFFFFF` | `#1F2933` | `#CA0020` | `#404040` | `#F4A582` |
| `temperature-change` | wieloczynnikowa zmiana i ocena | `#FFFFBF` | `#1F2933` | `#D7191C` | `#2C7BB6` | `#FDAE61` |

## Rodziny źródłowe

- **Sekwencyjne:** budują skalę, mapy, osie i relacje; nie są automatycznie paletą dla pięciu równoważnych kategorii.
- **Jakościowe:** tylko dla kilku równorzędnych kategorii; nigdy nie kolorują całego tekstu na slajdzie.
- **Rozbieżne:** dla dwóch wyraźnych biegunów oraz neutralnego środka; nie sugerują dobra/zła bez sensu historycznego.

## Przykład tokenów lokalnych

```css
:root {
  --color-canvas: #EFF3FF;
  --color-surface: #FFFFFF;
  --color-text: #1F2933;
  --color-accent: #08519C;
  --color-evidence: #3182BD;
  --color-signal: #6BAED6;
}
```

Powyższy przykład stosuje `atlas-blue`; identycznie mapuj role każdej innej pozycji z JSON.
