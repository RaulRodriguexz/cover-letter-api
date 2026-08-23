# ✍️ Cover Letter Assistant

An AI-powered web tool that turns a job description + a short summary of yourself into a tailored cover letter — in seconds. The front end is a static page; a Cloudflare Worker keeps the API key secret, so anyone can use the tool without their own key.

**Live demo:** https://raulrodriguexz.github.io/cover-letter-assistant

---

## What it does

1. Paste a job description.
2. Add a short summary of your background.
3. Pick a tone and length.
4. The assistant writes a personalized cover letter you can copy, edit, and send.

## Architecture

Browser (static page) → Cloudflare Worker (holds the secret key) → OpenAI API → back to the browser.

The API key never touches the front end. The Worker validates input, caps request size to control cost, and proxies the request to OpenAI's `gpt-4o-mini` with a prompt engineered to connect real experience to the specific role — without inventing facts.

## Tech

- Vanilla JavaScript front end (no framework)
- Cloudflare Worker (serverless backend, secret management)
- OpenAI Chat Completions API
- Prompt engineering, input validation, CORS, error handling

## Files

- `index.html` — the front end (deployed on GitHub Pages)
- `worker.js` — the Cloudflare Worker (deployed on Cloudflare)

---

*Built by Raul Rodrigues — [portfolio](https://raulrodriguexz.github.io) · AI automation & tooling.*
