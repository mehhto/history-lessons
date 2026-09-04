# Katalog komponentów prezentacji

Klasa VI · Wzornik interaktywnych slajdów · wersja robocza

notes:
To jest katalog do oglądania i strojenia stylów. Treści, dane i cytaty są przykładowe — przed użyciem w lekcji zastąp je źródłami zweryfikowanymi w sources.md.

---

<!-- .slide: id="katalog-start" class="question-slide" -->
## Katalog komponentów

**10 gotowych wzorców** do wykorzystania w kolejnych prezentacjach.

<p class="small">Każdy komponent ma czytelną wersję statyczną oraz opcjonalną interakcję.</p>

notes:
Przejdź po katalogu jak po bibliotece: wybierz komponenty, które pasują do celów konkretnej lekcji, nie odwrotnie.

---

<!-- .slide: id="mapa-lokalna" class="map-slide" -->
<span class="source-label">komponent · mapa lokalna</span>

## Mapa z aktywnymi punktami

<lesson-map aria-label="Schemat trasy oceanicznej">
  <div class="map-stage">
    <img src="assets/schemat-swiata.svg" alt="Uproszczony schemat świata z trasą przez Atlantyk">
    <button data-map-pin style="left:27%;top:39%" aria-controls="punkt-portugalia" aria-pressed="false" aria-label="Pokaż opis Portugalii">1</button>
    <button data-map-pin style="left:68%;top:38%" aria-controls="punkt-karaiby" aria-pressed="false" aria-label="Pokaż opis Karaibów">2</button>
  </div>
  <aside class="map-info">
    <span class="map-kicker">kliknij punkt</span>
    <p id="punkt-portugalia" data-map-panel hidden><strong>Port w Europie</strong><br>Tu można wpisać datę, osobę, źródło albo pytanie do uczniów.</p>
    <p id="punkt-karaiby" data-map-panel hidden><strong>Wyspa na Karaibach</strong><br>Opis może zawierać lokalną perspektywę, cytat albo ilustrację.</p>
    <p class="small">Schemat edukacyjny, nie źródło historyczne.</p>
  </aside>
</lesson-map>

notes:
Mapa jest offline-first: obraz i punkty są lokalne. Kliknięcie punktu zmienia panel po prawej.

---

<!-- .slide: id="mapa-google" class="map-slide" -->
<span class="source-label">komponent · tryb online</span>

## Osadzona mapa Google

<lesson-map>
  <div class="map-embed-fallback"><strong>Mapa Google</strong><p>Mapa zewnętrzna nie ładuje się automatycznie. Kliknij tylko, gdy Internet jest dostępny i akceptujesz połączenie z Google.</p><button data-map-open type="button">Otwórz mapę Google</button></div>
  <iframe title="Przykładowa mapa Google: Kraków" loading="lazy" referrerpolicy="no-referrer-when-downgrade" data-map-src="https://www.google.com/maps?q=Krak%C3%B3w&output=embed" hidden></iframe>
  <aside class="map-info"><span class="map-kicker">wymaga internetu</span><p>W lekcji online można osadzić mapę Google przez zwykły iframe. Do PDF i pracy offline dodaj obok lokalny schemat lub zrzut źródłowy.</p></aside>
</lesson-map>

notes:
Google Maps nie jest zasobem offline. Stosuj tylko opcjonalnie; nie ukrywaj treści lekcji wyłącznie w mapie zewnętrznej.

---

<!-- .slide: id="hasla" class="context-slide" -->
<span class="source-label">komponent · rozwijane hasła</span>

## Kliknij hasło, zobacz kontekst

<lesson-disclosure>
  <details><summary>Kolonia</summary><div class="disclosure-body">Terytorium podporządkowane władzy innego państwa. W lekcji dopisz czas, miejsce i perspektywę.</div></details>
  <details><summary>Wymiana</summary><div class="disclosure-body">Przepływ ludzi, towarów, roślin, chorób i idei — nie tylko handel.</div></details>
  <details><summary>Źródło historyczne</summary><div class="disclosure-body"><img src="assets/waldseemuller-mapa-1507.jpg" alt="Fragment mapy Waldseemüllera"><span>Może tu być lokalny obraz, podpis i pytanie badawcze.</span></div></details>
