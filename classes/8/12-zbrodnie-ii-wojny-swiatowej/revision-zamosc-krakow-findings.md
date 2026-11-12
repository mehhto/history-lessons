# Zamojszczyzna i krakowskie krzesła — wyniki dla autora prezentacji

## Do wykorzystania
- `assets.json`: pobrane pliki, rozmiary, SHA-256, autorzy, podpisy źródłowe, licencje lub jawny brak wolnej licencji. Trzy fotografie rekomendowane: rzeczywiste krzesła w Krakowie (2016), dzieci przy posiłku w Łaskarzewie (1942 lub 1943) i wysiedlona wieś na Zamojszczyźnie (bez ustalonej nazwy i daty). Mapa z wystawy z 1946 r. ma status kontekstowy; dodatkowa fotografia furmanek — rezerwowy z zastrzeżeniem podpisu.
- `excerpts.json`: dwa krótkie literalne fragmenty do slajdów, osobno podstawa statystyk i znaczenia pomnika; przy każdym cytacie zapisany tekst źródła, URL i wyraźne rozróżnienie świadka od współczesnego opracowania.
- `routes.json`: trzy udokumentowane kierunki, cztery punkty geograficzne, cytaty i ograniczenia rekonstrukcji. Nie wykonano wymyślonego diagramu strzałkowego.
- `sources.json`, `sources/`: zapisane strony HTML i teksty oraz pełne PDF-y. `teacher-urls.json` zachowuje dokładnie pełną listę sześciu adresów nauczyciela; wszystkie sześć pobrano i przejrzano.
- `verify.py` → `verification.json`: ponawialna kontrola hashy, literalności wszystkich fragmentów, współrzędnych i końców tras.

## Statystyki: wspólny zakres
Dla akcji od nocy 27/28 listopada 1942 do sierpnia 1943 najbezpieczniejsze brzmienie to: **około 300 wsi; około 110 tys. wysiedlonych, w tym około 30 tys. dzieci**. Dzieci są częścią liczby 110 tys.; to nie liczba zabitych i nie bilans wszystkich niemieckich represji w regionie podczas wojny.[7][29]

**297 wsi nie jest zmyślone**: podaje je Piotr Biliński na s. 128 (PDF s. 4), odsyłając do Anny Glińskiej, a następnie powtarza w podsumowaniu. PAP/dzieje.pl podaje 294, IPN zaokrągla do około 300. Do slajdu zalecam zaokrąglenie, a rozbieżność zostawić w dokumentacji.[12][17][7]

## Mapa: czego nie udało się znaleźć
Nie znaleziono gotowej opublikowanej mapy spełniającej cały wymagany ciąg **wysiedlona wieś → obóz Zamość → rzeczywiste miejscowości docelowe**. To wynik przejrzanego zestawu, nie twierdzenie, że taka mapa nigdzie nie istnieje. Pozyskana mapa z 1946 r. pokazuje obszar i wsie wysiedlone, nie cele deportacji poza regionem. Przejrzano też 15 plansz wystawy IPN i polski katalog Muzeum Dzieci Polskich; mapy obszaru lub planu osadniczego nie zastępują mapy dróg deportacji.

Do uczciwej własnej mapy geograficznej `routes.json` daje: **Skierbieszów → obóz przy ul. Lubelskiej w Zamościu** (furmanki), następnie odrębne kierunki różnych grup: **Zamość → Siedlce** (dzieci i osoby starsze, zima 1942/1943) oraz **Zamość → Auschwitz-Birkenau** (trzy transporty). Muzeum Auschwitz odróżnia pierwszy wyjazd 10 XII 1942 od przyjazdu nocą 12/13 XII; kolejne przyjazdy to noce 15/16 XII 1942 i 4/5 II 1943.[12][29][25]

