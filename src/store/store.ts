import { configureStore, Middleware } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import type { Action, ThunkAction } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import businessRequirementReducer from './slices/businessRequirementSlice'
import profilesReducer from './slices/profilesSlice'
import campaignsReducer from './slices/campaignsSlice'
import decisionMakerReducer from './slices/decisionMakerSlice'
import ticketsReducer from './slices/ticketsSlice'
import templatesReducer from './slices/templatesSlice'
import integrationsReducer from './slices/integrationsSlice'
import adminUsersReducer from './slices/adminUsersSlice'
import errorReducer from './slices/errorSlice'
import loadingReducer from './slices/loadingSlice'

// Persist configuration for auth (most important - user session)
const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['user', 'token', 'isAuthenticated'],
}

// Persist configuration for filters/preferences (optional - improves UX)
const ticketsPersistConfig = {
  key: 'tickets',
  storage,
  whitelist: ['filters'],
}

const templatesPersistConfig = {
  key: 'templates',
  storage,
  whitelist: [],
}

// Persist configuration for admin users filters
const adminUsersPersistConfig = {
  key: 'adminUsers',
  storage,
  whitelist: ['filters', 'pagination'], // Persist filters and pagination, not users data
}

// Create persisted reducers
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer)
const persistedTicketsReducer = persistReducer(ticketsPersistConfig, ticketsReducer)
const persistedTemplatesReducer = persistReducer(templatesPersistConfig, templatesReducer)
const persistedAdminUsersReducer = persistReducer(adminUsersPersistConfig, adminUsersReducer)

// Middleware to automatically track loading states from async thunks
const loadingMiddleware: Middleware = (store) => (next) => (action: Action) => {
  if (action.type && typeof action.type === 'string') {
    const actionType = action.type as string
    
    if (actionType.endsWith('/pending')) {
      const operation = actionType.replace('/pending', '')
      store.dispatch({
        type: 'loading/setLoadingOperation',
        payload: { operation, loading: true },
      } as Action)
    } else if (actionType.endsWith('/fulfilled') || actionType.endsWith('/rejected')) {
      const operation = actionType.replace('/fulfilled', '').replace('/rejected', '')
      store.dispatch({
        type: 'loading/setLoadingOperation',
        payload: { operation, loading: false },
      } as Action)
    }
  }

  return next(action)
}

// Verify adminUsersReducer is loaded
console.log('Store setup - adminUsersReducer:', adminUsersReducer)
console.log('Store setup - adminUsersReducer type:', typeof adminUsersReducer)
if (!adminUsersReducer) {
  console.error('ERROR: adminUsersReducer is undefined or null!')
}

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    businessRequirement: businessRequirementReducer,
    profiles: profilesReducer,
    campaigns: campaignsReducer,
    decisionMakers: decisionMakerReducer,
    tickets: persistedTicketsReducer,
    templates: persistedTemplatesReducer,
    integrations: integrationsReducer,
    adminUsers: persistedAdminUsersReducer, // Admin users management
    error: errorReducer,
    loading: loadingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(loadingMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
})

// Log initial state after store creation
const initialState = store.getState()
console.log('Store initial state keys:', Object.keys(initialState))
console.log('Store initial state:', initialState)
console.log('adminUsers in store?', 'adminUsers' in initialState)
console.log('adminUsers value:', initialState.adminUsers)

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>

// Set store reference in api.ts to avoid circular dependency
import('../config/api').then((apiModule) => {
  if (apiModule.setStoreReference) {
    apiModule.setStoreReference(store)
  }
})