</lesson-disclosure>

notes:
To są natywne elementy details: działają myszą, dotykiem i klawiaturą także bez JavaScriptu.

---

<!-- .slide: id="statystyki" class="context-slide" -->
<span class="source-label">komponent · dane</span>

## Dane na pierwszy rzut oka

<lesson-stats>
  <lesson-stat><lesson-counter value="1492"></lesson-counter><small>rok wyprawy Kolumba</small><p>Przykład daty jako punktu kontrolnego.</p></lesson-stat>
  <lesson-stat><lesson-counter value="3" suffix=" kontynenty"></lesson-counter><small>perspektywy do porównania</small><p>Żeglarz, kupiec, mieszkańcy lądów.</p></lesson-stat>
  <lesson-stat><lesson-counter value="65000000" suffix=" osób"></lesson-counter><small>miejsce na dane demograficzne</small><p>Wpisuj tylko liczbę z podanym źródłem i datą.</p></lesson-stat>
</lesson-stats>

notes:
Liczniki animują się tylko jako dodatek. W PDF i przy ograniczonym ruchu pokazują od razu pełną wartość.

---

<!-- .slide: id="stepper" class="context-slide" -->
<span class="source-label">komponent · kroki procesu</span>

## Stepper: jak pracować ze źródłem

<lesson-stepper>
  <lesson-step><h3>Obejrzyj</h3><p>Co jest widoczne bez interpretacji?</p></lesson-step>
  <lesson-step data-state="current"><h3>Nazwij</h3><p>Kto, gdzie i kiedy stworzył materiał?</p></lesson-step>
  <lesson-step><h3>Zapytaj</h3><p>Czego źródło nie pozwala rozstrzygnąć?</p></lesson-step>
  <lesson-step><h3>Uzasadnij</h3><p>Połącz wniosek z konkretnym dowodem.</p></lesson-step>
</lesson-stepper>

notes:
W wersji pionowej użyj atrybutu orientation="vertical" na lesson-stepper.

---

<!-- .slide: id="tabela" class="compare-slide" -->
<span class="source-label">komponent · tabela</span>

## Tabela porównawcza

<lesson-table>
<table>
  <thead><tr><th>Perspektywa</th><th>Co może zauważyć?</th><th>Pytanie do źródła</th></tr></thead>
  <tbody>
    <tr><td>Żeglarz</td><td>trasę i porty</td><td>Co było celem wyprawy?</td></tr>
    <tr><td>Kupiec</td><td>towary oraz koszty</td><td>Kto zyskuje na wymianie?</td></tr>
    <tr><td>Mieszkańcy lądu</td><td>przybycie obcych</td><td>Jakie skutki przynosi spotkanie?</td></tr>
  </tbody>
</table>
</lesson-table>

notes:
Tabela nie powinna mieć zbyt wielu kolumn. Trzy kolumny i trzy–pięć wierszy są czytelne na projektorze.

---

<!-- .slide: id="cytat" class="source-slide" -->
<span class="source-label">komponent · postać i cytat</span>

## Testimonial / cytat źródłowy

<lesson-quote>
  <img src="assets/postac-symboliczna.svg" alt="Symboliczny portret przykładowej postaci">
  <div><blockquote>„Cytat może tu służyć jako punkt wyjścia do krytyki źródła — nie jako dowód sam w sobie.”</blockquote><figcaption>Imię postaci · data · rodzaj źródła · [DO WERYFIKACJI]</figcaption></div>
</lesson-quote>

notes:
Nie używaj fikcyjnego cytatu jako historycznego. Ten slajd jest wyłącznie wzorem układu.

---

<!-- .slide: id="timeline-pozioma" class="context-slide timeline-slide" -->
<span class="source-label">komponent · oś pozioma</span>

## Timeline pozioma

