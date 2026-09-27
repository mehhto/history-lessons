# Kartkówki i sprawdziany — DOCX

Źródło prawdy: Markdown w `tests/<klasa>/NN-temat.md`. `<!-- teacher-key -->` oddziela materiał uczniowski od klucza; **do Worda trafi wyłącznie część uczniowska**.

## Edytowalny zakres

Treść zostaje przekonwertowana do natywnych elementów Word: nagłówków, akapitów, list punktowanych i tabel. Lokalnie dołączone obrazy z `tests/<klasa>/assets/` są zachowane jako obrazy DOCX. Nie jest to zrzut slajdów ani PDF wklejony do Worda. Pola i linie do ręcznego wpisywania odpowiedzi pozostaną tekstem, a nie interaktywnymi kontrolkami.

## Ręczne użycie

1. Uzupełnij Markdown, oznacz część nauczycielską dokładnie jednym `<!-- teacher-key -->` i zapisz lokalne obrazy w `assets/`.
2. W katalogu sprawdzianów/kartkówek wybierz materiał i kliknij **Pobierz DOCX**. Zapisz plik na swoim urządzeniu i otwórz w Wordzie lub LibreOffice.
3. Przy zmianie źródła w repozytorium usuń stary DOCX, aby panel przestał go oferować, a następnie wygeneruj nową kopię.

Wygenerowane pliki Word są pomijane przez Git. PDF pozostaje osobnym, gotowym do druku eksportem.