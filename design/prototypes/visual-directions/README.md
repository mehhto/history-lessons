# Prototyp kierunków wizualnych

> **PROTOTYP DO DECYZJI — nie jest lekcją programową.** Po wyborze należy zapisać wnioski w `NOTES.md`, przenieść zatwierdzone zasady do systemu prezentacji i usunąć kod prototypu.

## Pytanie projektowe

Który język wizualny najlepiej łączy energię, czytelność z projektora i powagę autentycznych źródeł w lekcjach historii dla klasy IV?

## Porównywane warianty

- **A · Editorial** — twarda geometria, duża typografia, dokumentalny kontrast.
- **B · Archiwum** — warstwy współczesnych kart archiwalnych bez imitacji pergaminu.
- **C · Wycinanka** — wyraziste warstwy i kształty książki edukacyjnej, z prostą ramą dla prawdziwego źródła.

Każdy wariant pokazuje identyczne pięć typów slajdu: otwarcie, wyjaśnienie, źródło, aktywność i syntezę.

## Uruchomienie

Z katalogu głównego repozytorium:

```bash
npm run serve
```

Następnie otwórz:

```text
http://127.0.0.1:8080/design/prototypes/visual-directions/
```

Jeżeli serwer poda inny port, użyj adresu wyświetlonego w terminalu. Wariant zmienia się dolnym przełącznikiem bez opuszczania bieżącego slajdu. Bezpośrednie adresy:

```text
?variant=editorial
?variant=archive
?variant=cutout
```

## Kryteria decyzji

Dla każdego wariantu oceń:

1. Czy hierarchię da się odczytać natychmiast?
2. Czy autentyczne źródło jest ważniejsze niż dekoracja?
3. Czy uczeń klasy IV odbierze styl jako żywy, ale nie infantylny?
4. Czy pięć funkcji slajdu różni się rytmem?
5. Czy styl nadaje lekcji charakter bez narzucania się każdemu tematowi?
6. Co warto zachować nawet po odrzuceniu całego wariantu?

## Granice

- To porównanie kierunków, nie finalnych motywów produkcyjnych.
- Nie należy oceniać poprawności całej lekcji — treść jest celowo ograniczona do pięciu reprezentatywnych slajdów.
- Nie eksportować do PDF/PPTX.
- Nie dodawać do katalogu `classes/`.
