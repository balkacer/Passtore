import { create, StateCreator } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';
import customStorage from '../utils/customStorage';
import { SESSION_STORAGE_KEY } from '../constants/general';

export type Session = { 
  token: string, 
  username: string, 
  firstName: string 
}

type GlobalState = {
  sessionData: Session | null,
  setSession: (sessionData: Session) => void,
  clearSession: () => void
}

type CustomPersist = (
  config: StateCreator<GlobalState>,
  options: PersistOptions<GlobalState>
) => StateCreator<GlobalState>;

const useSession = create<GlobalState>(
  (persist as CustomPersist)(
    (set) => ({
      sessionData: null,
      setSession: (sessionData: Session) => set({ sessionData }),
      clearSession: () => set({ sessionData: null }),
    }),
    {
      name: SESSION_STORAGE_KEY,
      storage: customStorage,
    }
  )
);

export default useSession;