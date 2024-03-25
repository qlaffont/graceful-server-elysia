import { Elysia } from 'elysia';

import { pluginGracefulServer, setServerIsReady } from '../../src';

export const app = new Elysia()
  .use(pluginGracefulServer())
  .post('/set-ready', () => {
    setServerIsReady();

    return 'done';
  });

export const customApp = (
  options: Parameters<typeof pluginGracefulServer>[0] = {},
) => {
  const defaultOptions = {
    livenessEndpoint: '/custom-live',
    readinessEndpoint: '/custom-ready',
    serverIsReadyOnStart: false,
    closePromises: [],
    onStart: () => {},
    onReady: async () => {},
    onShuttingDown: async () => {},
    onShutdown: async () => {},
  };

  return new Elysia()
    .use(pluginGracefulServer({ ...defaultOptions, ...options }))
    .post('/set-ready', () => {
      setServerIsReady();

      return 'done';
    });
};
