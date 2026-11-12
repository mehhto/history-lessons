# Kontrola wersji do przeglądu nauczyciela

- 28 slajdów; 35,5 min rdzenia + 2 min buforu = 37,5 min. Opcjonalny film z otwarciem i odpowiedzią: dodatkowo ok. 2,5 min, łącznie 40 min.
- `node classes/8/11-sprawa-polska-pod-koniec-wojny/qa.mjs`: PASS; wszystkie 28 slajdów w trzech rozmiarach 1024×768, 1280×720 i 1920×1080; 48 otwarć lightboxów, klawiatura, notatki, obrazy i geometria.
- Prywatny adres podglądu zwraca identyczne bajty indeksu, Markdownu, CSS, metadanych i wszystkich obrazów używanych na slajdach. Nie wymaga pushu.
- Sprawdzono statyczny kontrakt1.0 i kompozycję — bez ostrzeżeń. Osobna kontrola renderowania po integracji obrazów: PASS.
- Obejrzano świeżą planszę sekwencji; poprawiono zbyt małe mapy, dziedziczone białe tło z białymi tytułami zadań, układ podsumowania oraz geometrię notatek na mniejszym ekranie. Brak powiązania technicznego PASS z akceptacją nauczyciela.
- Wersja do odbioru, bez akceptacji nauczyciela. Nie wygenerowano PDF/PPTX, nie wykonano commit/push ani zmian wspólnych komponentów.

## Ograniczenia

- Mapa granic jest porównaniem przedwojennego i powojennego terytorium, nie odrębną mapą propozycji teherańskich ani dokładnym przebiegiem linii Curzona. Ponowne użycie przy konferencjach ma różne zadania orientacyjne i jest jawnie objaśnione w notatkach.
- Portret Osóbki-Morawskiego ma tylko140×195 px; nie podmieniono go na wariant ulepszony przezAI, pokazano w małym rozmiarze.
- Filmy: metadane/napisy potwierdzone, brak potwierdzonego odsłuchu. Film nie jest potrzebny do zrealizowania rdzenia lekcji.
- Mapa Polski Lubelskiej pokazuje wrzesień1944; legenda jest przy mapie, nie w osobnym pliku wymaganym do zajęć.
