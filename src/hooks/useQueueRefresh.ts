import { createContext, useContext } from 'react';

interface QueueRefreshContextType {
  refreshAllQueues: () => void;
}

export const QueueRefreshContext = createContext<QueueRefreshContextType | null>(null);

export const useQueueRefresh = () => {
  const context = useContext(QueueRefreshContext);
  if (!context) {
    return { refreshAllQueues: () => {} }; // No-op fallback
  }
  return context;
};