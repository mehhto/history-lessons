# Krótsza droga do dobrej lekcji

Procedura dla nowych lekcji i zleconych rewizji. To kolejność pracy autora, nie dodatkowy formularz ani nowy kontrakt blokujący stare pakiety. Etapy 4–5 są jednym miejscem ustalania zakresu QA, wyboru podglądu i warunków eksportu; skille i referencje opisują szczegóły techniczne, nie konkurencyjne ścieżki. Zachowaj istniejące wymagania źródłowe, dostępność i granice publikacji. Przy prośbie wyłącznie o recenzję oddaj raport, nie wdrażaj propozycji.

## 1. Wybierz sprawdzone rozwiązania, nie projektuj wszystkiego od nowa

- Odczytaj zlecenie, właściwy fragment podstawy, dostarczone materiały i wcześniejsze uwagi. Ustal rzeczywisty czas pracy, nie tylko długość dzwonka. Nie otwieraj ponownie wybranego wariantu; pytaj tylko o brak zmieniający zakres, źródło lub możliwość wykonania zadania.
- Dobierz jedną niedawno przejrzaną lekcję jako wzorzec konkretnego rozwiązania i obejrzyj jej źródła oraz istniejący podgląd. Nie przeglądaj całego archiwum. Akceptacja pojedynczej cechy nie oznacza, że każdy element tej lekcji jest wzorcem.
- Przenoś funkcję i sprawdzoną geometrię komponentu, nie temat, zestaw obrazków ani całe `lesson.css`. Zachowuj pochwaloną typografię przy korekcie danej lekcji; nie zamrażaj jej dla całej serii. Między lekcjami świadomie mieszaj zgodne elementy sprawdzonych stylów: parę krojów z lokalnej kolekcji, paletę z biblioteki, kompozycję otwarcia, tła, obramowania i rytm układów. W obrębie jednej prezentacji zachowaj spójną hierarchię i obsługę; nie losuj stylu każdego slajdu ani nie buduj generatora losowych wariantów. Przed oddaniem porównaj planszę z jedną ostatnią lekcją: ta sama geometria z innym kolorem i obrazkami nadal jest klonem. Nie powtarzaj granatowego otwarcia, szarego wnętrza lub układu tekst–portret z przyzwyczajenia.

### Punkty odniesienia

To rozpoznawalne rozwiązania z ostatnich materiałów, nie lista bezwarunkowo zaakceptowanych szablonów:

- `classes/5/05-sparta-i-wojny-z-persami`: orientacja na mapie przed wydarzeniem; pytania przed pełnym źródłem; wyposażenie pokazane na całej postaci; rozróżnienie wyniku bitwy, legendy i pamięci.
- `classes/6/10-ostatni-jagiellonowie`: duża genealogia i mapy; mechanizm sekularyzacji i lenna; różnica między traktatem a ceremonią; pełny fragment dokumentu; budżet zapisu notatki. Nie kopiuj powtórek obrazów ani całej sekwencji map jako obowiązkowej recepty.
- `classes/7/09-kultura-polska-pod-zaborami`: instytucja lub twórca → działanie → znaczenie, nie katalog nazwisk; fakt oddzielony od idei; indywidualne przygotowanie przed rozmową w parze; merytoryczna notatka. Seria podobnych układów portret–tekst nie jest wzorcem rytmu do powielania.

Zgoda na wysłanie do repozytorium, techniczne QA, odbyty przegląd i akceptacja dydaktyczna to różne dowody. Uznawaj rzeczywistą opinię nauczyciela z rozmowy; nie każ jej powtarzać z powodu brakującego pola metadanych. Nowa, jeszcze nieprzejrzana lekcja nie staje się wzorcem akceptacji tylko dlatego, że jest najnowsza.

**Koniec etapu:** wiadomo, co zachować i którą klasę wcześniejszych błędów ominąć; nie powstała nowa runda wyboru estetyki.

## 2. Sprawdź logikę lekcji przed dopracowaniem slajdów

Użyj istniejącej mapy celów i przebiegu w `lesson.md`, bez osobnego dokumentu kontrolnego:

