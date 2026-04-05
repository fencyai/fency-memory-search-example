# Fency Memory Search Example

A Next.js app demonstrating how to search indexed memories using Fency's **MemorySearch** agent task type.

## Overview

- Uses **MemorySearch** with query expansion, chunk limits, and English language
- Server session uses `MEMORY_SEARCH` with guard rails to scope searches to a specific memory type and metadata
- Task lifecycle and progress UI use `AgentTaskProgress` from `@fencyai/react`
- Requires **@fencyai/js** and **@fencyai/react** `^0.1.157` (MemorySearch support)

## Prerequisites

- Node.js 18+
- A Fency account with a secret key and publishable key
- Memories ingested for your configured memory type

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env.local` file in the project root (you can copy `.env.example`):

   ```bash
   NEXT_PUBLIC_PUBLISHABLE_KEY=pk_...
   FENCY_SECRET_KEY=sk_...
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) and run searches against your indexed memories.

## Environment Variables

| Variable | Scope | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_PUBLISHABLE_KEY` | Client | Initializes the Fency SDK via `loadFency` |
| `FENCY_SECRET_KEY` | Server | Authenticates requests to the Fency REST API from API routes |

## Project Structure

```
app/
  page.tsx                         # SDK initialization and FencyProvider setup
  app.tsx                          # Search UI and PDF modal trigger
  api/
    createSession.ts               # Shared helper: POSTs to Fency sessions API
    stream-session/route.ts        # Creates a stream session (used by FencyProvider)
    agent-task-session/route.ts    # Creates a Memory Search session with guard rails
    memory-download-link/route.ts  # Validates metadata, returns presigned PDF download URL
components/
  PdfViewerModal.tsx               # react-pdf viewer (client-only, dynamic import)
lib/
  fetchCreateStreamClientToken.ts  # Fetches a stream client token from /api/stream-session
  fetchCreateAgentTaskClientToken.ts # Fetches an agent task client token from /api/agent-task-session
hooks/
  useMemorySearch.ts               # Wraps useAgentTasks for MemorySearch
```

## How It Works

### 1. SDK Initialization - `app/page.tsx`

Same pattern as other Fency examples: `loadFency` with the publishable key, `FencyProvider` with `fetchCreateStreamClientToken`.

### 2. Agent task session - `app/api/agent-task-session/route.ts`

Creates a session whose agent task is **Memory Search**, with memory-type guard rails and metadata match:

```ts
createAgentTask: {
  taskType: 'MEMORY_SEARCH',
  guardRails: {
    memoryTypes: [
      {
        memoryTypeId: '<your-memory-type-id>',
        match: {
          // optional metadata filter
        },
      },
    ],
  },
},
```

### 3. Client - `hooks/useMemorySearch.ts`

Each search calls:

```ts
await createAgentTask({
  type: 'MemorySearch',
  query: trimmed,
  model,
  language: 'en',
  chunkLimit: 5,
  queryExpansion: { queryCount: 3 },
})
```

### 4. UI - `app/app.tsx`

Each task shows the query and `AgentTaskProgress` for live progress and final ranked chunks. Clicking a search result calls `onSearchResultClick`, which requests a download link from the server and opens a modal with [react-pdf](https://github.com/wojtekmaj/react-pdf) on the first page from the hit (`pageNumbers[0]`).

### 5. PDF download link - `app/api/memory-download-link/route.ts`

Server-side only: fetches the memory via `GET /v1/memories/:id` to verify metadata, then requests a presigned download URL via `POST /v1/memories/:id/download-link` and returns `{ downloadLink }` to the client viewer.
