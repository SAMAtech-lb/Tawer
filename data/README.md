# Default content

These files hold the website's **default** text. The website and the dashboard use them for any field that
hasn't been saved from the dashboard yet. Anything saved in the dashboard (stored in the Neon database)
always wins over these files.

- `content.en.json`: English. It also defines the structure: list items and their order, numbers, photos
  (Unsplash photo IDs in `img`), links.
- `content.ar.json`: Arabic translation, **same shape, text only**. List items match the English ones by position.
  A missing or empty Arabic text shows the English one. Numbers, photos and links always come from the English file.

Text formatting in most fields:

| You write      | The website shows                    |
|----------------|--------------------------------------|
| `[[words]]`    | highlighted/coloured words           |
| `**words**`    | bold                                 |
| a new line     | a line break                         |

After editing these files, restart `npm run dev` (or redeploy) to see the change.
