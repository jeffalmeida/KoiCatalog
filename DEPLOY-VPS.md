# Deploy Docker do Koi Cards no VPS hermes (acesso via Tailscale)

Arquitetura: **zero portas públicas novas**. O Koi escuta apenas no IP da
tailnet da hermes (`100.76.162.103:8080`), mesmo padrão dos containers já
existentes no host. As portas 80/443 (Traefik) não são tocadas.

Acesso depois do deploy (de qualquer dispositivo da tailnet):
**http://hermes:8080** ou **http://100.76.162.103:8080**

---

## No PC (Windows)

```powershell
cd P:\koi

# 1. Buildar a imagem (com a edição do Kohaku incluída)
docker build -t koi-cards:latest .

# 2. Exportar a imagem
docker save koi-cards:latest -o koi-image.tar

# 3. Enviar para a hermes (via tailnet — não precisa de IP público)
scp koi-image.tar root@hermes:/root/
ssh root@hermes "mkdir -p /root/koi"
scp docker-compose.vps.yml root@hermes:/root/koi/
```

## Na hermes

```bash
ssh root@hermes

# 4. Carregar a imagem e subir
docker load -i /root/koi-image.tar
cd /root/koi
docker compose -f docker-compose.vps.yml up -d

# 5. Verificar (tudo deve dar 200)
curl -s -o /dev/null -w 'frontend:%{http_code}\n' http://100.76.162.103:8080/
curl -s -o /dev/null -w 'api:%{http_code}\n'       http://100.76.162.103:8080/api/kois
curl -s -o /dev/null -w 'upload:%{http_code}\n'    http://100.76.162.103:8080/images/uploads/koi-1789572437576.png
```

## Testar do PC

Abra no navegador: **http://hermes:8080** (precisa do Tailscale ligado).

## Atualização de versão (redeploy)

```powershell
# No PC
docker build -t koi-cards:latest .
docker save koi-cards:latest -o koi-image.tar
scp koi-image.tar root@hermes:/root/
```
```bash
# Na hermes
docker load -i /root/koi-image.tar
cd /root/koi
docker compose -f docker-compose.vps.yml up -d --force-recreate koi
```

## Dados e backup

- Catálogo (`data/`) e uploads (`public/images/uploads/`) ficam nos volumes
  `koi_koi-data` e `koi_koi-uploads` — sobrevivem a redeploys.
- Backup:
  ```bash
  ssh root@hermes "docker run --rm -v koi_koi-data:/data -v /tmp:/bkp alpine tar czf /bkp/koi-data.tgz /data && docker run --rm -v koi_koi-uploads:/u -v /tmp:/bkp alpine tar czf /bkp/koi-uploads.tgz /u"
  scp root@hermes:/tmp/koi-*.tgz P:\koi\backups\
  ```

## Troubleshooting

- **Não abre http://hermes:8080**: confira se o Tailscale está ativo no PC (`tailscale status`) e se o container está de pé (`ssh root@hermes "docker ps"`).
- **`bind: cannot assign requested address`**: o IP da tailnet mudou (raro). Rode `tailscale ip -4` na hermes e ajuste a linha de `ports` no compose.
- **Container reiniciando**: `ssh root@hermes "docker compose -f /root/koi/docker-compose.vps.yml logs koi"`.
