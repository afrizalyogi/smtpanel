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

interface AppState {
  isConnected: boolean;
  setConnected: (connected: boolean) => void;
  hasSeenWarning: boolean;
  dismissWarning: () => void;
  emails: EmailRecord[];
  addEmail: (email: EmailRecord) => void;
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
  wipeLocalData: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isConnected: false,
      hasSeenWarning: false,
      setConnected: (connected) => set({ isConnected: connected }),
      dismissWarning: () => set({ hasSeenWarning: true }),
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
      importHistory: (newEmails) => set((state) => {
        const existingIds = new Set(state.emails.map(e => e.id));
        const filtered = newEmails.filter(e => !existingIds.has(e.id));
        
        let addedTotal = 0;
        let addedSuccess = 0;
        let addedFailed = 0;
        
        filtered.forEach(e => {
          addedTotal++;
          if (e.status === 'Sent') addedSuccess++;
          else addedFailed++;
        });

        return { 
          emails: [...filtered, ...state.emails],
          stats: {
            total: state.stats.total + addedTotal,
            success: state.stats.success + addedSuccess,
            failed: state.stats.failed + addedFailed
          }
        };
      }),
      templates: [],
      saveTemplate: (template) => set((state) => ({ templates: [...state.templates, template] })),
      updateTemplate: (id, templateUpdate) => set((state) => ({
        templates: state.templates.map(t => t.id === id ? { ...t, ...templateUpdate } : t)
      })),
      deleteTemplate: (id) => set((state) => ({ templates: state.templates.filter(t => t.id !== id) })),
      importTemplates: (newTemplates) => set((state) => {
        // Prevent duplicates by ID
        const existingIds = new Set(state.templates.map(t => t.id));
        const filtered = newTemplates.filter(t => !existingIds.has(t.id));
        return { templates: [...state.templates, ...filtered] };
      }),
      contacts: [],
      saveContact: (contact) => set((state) => ({ contacts: [...state.contacts, contact] })),
      updateContact: (id, contactUpdate) => set((state) => ({
        contacts: state.contacts.map(c => c.id === id ? { ...c, ...contactUpdate } : c)
      })),
      deleteContact: (id) => set((state) => ({ contacts: state.contacts.filter(c => c.id !== id) })),
      importContacts: (newContacts) => set((state) => {
        const existingIds = new Set(state.contacts.map(c => c.id));
        const filtered = newContacts.filter(c => !existingIds.has(c.id));
        return { contacts: [...state.contacts, ...filtered] };
      }),
      stats: { total: 0, success: 0, failed: 0 },
      identity: { fromName: '', fromEmail: '' },
      setIdentity: (fromName, fromEmail) =>
        set({ identity: { fromName, fromEmail } }),
      clearData: () =>
        set({
          isConnected: false,
          hasSeenWarning: false,
          emails: [],
          templates: [],
          contacts: [],
          stats: { total: 0, success: 0, failed: 0 },
          identity: { fromName: '', fromEmail: '' },
        }),
      wipeLocalData: () =>
        set({
          emails: [],
          templates: [],
          contacts: [],
          stats: { total: 0, success: 0, failed: 0 },
        }),
    }),
    {
      name: 'smtpanel-storage',
    }
  )
);
