import { create } from 'zustand';

export type PendingPairing = { sessionId: string; pairingCode: string };
export type PendingDelivery = { requestId: string };

interface TempAuthDeepLinkState {
  pendingPairing: PendingPairing | null;
  pendingDelivery: PendingDelivery | null;
  setPendingPairing: (p: PendingPairing | null) => void;
  setPendingDelivery: (p: PendingDelivery | null) => void;
  clearPendingPairing: () => void;
  clearPendingDelivery: () => void;
}

export const useTempAuthDeepLinkStore = create<TempAuthDeepLinkState>((set) => ({
  pendingPairing: null,
  pendingDelivery: null,
  setPendingPairing: (p) => set({ pendingPairing: p }),
  setPendingDelivery: (p) => set({ pendingDelivery: p }),
  clearPendingPairing: () => set({ pendingPairing: null }),
  clearPendingDelivery: () => set({ pendingDelivery: null }),
}));
