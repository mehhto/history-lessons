# Biblioteka palet prezentacji — v1

Status: **zasób wspólny dla przyszłych prezentacji**. Nie zmienia istniejących pilotów automatycznie.

## Źródło i sposób doboru

14 palet to celowo krótka selekcja wielobarwnych schematów jakościowych i rozbieżnych z [ColorBrewer 2](https://colorbrewer2.org/export/colorbrewer.json), ponownie sprawdzona 21 IX 2026. Usunięto wszystkie sekwencje tonalne: są właściwe dla skali na mapie lub wykresie, ale nie dla fundamentu całej prezentacji. Każda pozycja ma przypisane role, więc autor nie wybiera pojedynczych kolorów losowo. Dane maszynowe: [`presentation-palettes-v1.json`](presentation-palettes-v1.json).

`canvas` jest tłem, `surface` polem treści, `ink` tekstem, `accent` prowadzi hierarchię, `evidence` oznacza materiał/dowód, a `signal` jest pojedynczym sygnałem zadania, daty lub ostrzeżenia. `ink` ma co najmniej kontrast AA z `canvas`; kolorowe role nie służą do długiego tekstu.

## Zasady użycia

1. Wybierz paletę po funkcji i tonie lekcji, nie po tym, czy jest „ładna” w próbniku.
2. Nie używaj gradientów. Kolory są płaskimi powierzchniami i liniami.
3. Nie używaj kremu jako automatycznego `canvas`; korzystaj z wartości palety.
4. Na jednym slajdzie użyj maksymalnie dwóch aktywnych kolorów poza `canvas`, `surface` i `ink`.
5. W decku zachowaj jedną paletę. Zmieniaj geometrię slajdów, nie jej fundament kolorystyczny.
6. Długi tekst pozostaje w `ink`; przed użyciem sprawdź kontrast tekstu na finalnym renderze.

## 14 palet

| Paleta | Najlepsza dla | Canvas | Ink | Accent | Evidence | Signal |
|---|---|---|---|---|---|---|
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
| `civic-balance` | dwie strategie, postawy lub skutki | `#FFFFBF` | `#1F2933` | `#A50026` | `#006837` | `#FDAE61` |
| `spectrum-change` | wieloczynnikowa zmiana, porównanie lub synteza | `#FFFFBF` | `#1F2933` | `#9E0142` | `#3288BD` | `#66C2A5` |

## Rodziny źródłowe

- **Jakościowe:** dla kilku równorzędnych kategorii; nigdy nie kolorują całego tekstu na slajdzie.
- **Rozbieżne:** dla dwóch wyraźnych biegunów oraz neutralnego środka; nie sugerują dobra/zła bez sensu historycznego.

## Przykład tokenów lokalnych

```css
:root {
  --color-canvas: #F7F7F7;
  --color-surface: #FFFFFF;
  --color-text: #1F2933;
  --color-accent: #CA0020;
  --color-evidence: #0571B0;
  --color-signal: #F4A582;
}
```

Powyższy przykład stosuje `conflict-map`; identycznie mapuj role każdej innej pozycji z JSON.