<lesson-timeline>
  <lesson-event year="1492">Początek przykładowej osi</lesson-event>
  <lesson-event year="1498">Drugie wydarzenie</lesson-event>
  <lesson-event year="1507">Trzeci punkt</lesson-event>
  <lesson-event year="1519–1522">Wydarzenie rozciągnięte w czasie</lesson-event>
</lesson-timeline>

---

<!-- .slide: id="timeline-pionowa" class="context-slide timeline-slide" -->
<span class="source-label">komponent · oś pionowa</span>

## Timeline pionowa

<lesson-timeline orientation="vertical">
  <lesson-event year="przed">Warunek lub przyczyna</lesson-event>
  <lesson-event year="w trakcie">Działanie / zwrot akcji</lesson-event>
  <lesson-event year="po">Skutek bezpośredni</lesson-event>
  <lesson-event year="później">Dłuższa konsekwencja</lesson-event>
</lesson-timeline>

notes:
Pionowa wersja jest dobra dla procesu, który wymaga krótkiego opisu przy każdym kroku.

---

<!-- .slide: id="video" class="source-slide" -->
<span class="source-label">komponent · wideo</span>

## Wideo YouTube z kontrolą startu

<lesson-video>
  <div class="video-fallback"><strong>Materiał wideo</strong><p>Film nie ładuje się automatycznie. Kliknięcie świadomie uruchamia osadzony YouTube w trybie privacy-enhanced.</p><button data-video-play type="button">▶ Odtwórz wideo</button></div>
  <iframe data-video-src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" title="Przykładowe wideo YouTube" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen hidden></iframe>
</lesson-video>

<p class="small">W gotowej lekcji dodaj tytuł, autora, URL, licencję, czas fragmentu i alternatywne zadanie offline.</p>

notes:
Adres jest technicznym przykładem. Przed użyciem zastąp go zweryfikowanym filmem edukacyjnym; wideo wymaga Internetu.

---

<!-- .slide: id="lista-ikony" class="context-slide" -->
<span class="source-label">komponent · lista z ikonami</span>

## Lista bez zwykłych punktorów

<lesson-icon-list>
  <li data-icon="🧭">kierunek podróży</li>
  <li data-icon="⚓">port i wymiana</li>
  <li data-icon="🗺️">mapa jako źródło</li>
  <li data-icon="💬">różne perspektywy</li>
</lesson-icon-list>

notes:
Można używać emoji albo krótkich symboli. Nie opieraj znaczenia wyłącznie na kolorze ikony.

---

<!-- .slide: id="compare-slider" class="source-slide" -->
<span class="source-label">komponent · compare slider</span>

## Przesuń: schemat i mapa źródłowa

<lesson-compare>
  <figure class="compare-base"><img src="assets/waldseemuller-mapa-1507.jpg" alt="Historyczna mapa Waldseemüllera z 1507 roku"><figcaption>źródło historyczne</figcaption></figure>
  <figure class="compare-overlay"><img src="assets/schemat-swiata.svg" alt="Współczesny schemat edukacyjny świata"><figcaption>schemat edukacyjny</figcaption></figure>
  <input type="range" min="0" max="100" value="50" aria-label="Porównaj schemat edukacyjny z mapą historyczną">
  <output aria-live="polite"></output>
</lesson-compare>

notes:
Suwak ma prawdziwy input range, więc jest obsługiwany klawiaturą i dotykiem. W druku oba obrazy pozostają widoczne.

---

<!-- .slide: id="zestawienie" class="exit-ticket-slide" -->
## Jak wybierać komponent?

<lesson-icon-list style="--icon-list-columns:1">
  <li data-icon="①">najpierw cel poznawczy, potem efekt wizualny</li>
  <li data-icon="②">wpisz własne źródło, datę i kontekst</li>
  <li data-icon="③">sprawdź offline, na projektorze i w PDF</li>
</lesson-icon-list>

notes:
Zanotuj komponenty do wdrożenia w realnych lekcjach oraz potrzebne zmiany stylu w lesson.css.
