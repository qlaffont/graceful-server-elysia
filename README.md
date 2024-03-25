# graceful-server-elysia

Library inspired by [graceful-server](https://github.com/gquittet/graceful-server).

## Usage

```typescript
import { pluginGracefulServer } from 'graceful-server-elysia';

export const app = new Elysia()
  .use(pluginGracefulServer({}))
```

## Plugin options

| name                 | default  | description                                          |
| -------------------- | -------- | ---------------------------------------------------- |
| livenessEndpoint     | /live    | Respond 200 with the uptime of the server in second. |
| readinessEndpoint    | /ready   | Respond 200 if the server is ready or respond 500    |
| serverIsReadyOnStart | false    | Set server is ready on Elysia emit start event       |
| closePromises        | []       | Call every promises when server is closing           |
| onStart              | () => {} | Callback is called when server is started            |
| onReady              | () => {} | Callback is called when server is ready              |
| onShuttingDown       | () => {} | Callback is called when server is shutting down      |
| onShutdown           | () => {} | Callback is called when server is shutdown           |

## Tests

To execute jest tests (all errors, type integrity test)

```
bun test
```
