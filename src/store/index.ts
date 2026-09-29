import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EmailRecord = {
  id: string;
  to: string;
  subject: string;
  status: 'Sent' | 'Failed';
  date: string;
  msgId: string;
  body?: string;
  html?: boolean;
};

interface AppState {
  isConnected: boolean;
  setConnected: (connected: boolean) => void;
  emails: EmailRecord[];
  addEmail: (email: EmailRecord) => void;
  stats: {
    total: number;
    success: number;
    failed: number;
  };
  identity: {
    fromName: string;
    fromEmail: string;
  };
  setIdentity: (name: string, email: string) => void;
  clearData: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isConnected: false,
      setConnected: (connected) => set({ isConnected: connected }),
      emails: [],
      addEmail: (email) =>
        set((state) => {
          const isSuccess = email.status === 'Sent';
          return {
            emails: [email, ...state.emails],
            stats: {
              total: state.stats.total + 1,
              success: state.stats.success + (isSuccess ? 1 : 0),
              failed: state.stats.failed + (isSuccess ? 0 : 1),
            },
          };
        }),
      stats: { total: 0, success: 0, failed: 0 },
      identity: { fromName: '', fromEmail: '' },
      setIdentity: (fromName, fromEmail) =>
        set({ identity: { fromName, fromEmail } }),
      clearData: () =>
        set({
          isConnected: false,
          emails: [],
          stats: { total: 0, success: 0, failed: 0 },
          identity: { fromName: '', fromEmail: '' },
        }),
    }),
    {
      name: 'smtpanel-storage',
    }
  )
);
