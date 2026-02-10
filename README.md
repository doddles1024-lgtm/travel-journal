# Quick Links + Snow Rider 3D

A link hub (games, apps, AI, music, tools) with an embedded Snow Rider 3D Unity game.

## Run locally

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) for the link hub. Click **Snow Rider 3D** under Games to play.

## Build for production

```bash
npm run build
```

Serve the `build` folder with any static host.

## Tech

- React 18, TypeScript
- react-router-dom (home + `/snowrider` game page)
- Unity WebGL build loaded from CDN (Snow Rider 3D)
