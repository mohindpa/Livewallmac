# LiveWall — wallpaper collection site

Static site for the [LiveWall](https://github.com/mohindpa/Livewallmac) live-wallpaper collection:
browse wallpapers, preview each one on a full macOS desktop mock (menu bar, dock, desktop
icons — real system icons, generic apps), and download the 4K master.

No build step, no framework — plain HTML/CSS/JS.

## Local preview

```bash
python3 -m http.server 8412
# open http://127.0.0.1:8412
```

(`wallpapers.json` is fetched at runtime, so `file://` won't work — serve over http.)

## Adding a wallpaper

1. Drop the assets into a new folder:
   `assets/wallpapers/<slug>/` with:
   - `preview.mp4` — 1080p web preview (faststart, no audio), e.g.
     `ffmpeg -i master_4k.mp4 -vf scale=1920:1080 -c:v libx264 -crf 20 -preset slow -pix_fmt yuv420p -movflags +faststart -an preview.mp4`
   - `poster.jpg` — 1080p still for the card
   - `<name>_4k.mp4` — the 4K master (what visitors download)
2. Add an entry to `wallpapers.json` (copy an existing one; `slug` must match the folder).
3. Commit + deploy.

## Deploy

Hosted on Vercel (static). From this folder:

```bash
vercel --prod
```

Or connect the GitHub repo in the Vercel dashboard for auto-deploy on push.
