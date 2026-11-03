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

export type TemplateRecord = {
  id: string;
  name: string;
  subject: string;
  body: string;
  html: boolean;
};

export type ContactRecord = {
  id: string;
  name: string;
  email: string;
  tags?: string[];
};

export interface AppState {
  isConnected: boolean;
  setConnected: (connected: boolean) => void;
  hasSeenWarning: boolean;
  dismissWarning: () => void;
  emails: EmailRecord[];
  addEmail: (email: Omit<EmailRecord, 'id' | 'date'>) => void;
  importHistory: (emails: EmailRecord[]) => void;
  templates: TemplateRecord[];
  saveTemplate: (template: TemplateRecord) => void;
  updateTemplate: (id: string, template: Partial<TemplateRecord>) => void;
  deleteTemplate: (id: string) => void;
  importTemplates: (templates: TemplateRecord[]) => void;
  contacts: ContactRecord[];
  saveContact: (contact: ContactRecord) => void;
  updateContact: (id: string, contact: Partial<ContactRecord>) => void;
  deleteContact: (id: string) => void;
  importContacts: (contacts: ContactRecord[]) => void;
  stats: { total: number; success: number; failed: number };
  identity: { fromName: string; fromEmail: string };
  setIdentity: (name: string, email: string) => void;
  clearData: () => void;
  wipeLocalData: () => void;
}

type WithId = { id: string };

/** Items from `incoming` whose id is not already in `existing`. */
const newOnly = <T extends WithId>(existing: T[], incoming: T[]) => {
  const ids = new Set(existing.map((item) => item.id));
  return incoming.filter((item) => !ids.has(item.id));
};

const patchById = <T extends WithId>(list: T[], id: string, patch: Partial<T>) =>
  list.map((item) => (item.id === id ? { ...item, ...patch } : item));

const addToStats = (stats: AppState['stats'], emails: EmailRecord[]) => {
  const success = emails.filter((e) => e.status === 'Sent').length;
  return {
    total: stats.total + emails.length,
    success: stats.success + success,
    failed: stats.failed + emails.length - success,
  };
};

const emptyData = {
  emails: [],
  templates: [],
  contacts: [],
  stats: { total: 0, success: 0, failed: 0 },
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isConnected: false,
      hasSeenWarning: false,
      setConnected: (isConnected) => set({ isConnected }),
      dismissWarning: () => set({ hasSeenWarning: true }),
      ...emptyData,
      identity: { fromName: '', fromEmail: '' },

      addEmail: (email) =>
        set((state) => {
          const record = { ...email, id: 'msg_' + Date.now(), date: new Date().toLocaleString() };
          return { emails: [record, ...state.emails], stats: addToStats(state.stats, [record]) };
        }),
      importHistory: (emails) =>
        set((state) => {
          const added = newOnly(state.emails, emails);
          return { emails: [...added, ...state.emails], stats: addToStats(state.stats, added) };
        }),

      saveTemplate: (template) => set((state) => ({ templates: [...state.templates, template] })),
      updateTemplate: (id, patch) => set((state) => ({ templates: patchById(state.templates, id, patch) })),
      deleteTemplate: (id) => set((state) => ({ templates: state.templates.filter((t) => t.id !== id) })),
      importTemplates: (templates) =>
        set((state) => ({ templates: [...state.templates, ...newOnly(state.templates, templates)] })),

      saveContact: (contact) => set((state) => ({ contacts: [...state.contacts, contact] })),
      updateContact: (id, patch) => set((state) => ({ contacts: patchById(state.contacts, id, patch) })),
      deleteContact: (id) => set((state) => ({ contacts: state.contacts.filter((c) => c.id !== id) })),
      importContacts: (contacts) =>
        set((state) => ({ contacts: [...state.contacts, ...newOnly(state.contacts, contacts)] })),

      setIdentity: (fromName, fromEmail) => set({ identity: { fromName, fromEmail } }),
      clearData: () =>
        set({ ...emptyData, isConnected: false, hasSeenWarning: false, identity: { fromName: '', fromEmail: '' } }),
      wipeLocalData: () => set(emptyData),
    }),
    { name: 'smtpanel-storage' }
  )
);
