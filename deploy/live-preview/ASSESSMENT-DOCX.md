# Sprawdziany i kartkówki — edycja i review

## Krótka ścieżka

1. **Zakres i zadania.** Autor ustala klasę, czas, omówiony materiał i punktację. Zapisuje arkusz w `tests/<klasa>/NN-temat.md`; zadania, klucz i kryteria mają zgodne numery.
2. **Wersja do poprawiania.** Nauczyciel dostaje od pierwszego review **edytowalny DOCX**, nie sam PDF. W panelu wybiera **Edytuj w Wordzie** (dostępna nazwa linku: „Pobierz DOCX”). Plik działa także w LibreOffice; zawiera wyłącznie część uczniowską.
3. **Jedna runda uwag.** Nauczyciel zmienia polecenia, odpowiedzi, punktację i miejsce na zapis bezpośrednio w Wordzie. Może użyć komentarzy lub śledzenia zmian i odesłać plik. Do uwag wystarczą numery zadań; nie wymagamy osobnego formularza. Klucz i kryteria ocenia osobno w rozmowie z autorem — nie dopisuje ich do arkusza ucznia.
4. **Scalenie poprawek.** Autor odczytuje zmieniony DOCX, także komentarze i śledzone zmiany, i przenosi uzgodnione poprawki do źródłowego Markdownu. Równocześnie poprawia klucz, kryteria, sumę punktów i wariant dostosowany, jeśli zmiana go dotyczy. Nie zastępuje uwag nauczyciela nową wersją od zera. Nie rozstrzyga sprzecznych komentarzy bez uzgodnienia.
5. **Kontrola i akceptacja.** Autor ponownie generuje DOCX, sprawdza zachowanie treści i obrazów, edytowalność tabel, punktację i separację klucza. Sprawdza miejsce na pismo oraz paginację w rzeczywistym rendererze dokumentów, gdy jest dostępny; podgląd HTML nie dowodzi liczby stron Worda. Oddaje aktualny plik i krótko wskazuje zmienione zadania. PDF do rozdania powstaje po akceptacji.

## Co jest edytowalne?

Nagłówki, akapity, listy i komórki tabel są natywnymi elementami Worda. Można zmieniać tekst, dopisywać odpowiedzi i modyfikować kolumny. Checkboxy są znakami tekstowymi, nie interaktywnym formularzem. Mapy pozostają osobnymi obrazami z zachowaniem proporcji, a nie zrzutem całej strony. Nie opieramy układu na polach tekstowych ani pozycjonowanych elementach, które rozpadają się po zmianie polecenia.

## Źródło i eksport

Markdown pozostaje źródłem publikowanej wersji. Dokładnie jeden `<!-- teacher-key -->` oddziela arkusz od klucza; do uczniowskiego DOCX, podglądu i PDF trafia wyłącznie tekst przed separatorem. Lokalne obrazy przechowujemy w `tests/<klasa>/assets/`.

DOCX jest generowany przy każdym pobraniu z bieżącej treści i obrazów, także w trybie podglądowym. Nie trzeba usuwać starego pliku na serwerze. Poprawki w pobranym Wordzie **nie zapisują się automatycznie w repozytorium** — plik trzeba odesłać autorowi. Po ręcznej edycji DOCX nie używaj panelowego PDF jako wydruku tych poprawek, dopóki autor nie zsynchronizuje źródła; można wydrukować zmieniony plik bezpośrednio z Worda.

Nie dodajemy edytora przeglądarkowego ani automatycznego importu DOCX. Word/LibreOffice zapewniają już edycję i komentarze, a kontrolowane scalenie chroni klucz, punktację i źródła przed rozjazdem.
