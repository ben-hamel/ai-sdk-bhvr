# ai-sdk-bhvr

A monorepo template built with Bun, Hono, Vite, and React.

## Getting Started

To get started, install the dependencies:

```bash
bun install
```

Then, to start the development servers:

```bash
bun dev
```

install packages example

```bash
 bun add -D @types/pg --cwd server
```

update packages interactively (recursive workspace)

```bash
bun update -i -r
```

## Run the db

To run the PostgreSQL database using Docker, use the following command:

```bash
bun db:start
```

you'll need to set .env in client and Server. There are .env.example files in client and server
