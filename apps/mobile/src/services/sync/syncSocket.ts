import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function connectSyncSocket(
  apiBaseUrl: string,
  token: string,
  onVaultChanged: () => void,
): Socket {
  disconnectSyncSocket();
  const base = apiBaseUrl.replace(/\/$/, '');
  const s = io(`${base}/sync`, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 2000,
  });

  s.on('vault:changed', () => {
    onVaultChanged();
  });

  socket = s;
  return s;
}

export function disconnectSyncSocket(): void {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
}