- Wiedza i dostępny materiał → działanie ucznia → indywidualny dowód → odpowiadający mu klucz. Sprawdź rzeczywistą kolejność `slides.md`, nie tylko deklarację w scenariuszu.
- Wyjaśniaj: kontekst → pojęcie lub mechanizm → konkretny przykład → znaczenie. Uczeń musi mieć przesłanki przed zastosowaniem; przy zadaniu odkrywczym nie podawaj wcześniej wniosku, który ma sam uzasadnić.
- Wybierz jedno główne zadanie wymagające zastosowania, porównania, wyjaśnienia albo argumentu. Nie usuwaj potrzebnego przypominania i wsparcia, ale nie nazywaj przepisywania analizą. Tabela potrzebuje wniosku relacyjnego. Występ grupy potrzebuje zadania dla słuchaczy.
- Czytaj pytanie razem z tytułem, podpisem, obrazem i widocznym tekstem: odpowiedź nie może być już podana. Nie dopisuj rutynowych pytań o ograniczenia źródła, jeśli nie są celem lekcji.
- Sprawdź dokładną treść cytatu i materiał rozdawany uczniom przed układaniem zadania. Przy linku przeczytaj tytuł i fragment wspierający dane twierdzenie. Zachowaj pełne granice dostarczonego fragmentu; nie zastępuj go najsłynniejszym zdaniem. Ustal datę i zakres mapy oraz prawa konkretnego zasobu.
- Zsumuj czas narzędziem, uwzględniając lekturę, zapis, podział na grupy, przejścia, odpowiedzi i omówienie. Zostaw jawny bufor dostosowany do aktywności. Chroń syntezę i krótkie sprawdzenie; najpierw zamień słabe zadanie lub usuń dodatek, zamiast dokładać aktywności.

**Koniec etapu:** zadanie jest wykonalne z dostępnych materiałów, kolejność i klucz się zgadzają, a przebieg mieści się w realnym czasie. Szersze wymaganie programowe może być realizowane w kilku lekcjach — wskaż zakres, nie dopisuj całego działu do jednego spotkania.

## 3. Zbuduj cały pakiet w jednym spójnym przebiegu

- Dobierz potrzebne źródła przed kompozycją. W istniejącym układzie wykorzystuj znaną lokalną typografię i komponenty; zmieniaj tylko to, czego wymaga treść. Nowy kierunek wizualny lub ryzykowny materiał sprawdź wcześnie na kilku rzeczywistych slajdach, np. otwarciu, najgęstszym źródle, mapie i zadaniu. To wewnętrzna próba, nie obowiązkowy dodatkowy etap akceptacji nauczyciela. Przy zwykłej korekcie pomiń ją.
- Planuj sekwencję według znaczenia: duży dowód, wyjaśnienie mechanizmu, porównanie, działanie, synteza. Zmiana koloru, zdjęcia lub etykiety layoutu nie naprawia jednakowej geometrii sąsiadujących slajdów. Różnicuj skalę źródła, kierunek czytania i hierarchię; nie wprowadzaj losowości ani obowiązkowej zmiany co określoną liczbę slajdów.
- Tła mogą być jasne, ciemne, kolorowe lub oparte na właściwym źródle, z pewną powierzchnią pod tekstem; bez gradientów i monotonnej szarości. Ilustrację powtarzaj tylko dla innej potrzebnej operacji ucznia, nigdy jako wypełniacz. Mapa zachowuje pełne etykiety i maksymalny użyteczny rozmiar.
- Dokument ma jedną spokojną powierzchnię czytania i pełny uzgodniony fragment. Stosuj 22–28 px zależnie od długości; zmień najpierw powierzchnię i odstępy. Nie zmniejszaj całej prezentacji ani nie skracaj samowolnie źródła, aby ukryć błąd składu.
- Zapisz tę samą treść i kolejność w slajdach, karcie, scenariuszu, notatkach, podsumowaniu i ocenianiu. Nie twórz równoległych wersji pytań lub kluczy podczas późniejszego polerowania. Zachowuj użyteczne wyjaśnienia, nie sprowadzaj lekcji do haseł.

**Koniec etapu:** istnieje kompletny pakiet i jedna zgodna ścieżka prowadzenia; nie wymaga ona nieobecnego podręcznika, mapy konturowej ani wydruku. Jawnie dostarczany przez nauczyciela materiał może pozostać zależnością.

## 4. Jedna końcowa kontrola, a w poprawkach tylko zmieniony zakres

