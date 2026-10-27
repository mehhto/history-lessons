# Kontrola jakości — Społeczeństwo polskie pod okupacją

Status: kompletna lekcja do całościowego przeglądu nauczycielki; nie oznacza jej akceptacji. Zakres zmian: tylko ta lekcja i dedykowany test. Bez commit/push, PDF/PPTX i zmian wspólnych komponentów.

## Treść i przebieg
- [x] KlasaVIII,2026/2027: `stara-przejsciowa`; wymagania z urzędowego tekstu2024, jasno ograniczony udział tej lekcji w wymaganiach XXXII.2 i XXXIII.2–4.
- [x] Zakres dostarczonych s.74–79: codzienny opór, terror, wysiedlenia/Zamojszczyzna, Zagłada/getta, powstanie1943, pomoc/Żegota/Sendlerowa/Ulmowie, Pilecki/Karski, szmalcownictwo, Wołyń/Galicja/OUN-B/UPA/samoobrona i Ukraińcy ratujący Polaków.
- [x] Pytania przed fotografią i przed krótkim prawdziwym świadectwem. Cytat Turskiego porównany z obrazem s.7 muzealnych Kart Refleksji, jawne pominięcie;28px, jeden slajd, odpowiedzi teacher-side.
- [x] Cele→przesłanki→działanie→indywidualny dowód→klucz. Porównanie8min, synteza4,5min i bilet2min są chronione. Całość z przejściami i buforem40min, suma narzędziowa w metadata/test.
- [x] Pary z sąsiadem i trójka przy nieparzystej liczbie. Bez fikcyjnej liczebności klasy i dodatkowego druku.
- [x] Wszystkie sześć sketchnotek jako sześć ostatnich slajdów, po źródłach i bilecie;3min łącznie. Współczesne opracowaniaAI, nie dowody z epoki. Niezmienione oryginały zachowane, poprawione kopie z jawnymi dopiskami; zakres korekt w audycie i źródłach.
- [x] Brak drastycznych fotografii, moralnego testu odwagi, odgrywania ofiar/sprawców i gier punktowych o Zagładzie. Bez winy zbiorowej.

## Technika i dowody
Dedykowany test: `node --test test/spoleczenstwo-pod-okupacja.test.mjs`. Wariant z dodatkową kontrolą istniejącego prywatnego podglądu: `OCCUPATION_LIVE_URL=https://ai-agent.tail53435f.ts.net/classes/8/09-spoleczenstwo-pod-okupacja/ node --test test/spoleczenstwo-pod-okupacja.test.mjs`. Test używa istniejącego `test/support/local-chromium.mjs` i helperów pomiaru/eksportu, nie uruchamia nowego serwera.

- [x] Test statyczny:22slajdy/22notes, kolejność sześciu końcowych plansz, komplet plików, kontrakt celów, aktywna podstawa, cztery literalne URL,40min, SHA-256 wszystkich obrazów i pochodzenie `user` dla sześciu oryginałów i sześciu pochodnych.
- [x] Chromium: wszystkie22slajdy przy1024×768,1280×720 i1920×1080, w izolowanym `file://` oraz prywatnym live; pomiar rzeczywistego płótna1280×720, bez overflow i mikrotekstu według repozytoryjnego probe.
- [x] Obrazy i lokalne fonty gotowe przed pomiarem; dziewięć obrazów można powiększyć; zachowany cały wyświetlany plik, bez CSS cropu.
- [x] Strzałki, klik/Enter, Escape, przywracanie fokusu, brak przejścia slajdu w lightboxie; S i geometria notatek w trzech rozdzielczościach; B i F.
- [x] Przenośny HTML budowany istniejącym eksporterem i otwierany jako jedyny plik w pustym katalogu. Brak HTTP(S) dla podstawowej treści i błędów przeglądarki. Standalone `teacher-guide.html` działa przez `file://`, bez zasobów zewnętrznych.
- [x] `npm run check:composition -- --lesson classes/8/09-spoleczenstwo-pod-okupacja`: zero ostrzeżeń. `check:contract`: **POMINIĘTO**, bo nie włączano nowego opt-in; nie traktujemy tego jako pozytywnej walidacji nowego kontraktu.
- [x] Obejrzano kontaktową planszę całej sekwencji i pełne ujęcia otwarcia, fotografii, świadectwa, pracy w parach, notatki, biletu, sketchnotek i powiększeń. Porównano z otwarciem VI11RON: zachowane funkcje, inna paleta i kompozycja, nie klon skóry.

Aktualny raport maszynowy i ujęcia: `.hermes/reviews/8/09-spoleczenstwo-pod-okupacja/qa/report.json`, `contact-sheet.png`, `final-corrections-contact.png`, `live-1280-01.png`…`22.png`, analogiczne `offline-*`, `live-lightbox-17.png`, `live-lightbox-22.png`, `live-notes.png`, `live-teacher-guide.png`. Raport zapisuje hashe wejść, aby nie mylić go z późniejszą rewizją. Po ostatniej dostawie parenta ponownie skopiowano sześć PNG i audyt, sprawdzono SHA, odświeżono provenance, standalone przewodnik i eksport portable. Końcowy dedykowany przebieg: **2 testy PASS, 0 FAIL, 0 SKIP**; wszystkie sześć kombinacji offline/live×rozdzielczość bez problemów. Odświeżono i obejrzano planszę całego decku, sześć poprawionych grafik, finalny lightbox Wołynia i przewodnik.

## Naprawione problemy renderowania
1. Wspólny layout `statement-centered` zwężał treść do22em i centrował zbyt wysoki blok: lokalnie wyzerowano ograniczenie szerokości oraz `align-content`.
2. Wspólna reguła `source-split` zmniejszała sketchnotki do195px wysokości mimo dużego boxu. Zastosowano id-scoped wysokość625px i test rzeczywistego rozmiaru, zamiast maskowania overflow.
3. Styl takeaways usuwał numerację notatki; przywrócono widoczne1–4 lokalnie, ponieważ polecenie odnosi się do punktu3.

## Końcowa kontrola rodzica
- Ponownie odczytano i obejrzano s.7 oryginalnych Kart Refleksji Muzeum: cytat Turskiego zgodny, dalszy tekst oznaczony jako pominięty.
- Obejrzano pełną sekwencję i osobne ujęcia otwarcia, relacji, pracy w parach, poprawionych sketchnotek oraz powiększenia. Usunięto niedokryte stare etykiety w kulturze i wysiedleniach; odświeżono sześć PNG, provenance i portable.
- Po ostatniej zmianie: 2/2 dedykowane testy PASS, 0 pominięć; 22 slajdy w trzech rozdzielczościach live i offline, lightboxy i standalone przewodnik bez błędów. Osobny HTML audytu: sześć poprawnych obrazów, brak HTTP(S) i poziomego overflow. `git diff --check` PASS. Brak publikacji.

## Otwarte granice
- [ ] Całościowa akceptacja nauczycielki; nie została domniemana ani wpisana jako zakończona.
- [ ] Pierwsze przeprowadzenie i rzeczywista refleksja klasy.
- Bezpośrednia lekcja.auschwitz.org/1 miała błąd certyfikatu. Zamiast udawać lekturę całej lekcji, odczytano oficjalny opis Muzeum i wybrano sprawdzony tekst z odrębnego PDF. To ograniczenie dostępu, nie brak źródła do naszej aktywności.
- Nie uruchamiano pełnego QA całego repozytorium: brak zmian wspólnych i brak zlecenia publikacji. Nie generowano PDF/PPTX w celu sztucznego zamknięcia statusu.
