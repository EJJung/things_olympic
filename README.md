# 🏅 Things I Want Olympics

A single-file web app that lets you collect anything from the internet and rank it tournament-style — battle items head-to-head until one champion emerges.

## Demo

Open `things-olympics.html` directly in any browser. No install, no build step, no server needed.

## How It Works

**1. Add competitors**
- **From URL** — paste any link (Amazon, Etsy, a blog post, anything) and the app auto-fetches the title, image, and description via Open Graph metadata
- **Manual entry** — type in a name, image URL, description, and link yourself

**2. Run the tournament**
- Hit **Start Tournament!** once you have 2+ items
- Items are shuffled and paired up for 1v1 matchups
- Pick your favorite each round — the winner advances, the loser is eliminated
- Bracket rounds continue (with automatic byes for odd numbers) until one item remains

**3. See the results**
- A 🥇🥈🥉 podium shows the top 3
- A full ranked list shows every item from first to last
- Run a **Rematch** anytime (reshuffled) or go back to edit your list

## Features

- 🔗 Auto-fetch metadata from any URL using Open Graph tags
- ✏️ Manual entry for anything that doesn't have a URL
- ⚔️ Single-elimination bracket with round tracking and a progress bar
- 🏆 Podium + full ranking on results screen
- 🔄 Rematch with reshuffled bracket
- Zero dependencies to install — loads React from CDN

## Usage

```bash
# Just open it
open things-olympics.html

# Or serve it locally
npx serve .
```

## Tech Stack

- **React 18** (via CDN)
- **Babel Standalone** for in-browser JSX compilation
- **allorigins.win** as a CORS proxy for URL metadata fetching
- Vanilla CSS with inline styles — no framework required

## Notes

- URL fetching relies on [allorigins.win](https://api.allorigins.win), a free public CORS proxy. It works with most sites but may occasionally be slow or unavailable.
- Items and tournament state are stored in memory only — refreshing the page resets everything.
- For best results with URL fetching, use direct product page URLs rather than search result pages.

## License

MIT
