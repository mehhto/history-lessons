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
        │ /workspace:ro
        ▼
wspólny katalog history-lessons
```

Panel co 2 sekundy sprawdza rewizje źródeł. Zmiany w prezentacjach są widoczne bez commita, pushowania i fetchowania.

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
docker compose -f deploy/live-preview/compose.yaml up -d
docker compose -f deploy/live-preview/compose.yaml ps
curl --fail http://127.0.0.1:8182/healthz
```

Oczekiwana odpowiedź healthchecka:

```json
{"status":"ok","readOnly":true}
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

- sidecar montuje wyłącznie repozytorium `history-lessons` jako `/workspace:ro`, zamiast całego katalogu danych Hermesa;
- `UI_READ_ONLY=1` ukrywa eksporty i blokuje `POST /api/jobs` kodem HTTP 403;
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
