import { createContext } from 'react';

export const AlgorandContext = createContext({
  algod: null,
  account: null,
  appIds: null
});