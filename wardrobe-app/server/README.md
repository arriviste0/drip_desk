# Wardrobe import API

Server-side Groq integration for importing clothing details from a product URL.

## Setup

1. Copy `server/.env.example` to `server/.env`.
2. Set `GROQ_API_KEY` in `server/.env`.
3. Copy the app `.env.example` to `.env`.
4. Run `npm start` from `server/`, then restart Expo.

Android Emulator uses `http://10.0.2.2:8787`. A physical phone must use the computer's LAN IP or a deployed HTTPS URL.

## Endpoint

`POST /api/items/import-url`

```json
{ "url": "https://store.example/product" }
```

The server fetches bounded public HTML, extracts product metadata, sends it to Groq, and returns normalized wardrobe fields. Never put `GROQ_API_KEY` in Expo environment variables.

Product-link extraction uses `GROQ_TEXT_MODEL`. Uploaded photos and image URLs use `GROQ_VISION_MODEL` through `POST /api/items/analyze` and `POST /api/items/analyze-url`.

Saved local wardrobe items are persisted under `server/.data/` through `POST /api/items` and returned by `GET /api/wardrobe`. `GET /api/wishlist` currently returns an empty local wishlist.

Before deploying publicly, place this route behind your existing user authentication and rate limiting. The included service is intended for local development and private deployment.
