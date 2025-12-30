import { configureStore } from '@reduxjs/toolkit';
import flowReducer from './slices/flowSlice';

export const store = configureStore({
  reducer: {
    flow: flowReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these paths in the state for serializability check
        // React Flow nodes/edges might contain non-serializable data (functions, etc) in some cases,
        // but usually they are JSON serializable.
        // However, if we store extensive objects, we might want to disable this warning or refine paths.
        ignoredActions: ['flow/setWorkflow', 'flow/nodesChange', 'flow/edgesChange'],
        ignoredPaths: ['flow.nodes', 'flow.edges'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
