# Lokalne piloty wizualne klas V i VIII — Izrael oraz polityka okupacyjna III Rzeszy, v1

Status: **dwa lokale piloty**. Nie są wspólnym katalogiem stylów ani automatyczną regułą dla innych lekcji.

Zsyntetyzowane, przenośne reguły z obu pilotów zapisano w [`visual-grammar-grade5-8-v1.md`](visual-grammar-grade5-8-v1.md). Ten dokument zachowuje wyłącznie lokalne palety, dominanty i rytm obu lekcji.

## Wspólna zasada przeniesiona z pilota „Renesans”

Nie kopiujemy jego palety ani ornamentu. Przenosimy tylko sprawdzoną logikę: każdy slajd ma jedną dominantę, sąsiednie funkcje dydaktyczne mają różną geometrię, źródło historyczne pozostaje neutralne i większe niż dekoracja, a zadanie oraz synteza są od razu rozpoznawalne.

## Klasa V: „W starożytnym Izraelu” — atlas–archiwum

- **Paleta:** atrament `#243447`, papier `#F4EBDD`, terakota `#B8523A`, złoto `#C89C3D`, oliwka `#65724A`.
- **Ton:** konkretny, ciepły i poważny; bez imitacji pergaminu oraz bez dziecięcych symboli.
- **Dominanty:** mapa regionu, zwój Tory, schemat Świątyni, fotografia Zachodniego Muru.
- **Rytm:** otwarcie źródłowe → mapa → pamięć/tradycja → oś państwa → łańcuch utraty → zadanie → pojęcia → źródła → synteza → spokojny bilet.

## Klasa VIII: „Polityka okupacyjna III Rzeszy i Zagłada Żydów” — dokumentalny zapis okupacji

- **Paleta:** grafit `#28323B`, papier `#ECE6DA`, rdza `#A64B3C`, przygaszony błękit `#4E7187`, piasek `#C6A56A`.
- **Ton:** dokumentalny, powściągliwy i poważny; bez czarno-cyjanowej stylistyki technicznej, bez grywalizacji i bez dekoracji na zdjęciach.
- **Dominanty:** fotografia okupowanego Paryża, mapy Europy i okupowanej Polski, fotografie dokumentalne, źródło sprawcy, statystyka Zagłady.
- **Rytm:** otwarcie dokumentalne → modele okupacji → Polska pod okupacją → prześladowania → źródło sprawcy → Zagłada → postawy i pomoc → synteza → bilet.
- **Wersja v2:** chłodna neutralna baza zastępuje krem jako domyślne tło. Fotografia, mapa i dokument są dominantami; opis może biec wzdłuż osi lub w wyraźnej karcie. Wypełnione karty z tłem i obramowaniem zostają wszędzie tam, gdzie budują hierarchię porównania, procesu lub zadania; problemem jest ich bezrefleksyjna powtarzalność, nie sama karta.
- **Kontenery okupacji:** porównania korzystają z jednej tablicy z wewnętrznym podziałem; etapy czasu z jednego pasa procesu; definicje z indeksu pojęć. Te trzy formy są równie wyraźne jak karty, ale nie tworzą jednej, przytłaczającej estetyki.

## Lightbox w obu pilotach

- W warstwie uczniowskiej podpis może krótko objaśniać zdjęcie, obraz, grafikę lub mapę, ale nie pokazuje kredytu, licencji, repozytorium ani adresu źródłowego. Te dane pozostają w `sources.md`.
- Lightbox nie kopiuje automatycznie `figcaption`, kredytu, licencji ani adresu źródłowego zdjęcia, obrazu, grafiki lub mapy.
- Krótki podpis opisowy jest dopuszczalny tylko jako jawny `data-lightbox-caption`; nie może zawierać kredytu ani źródła.
- Pełnoekranowe mapy pozostają bez podpisu w lightboxie. Pełna dokumentacja pochodzenia i licencji pozostaje w `sources.md`.

## Bramka

Oba decki wymagają świeżego renderu, arkusza kontaktowego i akceptacji nauczyciela. `review:slides` przed renderem usuwa stare `.png` i `index.html`, aby osierocony zrzut nie udawał dodatkowego slajdu. Review obejmuje też test lightboxa bez źródeł, test klawiatury oraz test działania wewnątrz iframe panelu. Przed akceptacją nie zmieniamy `metadata.json`, nie ustawiamy `teacher_reviewed` i nie eksportujemy nowej wersji PDF/PPTX.
