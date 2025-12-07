import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import rootReducer from './appState';
import { proxyListenerMiddleware } from './appState/listeners/proxySettings';
import rootSaga from './saga';

const sagaMiddleware = createSagaMiddleware();

const middleware = [sagaMiddleware, proxyListenerMiddleware.middleware];

function setupStore(initialState = {}) {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => {
      return getDefaultMiddleware({ serializableCheck: false }).concat(...middleware);
    },
    preloadedState: initialState, // grab it from local storage or use initial state from appState
  });
  sagaMiddleware.run(rootSaga);
  return store;
}

export type RootState = ReturnType<typeof rootReducer>;
export default setupStore;
