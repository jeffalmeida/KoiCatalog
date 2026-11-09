# Koi Cards 🐟

App de flashcards para memorizar os tipos mais comuns de carpa **koi**.

## O que faz

- **Estudar** — flashcards que alternam entre *foto → nome* e *nome → foto*, com repetição espaçada leve (cartões errados voltam rápido, certos aparecem com menos frequência).
- **Catálogo** — todas as variedades com foto, descrição, grupo e cores. Busca e filtro por grupo.
- **Adicionar** — cadastre novas variedades com **nome, descrição e foto** (upload de arquivo do seu computador).

## Começando

```bash
npm install
npm run dev
```

Abra **http://localhost:5173** no navegador. O servidor da API (que lê/grava `data/koi.json`) roda em **http://localhost:3001**.

## Estrutura

```
data/koi.json          # Catálogo de variedades (editável / versionável)
public/images/koi/     # Fotos das variedades (imagens livres)
server/index.mjs       # API local (Express) para ler/gravar o catálogo
src/                   # Frontend React + Vite + TypeScript + Tailwind
```

## Deploy (Hostinger)

O projeto está pronto para publicação estática (`npm run build` → pasta `dist/`). Para persistir o catálogo em produção, o backend Node (`server/index.mjs`) precisa ser implantado como aplicação Node.js.

## Licença das imagens

As fotos vêm do **Wikimedia Commons** (licenças livres CC/GFDL) e do **Openverse/Flickr** (CC). Foram baixadas via API para este projeto pessoal de estudo.