import { passtoreApi } from '@/store/rtk/passtoreApi';

describe('passtoreApi', () => {
  it('exports reducer path', () => {
    expect(passtoreApi.reducerPath).toBe('passtoreApi');
  });
});