- Najpierw tanie kontrole: struktura, literalne wartości kontraktu, ścieżki, źródła, kolejność, liczby elementów zadań, zgodność klucza oraz czas. Nie uruchamiaj Chromium po to, aby znaleźć brak wymaganej klasy HTML.
- W pętli poprawki badaj zmienione slajdy i zależności. Przed oddaniem przejdź całą aktualną lekcję: obrazy i fonty gotowe, geometria, notatki, klawiatura, lightboxy oraz inne interakcje. Łącz pomiary i screenshoty w jednym przejściu, jeśli istniejące narzędzie to obsługuje.
- **Obecne polecenia nie są jednym zintegrowanym walidatorem.** `npm run check:contract -- --lesson <katalog>`, `npm run check:composition -- --lesson <katalog>`, `npm run check:render -- --lesson <katalog>` i `npm run review:slides -- --lesson <katalog>` wykonują różne kontrole. Kompozycja może tylko wypisać ostrzeżenia; kontrakt może zakończyć się kodem 0 ze statusem `POMINIĘTO` przy braku opt-in — to nie pozytywny wynik walidacji. Nie włączaj nowego kontraktu w starej lekcji tylko dla zielonego raportu. `npm run check -- --allow-pending` jest raportem całego repozytorium, nie kontrolą pojedynczej lekcji. Nie wymyślaj filtrów CLI; użyj istniejącego dopasowanego skryptu QA, jeśli rzeczywiście zbiera potrzebne dowody. Nie buduj kolejnego runnera dla pojedynczego zlecenia.
- Obejrzyj świeżą planszę całej sekwencji oraz w pełnej rozdzielczości otwarcie, mapy, dokumenty, zadania, syntezę, notatkę i skorygowane miejsca. Jednocześnie sprawdź treść i dydaktykę. Nie kończ oceny na braku overflow. Po ostatniej zmianie odśwież dotknięte ujęcia i planszę; nie pokazuj poprzedniej wersji jako aktualnej.
- Po ponownym identycznym błędzie zmierz geometrię i sprawdź kaskadę CSS albo hipotezę merytoryczną. Nie powtarzaj całego QA po kolejnych przypadkowych zmianach rozmiaru.
- Pełne testy repozytorium uruchamiaj przy zmianach wspólnych i przed zleconą publikacją, nie po każdej lokalnej poprawce. Test offline i eksportów wykonuj dla zamówionego artefaktu; nie generuj PDF/PPTX, aby zadowolić status przed akceptacją. Przedakceptacyjny HTML offline jest wyłącznie dopuszczonym artefaktem do przeglądu.

**Koniec etapu:** dowody dotyczą bieżącej wersji; pozostały co najwyżej jawne decyzje nauczyciela. Nie zakładaj możliwości wspólnego przebiegu tylko na podstawie istnienia kilku komend.

## 5. Oddaj wersję do jednej całościowej oceny

- Domyślnie korzystaj z istniejącego prywatnego podglądu. Osobny, ograniczony podgląd uruchamiaj tylko przy braku lub awarii panelu albo na wyraźne żądanie izolacji; zabezpieczenia i weryfikację opisuje `Preview delivery gate` w skillu `history-lesson-authoring`. Gdy bezpieczny podgląd jest niedostępny, można przekazać aktualne screenshoty lub ignorowany HTML offline wyłącznie do przeglądu. Podaj aktualny link lub zamówiony plik, krótko: co gotowe, co rzeczywiście sprawdzone i co pozostaje otwarte. Nie publikuj tylko po to, aby umożliwić ocenę.
- Jedno przekazanie obejmuje treść, pracę ucznia i wygląd. Nie wymagaj kolejno osobnych akceptacji palety, typografii, każdego slajdu i karty. Zachowaj dodatkowe wybory wyłącznie tam, gdzie nauczyciel sam ich zażądał.
- Gotowość techniczna nie jest akceptacją. Nie dopisuj jej w metadanych ani nie uznawaj milczenia za zgodę. PDF/PPTX prezentacji generuj po wyraźnej akceptacji lekcji, tylko w uzgodnionym zakresie; publikacja wymaga osobnego zlecenia.
- Po pierwszej lekcji wykonanej tą ścieżką zapisz w istniejącym `reflection.md`, jakie poprawki nadal wróciły i czy wymagały dodatkowego pełnego przebiegu. Nie deklaruj oszczędności czasu w procentach bez pomiaru.

**Zasada skrótu:** mniej ponownego projektowania, wcześniejsza kontrola sensu, mniej powtarzanych przebiegów — nie mniej rzetelności. Nie przerabiaj archiwum ani wspólnych komponentów bez osobnego zlecenia.
