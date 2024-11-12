// test/index.test.ts
import { treaty } from '@elysiajs/eden';
import { beforeAll, describe, expect, it, mock } from 'bun:test';

import { app, customApp } from './utils/server.test';

describe('Graceful server', () => {
  describe('REST routes', () => {
    let api: ReturnType<typeof treaty<typeof app>>;

    beforeAll(() => {
      api = treaty(app);
    });

    describe('/live', () => {
      it('should return number', async () => {
        const { data, status } = await api.live.get();

        expect(status).not.toBe(404);
        expect(typeof data?.uptime).toBe('number');
        expect(data?.uptime).toBe(0);

        //Wait 1 second
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const { data: newData } = await api.live.get();

        expect(newData?.uptime).toBe(1);
      });
    });

    describe('/ready', () => {
      it('should return ready', async () => {
        const { status } = await api.ready.get();

        expect(status).not.toBe(404);
        expect(status).toBe(500);
      });

      it('should return ready programmatically', async () => {
        const { status: existingStatus } = await api.ready.get();

        expect(existingStatus).toBe(500);

        await api['set-ready'].post();

        const { status, data } = await api.ready.get();

        expect(status).toBe(200);
        expect(data?.status).toBe('ready');
      });
    });
  });

  describe('Custom Options', () => {
    let customApi: ReturnType<typeof treaty<ReturnType<typeof customApp>>>;

    beforeAll(() => {
      customApi = treaty(customApp());
    });

    it('Custom /live', async () => {
      const { status } = await customApi['custom-live'].get();
      expect(status).not.toBe(404);
    });

    it('Custom /ready', async () => {
      const { status } = await customApi['custom-ready'].get();
      expect(status).not.toBe(404);
    });

    it('onReady', async () => {
      const mockFunction = mock();

      const api = treaty(
        customApp({
          onReady: mockFunction,
        }),
      );

      await api['set-ready'].post();
      await customApi.ready.get();

      expect(mockFunction).toHaveBeenCalled();
    });

    it('otherListeners', async () => {
      const mockStartFunction = mock();
      const mockShutingdownFunction = mock();
      const mockShutdownFunction = mock();

      const customApi = customApp({
        onStart: mockStartFunction,
        onShuttingDown: mockShutingdownFunction,
        onShutdown: mockShutdownFunction,
      })
        .on('start', () => {
          expect(mockStartFunction).toHaveBeenCalled();
        })
        .on('stop', () => {
          expect(mockShutingdownFunction).toHaveBeenCalled();
          setTimeout(() => {
            expect(mockShutdownFunction).toHaveBeenCalled();
          }, 1000);
        })
        .listen(3000);

      //Wait 3 seconds
      await new Promise((resolve) => setTimeout(resolve, 3000));

      customApi.stop();
    });

    it('serverIsReadyOnStart', async () => {
      const mockReadyFunction = mock();

      const customApi = customApp({
        onReady: mockReadyFunction,
        serverIsReadyOnStart: true,
      }).listen(3100);

      //Wait 1 seconds
      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(mockReadyFunction).toHaveBeenCalled();

      customApi.stop();
    });

    it('closePromises', async () => {
      const mockCloseFunction = mock();

      const promise = new Promise<void>((resolve) => {
        mockCloseFunction();
        resolve();
      });

      const customApi = customApp({
        closePromises: [promise],
      }).listen(3200);

      //Wait 1 seconds
      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(mockCloseFunction).toHaveBeenCalled();

      customApi.stop();
    });
  });
});
