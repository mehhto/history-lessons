# Stały podgląd prezentacji przez Tailscale

Ten wariant wystawia panel wyłącznie na loopback VM, a dostęp HTTPS zapewnia prywatny Tailscale Serve. Nie używa publicznego Tailscale Funnel.

## Architektura

```text
przeglądarka w tailnecie
        │ HTTPS
        ▼
Tailscale Serve na VM
        │ http://127.0.0.1:8182
        ▼
sidecar history-ui
        │ /workspace:ro + /workspace/classes:rw + /workspace/tests:rw
        ▼
wspólny katalog history-lessons
```

Panel pozostaje tylko do podglądu źródeł; przyciski uruchamiają wyłącznie jawnie dozwolone eksporty. Zapisywalne są wyłącznie katalogi wynikowe `classes/` i `tests/`; źródła, skrypty oraz konfiguracja pozostają read-only. Eksporty PDF/portable zapisują artefakty przy lekcjach, PDF sprawdzianu przy arkuszu, a DOCX jest generowany do pobrania bez zapisu na serwerze. Chromium do eksportów zapewnia obraz `mcr.microsoft.com/playwright:v1.62.1-noble`, dopasowany do wersji Playwright w `package.json`. Port jest nadal wystawiony wyłącznie na loopback VM, a dostęp zdalny zapewnia prywatny Tailscale Serve.

## Refleksja po konkretnej lekcji

Po wybraniu lekcji panel pokazuje przycisk **Dodaj refleksję**. Modal zapisuje cztery krótkie pola: co uczniowie zrozumieli, co było niejasne, jak wyglądał czas oraz co zmienić przed kolejnym użyciem. Każdy zapis jest jednym wierszem JSON w:

```text
classes/<klasa>/<katalog-lekcji>/feedback.jsonl
```

Wpis zawiera identyfikator lekcji, cztery odpowiedzi i czas UTC. Plik nie jest serwowany jako zasób statyczny panelu ani śledzony przez Git (`**/feedback.jsonl` w `.gitignore`), więc nie trafi przypadkowo do commita ani push. Jeżeli refleksje mają zostać zachowane poza VM, należy skopiować je świadomie do prywatnego archiwum. **Eksport kartkówek do edycji w Wordzie (DOCX) jest wyłącznie dla ucznia:** kliknij `Pobierz DOCX` przy sprawdzianie albo kartkówce. Panel buduje plik ze źródłowego Markdownu przed markerem `<!-- teacher-key -->`; klucz nauczyciela nie jest do niego dołączany. DOCX jest pobierany bez zapisu kopii na serwerze. Word zachowuje edytowalny tekst, listy i tabele; mapy/ilustracje pozostają obrazami.

W lekcji wybierz akcję eksportu pod podglądem: `Portable HTML`, `PDF prezentacji`, `Karta pracy PDF`, `Materiały nauczyciela PDF` albo `Pełny pakiet do druku`. Panel zapisuje wybrany artefakt w katalogu lekcji i pobiera kopię na urządzenie. Kartkówki mają `Drukuj / zapisz PDF`, która zapisuje PDF przy arkuszu. W DOCX i PDF uczniowskim klucz odpowiedzi jest pomijany.

Eksporty zadań są ograniczone do zamkniętej listy akcji; nie włączają edycji źródeł. Główny mount `/workspace` pozostaje tylko do odczytu, a prawa zapisu mają wyłącznie `classes/` (artefakty lekcji/refleksje) i `tests/` (PDF-y arkuszy).

## 1. Potwierdź ścieżkę repozytorium na VM

Dla obecnego kontenera katalog danych pochodzi z `/home/hermes/hermes/data`, więc domyślna ścieżka repozytorium na VM to `/home/hermes/hermes/data/history-lessons`. Montowanie można potwierdzić:

```bash
docker inspect NAZWA_KONTENERA_HERMES \
  --format '{{range .Mounts}}{{println .Source "->" .Destination}}{{end}}'
```

Jeżeli repozytorium znajduje się gdzie indziej, ustaw jego dokładną ścieżkę przed uruchomieniem:

```bash
export HISTORY_LESSONS_PATH=/rzeczywista/sciezka/history-lessons
```

## 2. Uruchom sidecar

Na VM:

