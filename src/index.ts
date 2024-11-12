import { EventEmitter } from 'node:events';

import { Elysia, error, t } from 'elysia';

declare global {
  // eslint-disable-next-line no-var
  var gracefulServerIsReady: boolean;
  // eslint-disable-next-line no-var
  var gracefulServerEventEmitter: EventEmitter;
}

interface PluginGracefulServer {
  serverIsReadyOnStart?: boolean;
  livenessEndpoint?: string;
  readinessEndpoint?: string;
  closePromises?: Promise<void>[];
  onStart?: () => Promise<void> | void;
  onReady?: () => Promise<void> | void;
  onShuttingDown?: () => Promise<void> | void;
  onShutdown?: () => Promise<void> | void;
}

export const pluginGracefulServer = (userConfig: PluginGracefulServer = {}) => {
  global.gracefulServerEventEmitter = new EventEmitter();

  const defaultConfig: Required<PluginGracefulServer> = {
    livenessEndpoint: '/live',
    readinessEndpoint: '/ready',
    serverIsReadyOnStart: false,
    closePromises: [],
    onStart: () => {},
    onReady: async () => {},
    onShuttingDown: async () => {},
    onShutdown: async () => {},
  };

  const config = { ...defaultConfig, ...userConfig };

  global.gracefulServerEventEmitter.once('ready', () => {
    config.onReady();
  });

  return new Elysia()
    .state('startedSince', Date.now())

    .get(
      config.readinessEndpoint,
      () => {
        if (global.gracefulServerIsReady) {
          return {
            status: 'ready',
          };
        }

        return error(500);
      },
      {
        response: {
          500: t.Any(),
          200: t.Object({
            status: t.String(),
          }),
        },
      },
    )

    .get(
      config.livenessEndpoint,
      ({ store: { startedSince } }) => {
        return {
          uptime: Math.round((Date.now() - startedSince) / 1000),
        };
      },
      {
        response: {
          200: t.Object({
            uptime: t.Number(),
          }),
        },
      },
    )

    .on('start', () => {
      config.onStart();

      if (config.serverIsReadyOnStart) {
        setServerIsReady();
      }
    })
    .on('stop', async () => {
      config.onShuttingDown();
      await Promise.all(config.closePromises);
      config.onShutdown();
    });
};

export const setServerIsReady = () => {
  global.gracefulServerIsReady = true;

  global.gracefulServerEventEmitter.emit('ready');
};
