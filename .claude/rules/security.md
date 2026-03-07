# Security Rules

- Never hardcode credentials, API keys, or tokens — use .env
- Parameterized queries only for SurrealDB — no string concatenation
- Sanitize all user input before processing
- Validate request bodies with Pydantic models
- CORS configured for specific origins only
- Never log sensitive data (API keys, tokens, passwords)
- Use HTTPS for all external API calls (Claude, USGS, NewsAPI)
- Rate limit public-facing endpoints
- Keep dependencies updated
- Never commit .env — only .env.example with placeholder values