```bash
cd /home/hermes/hermes/data/history-lessons
docker compose -f deploy/live-preview/compose.yaml up -d --force-recreate history-ui
docker compose -f deploy/live-preview/compose.yaml ps
curl --fail http://127.0.0.1:8182/healthz
```

Oczekiwana odpowiedź healthchecka:

```json
{"status":"ok","readOnly":false}
```

Port `8182` jest publikowany tylko jako `127.0.0.1:8182`, więc nie jest dostępny bezpośrednio z LAN ani Internetu.

## 3. Zainstaluj i uruchom Tailscale na VM

Jeżeli Tailscale nie jest jeszcze zainstalowany:

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

Po zalogowaniu wystaw lokalny panel wyłącznie w tailnecie:

```bash
sudo tailscale serve --bg http://127.0.0.1:8182
sudo tailscale serve status
```

Polecenie `status` pokaże prywatny adres HTTPS. Otwórz pod nim `/admin/`, np.:

```text
https://nazwa-vm.example-tailnet.ts.net/admin/
```

Konfiguracja `--bg` pozostaje aktywna po zakończeniu CLI oraz po restarcie `tailscaled` lub VM. Przy pierwszym uruchomieniu Tailscale może poprosić o włączenie HTTPS/MagicDNS w panelu administracyjnym tailnetu.

Nie używaj `tailscale funnel`: Funnel wystawia usługę publicznie w Internecie. Jeżeli VM mogła wcześniej korzystać z Funnel, sprawdź i wyczyść jego konfigurację:

```bash
sudo tailscale funnel status
sudo tailscale funnel reset
```

## 4. Aktualizacje i diagnostyka

Panel czyta pliki bezpośrednio ze współdzielonego wolumenu, więc zmiana źródła nie wymaga restartu sidecara. Restart jest potrzebny tylko po zmianie kodu samego serwera lub UI:

```bash
docker compose -f deploy/live-preview/compose.yaml restart history-ui
```

Logi i zdrowie:

```bash
docker compose -f deploy/live-preview/compose.yaml logs --tail=100 history-ui
docker inspect --format '{{json .State.Health}}' history-lessons-preview-history-ui-1
curl --fail http://127.0.0.1:8182/healthz
```

## 5. Wyłączenie

Wyłącz listener HTTPS na porcie 443:

```bash
sudo tailscale serve --https=443 off
```

Albo wyczyść całą konfigurację Serve na tej VM:

```bash
sudo tailscale serve reset
```

Usuń sidecar:

```bash
docker compose -f deploy/live-preview/compose.yaml down
```

## Bezpieczeństwo

- sidecar montuje całe repozytorium jako `/workspace:ro`; jedyne zapisywalne nakładane mounty to `/workspace/classes` i `/workspace/tests`, wyłącznie dla wyników eksportów oraz feedbacku;
- `UI_READ_ONLY=0` udostępnia serwerową zamkniętą listę zadań eksportu; panel nie umożliwia edycji źródeł, a pliki projektu poza `classes/` i `tests/` pozostają read-only;
- `UI_FEEDBACK_ENABLED=1` włącza wyłącznie wąski endpoint feedbacku: akceptuje katalog istniejącej lekcji, ogranicza tekst do 4000 znaków i zapisuje wyłącznie jej `feedback.jsonl`;
- kontener nie ma Linux capabilities i działa z `no-new-privileges`;
- Node słucha na `0.0.0.0` wyłącznie wewnątrz izolowanej sieci kontenera, natomiast port Dockera jest publikowany tylko jako `127.0.0.1:8182` na VM;
- TLS kończy się w Tailscale Serve, a lokalny odcinek HTTP prowadzi wyłącznie przez loopback VM;
- dostęp zdalny kontrolują urządzenia, użytkownicy oraz [ACL/grants tailnetu](https://tailscale.com/kb/1018/acls); szerokie reguły mogą dopuścić wszystkich członków tailnetu;
- panel udostępnia materiały nauczycielskie, dlatego nie należy kierować go do publicznego Internetu.

Oficjalna dokumentacja:

- [Tailscale Serve CLI](https://tailscale.com/kb/1242/tailscale-serve)
- [Tailscale Serve](https://tailscale.com/kb/1312/serve)
- [Włączanie HTTPS](https://tailscale.com/kb/1153/enabling-https)
- [Różnica względem publicznego Funnel](https://tailscale.com/kb/1223/tailscale-funnel)
