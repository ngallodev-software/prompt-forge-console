# Prompt Forge Console

Historical frontend console for operating Prompt Forge. This repository is preserved as a development artifact; its plans and context documents describe the state of the project when they were written and may not match the current backend.

## Development

Requires Node.js 20 or later.

```sh
npm ci
npm run dev
```

Set `VITE_PROMPTFORGE_API_BASE` when building or running the console to point it at a Prompt Forge API. The default is `http://localhost:8090`.