Współrzędne obozu w Zamościu są punktem terenu obozowego; dla Siedlec współrzędne oznaczają miasto, nie konkretną rampę. Łączniki mogą oznaczać udokumentowane kierunki, nie szczegółowy przebieg torów. Nie dodawać Warszawy tylko na podstawie wzmianki o dystrykcie warszawskim ani dowolnego miasta Rzeszy jako celu germanizacji.

## Kraków: znaczenie, nie rachunek ofiar
Miejski serwis i audiodeskrypcja z konsultacją merytoryczną Katarzyny Kocik podają **70 krzeseł łącznie**; audiodeskrypcja rozbija je na 33 większe i 37 mniejszych. W serwisie przewodnickim występuje 68. Najbezpieczniej nie budować zadania na spornej liczbie: krzesła nawiązują do pozostawionego dobytku i nieobecnych mieszkańców getta. **Nie potwierdzono równania jedno krzesło = 1000 ofiar**; nie stosować go jako faktu.[15][9]

Krótki cytat Pankiewicza o szafach, stołach i kredensach jest przytoczony dosłownie przez Fundację Pełni Kultury. Jest to fragment relacji świadka przekazany za współczesną publikacją, a nie pierwodruk odczytany w tej kwerendzie. Strona nie wskazuje wydania ani strony wspomnień. Drugim cytatem do slajdu jest niedrastyczny fragment wspomnienia Zygmunta Węcławika, przytoczony przez Bilińskiego z odsyłaczem do zbioru relacji z 1968 r.[9][12]

## Ważne ograniczenia
- Wikimedia: oryginał zdjęcia krzeseł blokował pobranie (403/429); skutecznie pobrano i obejrzano rzeczywisty wariant 1280 × 828 z `thumb.wikimedia.org`. Fotografia ma CC BY 3.0; atrybucja i link do licencji są w manifeście.
- Fotografie IPN i reprodukcja z katalogu muzeum **nie mają potwierdzonej wolnej licencji**. W dokumentacji jest dokładna informacja o prawach zastrzeżonych; nie wolno nazwać ich CC lub domeną publiczną. Publiczna publikacja prezentacji wymaga osobnej oceny praw do użycia. Samo pobranie nie udziela licencji.
- Napisy kredytowe pozostają w dokumentacji, zgodnie z wymaganiem nauczyciela; na slajdach można zachować tylko potrzebny kontekst historyczny (osoba, miejsce, data), bez bloków technicznych.
- `166-178534.jpg` to współczesna kompozycja redakcyjna, nie czyste zdjęcie ani mapa: odrzucona.
- Strona R. Sodela ma m.in. podejrzaną datę dyrektywy „31 października 1944” we fragmencie o przygotowaniu akcji; nie przenosić tego zdania do prezentacji. Użyte liczby porównano z innymi źródłami.
- Rozdziały `lekcja.auschwitz.org` były niedostępne z powodu certyfikatu TLS; wykorzystano pełny, dostępny tekst podcastu na głównej domenie muzeum. RCIN zwrócił stronę weryfikacji przeglądarki, nie treść artykułu; nie stanowi ona dowodu.
- Repozytorium prezentacji nie było modyfikowane. Wszystkie pliki robocze tej kwerendy znajdują się w bieżącym katalogu.

## Sources

[7] https://przystanekhistoria.pl/pa2/tematy/wysiedlenia/104380,Pacyfikacja-Zamojszczyzny.html
[9] https://pelnikultury.pl/nasze-teksty/plac-bohaterow-getta
[12] https://bibliotekanauki.pl/chapters/63162270.pdf
[15] https://www.krakow.pl/instcbi/35881/inst/159626/1061/Plac-Bohaterow-Getta.html
[17] https://dzieje.pl/aktualnosci/75-lat-temu-niemcy-rozpoczeli-akcje-wysiedlen-zamojszczyzny
[25] https://www.auschwitz.org/edukacja/e-learning/podcasty/deportacje-polakow-z-zamojszczyzny-do-kl-auschwitz
[29] https://muzeumdziecipolskich.pl/f/katalog-update-web.pdf
