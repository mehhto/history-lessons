# Kontrola wersji do przeglądu

- 22 slajdy i 22 notatki; ciągły plan 38 minut, w tym 6 minut analizy źródła oraz 5 minut zapisu notatki. Pytania poprzedzają cały dostarczony fragment ze s.73; zachowane oba `[...]`, glosa `[konflikt]` i końcowa klauzula o niepomaganiu władzom.
- Własna kontrola rodzica: przejrzano całą sekwencję oraz duże ujęcia otwarcia, źródła, mapy/lightboxu i notatki. Nowe screenshoty po zmianach w `.hermes/reviews/6/12-panstwo-bez-stosow/`.
- Chromium: komplet slajdów, geometria i notatki PASS w 1024×768, 1280×720, 1920×1080. Osiem użytych obrazów dekoduje się, każdy otwiera lightbox myszą i klawiaturą, Escape zamyka i przywraca fokus. Mapa bez dodatkowych podpisów; legenda zachowana.
- Pierwsza kontrola rodzica dwukrotnie wykazała crash Chromium podczas dekodowania dużych fotografii. Zapisano cztery proporcjonalne wersje projekcyjne do 1920 px; oryginały i licencje zachowano. Po zmianie pełna kontrola zakończyła się PASS (`qa-report.json`).
- Prywatny URL: odczytane `slides.md`, `lesson.css`, `teacher-guide.html` są identyczne bajtowo z aktualną wersją lokalną.
- Plik `przeglad-panstwo-bez-stosow-portable.html` skopiowano do pustego katalogu i otwarto przez `file://`. Wszystkie 22 slajdy i 8 obrazów PASS; trzy viewporty PASS, mapa/lightbox i notatki PASS, zero żądań HTTP(S) i błędów (`qa-offline-report.json`). To artefakt do przeglądu, nie akceptacja nauczyciela.
- `check:composition` PASS. Bez współdzielonych zmian, stage/commit/push, PDF/PPTX. Pełnego testowania niezwiązanych katalogów nie wykonywano.
- Przewodnik zawiera trzy ciekawostki, pięć pytań z odpowiedziami, mowę otwierającą/końcową, wariant bez prezentacji i opcjonalny nowy film IAPC 1:40. Dla filmu sprawdzono metadane, polskie ASR i próbki obrazu; bez odsłuchu i testu szkolnego odtwarzania. Nie osadzono go w rdzeniu.
- Źródła i licencje są w przewodniku oraz dokumentacji, nie na slajdach ani w lightboxie. Przy przekazywaniu pliku prezentacji zachować przewodnik z pełną proweniencją.

## Druga poprawka symboli
Odrzuconą ikonę krucyfiksu zastąpiono powiększoną fotografią włoskiego zabytku XVI w. z kolekcji Met, obiekt 197145, dane instytucji potwierdzają public domain. Półksiężyc zastąpiono czytelnym, wypełnionym znakiem otwartym w prawo; nie przedstawiono poprzedniej orientacji jako błędu religijnego. Obejrzano aktualne slajdy 5 i 11. Komplet istniejącego QA live/file i wszystkich 13 obrazów PASS, 3 rozdzielczości, zero błędów/żądań offline, odczyt prywatnego URL identyczny. Zachowano zdjęcia świątyń.

## Korekta symboli po przeglądzie nauczyciela
Dodano pięć ilustracji: krucyfiks na slajdzie 5, krzyż prawosławny na 6, menorę i Gwiazdę Dawida na 10, półksiężyc na 11. Zachowano fotografie i 22 slajdy/38 minut. Odświeżono guide/offline. Aktualne raporty obejmują 13 obrazów; wszystkie dekodują się i otwierają bezpodpisowy lightbox myszą/klawiaturą, fokus wraca po Escape. Trzy rozdzielczości live i offline PASS, zero błędów i zewnętrznych żądań. Obejrzano świeże ujęcia wszystkich czterech poprawionych slajdów. Prywatny podgląd identyczny z lokalnym tekstem/CSS/guide. Przegląd nauczyciela zapisano; końcowa akceptacja nadal oczekiwana.
