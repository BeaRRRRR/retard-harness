# retard-harness

A silly fork of [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) that splits the screen so you can play a Chrome-dino game and loop brainrot video while the model thinks.

## Run it

```sh
git clone https://github.com/YOUR_USERNAME/retard-harness.git
cd retard-harness
pnpm install
pnpm dsh web
```

Open the printed URL, add your API key, then send a prompt. The game + brainrot panel slides in when the model starts streaming.

## Landing page

This is a static Vite React site. To develop it:

```sh
cd landing
pnpm install
pnpm run dev
```

### Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, **Import** the repo. Set the **Root Directory** to `landing`.
3. Framework preset: **Vite**. Build: `pnpm run build`. Output: `dist`.
4. Deploy. `vercel.json` handles the SPA fallback.

## Notes

- The harness itself runs locally (it's a backend agent, not a static site). The landing page is the static marketing page.
- Replace `YOUR_USERNAME` in `App.tsx` (clone URL) and the nav GitHub link with your actual username before shipping.
