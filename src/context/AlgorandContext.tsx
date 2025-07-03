import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import algosdk from 'algosdk';

interface AlgorandContextType {
  algodClient: algosdk.AlgodClient | null;
  account: algosdk.Account | null;
  isConnected: boolean;
  balance: number;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  createAsset: (
    name: string, 
    unitName: string, 
    totalSupply: number, 
    decimals: number, 
    description: string,
    price: number,
    minThreshold: number
  ) => Promise<number>;
  updateAssetQuantity: (assetId: number, newQuantity: number) => Promise<void>;
  getAssetInfo: (assetId: number) => Promise<any>;
}

const AlgorandContext = createContext<AlgorandContextType | undefined>(undefined);

export const useAlgorand = () => {
  const context = useContext(AlgorandContext);
  if (context === undefined) {
    throw new Error('useAlgorand must be used within an AlgorandProvider');
  }
  return context;
};

interface AlgorandProviderProps {
  children: ReactNode;
}

export const AlgorandProvider: React.FC<AlgorandProviderProps> = ({ children }) => {
  const [algodClient, setAlgodClient] = useState<algosdk.AlgodClient | null>(null);
  const [account, setAccount] = useState<algosdk.Account | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    // Initialize Algod client
    const initAlgodClient = () => {
      // For development, we'll use the PureStake TestNet API
      // In production, you would use your own Algod node or a service like PureStake
      const token = '';
      const server = 'https://testnet-api.algonode.cloud';
      const port = '';
      
      const client = new algosdk.AlgodClient(token, server, port);
      setAlgodClient(client);
    };

    initAlgodClient();
  }, []);

  useEffect(() => {
    // If we have an account, get its balance
    const getBalance = async () => {
      if (algodClient && account) {
        try {
          const accountInfo = await algodClient.accountInformation(account.addr).do();
          setBalance(accountInfo.amount / 1000000); // Convert microAlgos to Algos
        } catch (error) {
          console.error('Error fetching account balance:', error);
        }
      }
    };

    getBalance();
  }, [algodClient, account]);

  const connectWallet = async () => {
    // For development, we'll create a random account
    // In production, you would integrate with a wallet like MyAlgo or AlgoSigner
    try {
      const generatedAccount = algosdk.generateAccount();
      setAccount(generatedAccount);
      setIsConnected(true);
      
      // In a real app, you would need to fund this account for TestNet
      console.log('Account created:', generatedAccount.addr);
      console.log('Save this mnemonic:', algosdk.secretKeyToMnemonic(generatedAccount.sk));
      
      return generatedAccount;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setIsConnected(false);
    setBalance(0);
  };

  const createAsset = async (
    name: string, 
    unitName: string, 
    totalSupply: number, 
    decimals: number, 
    description: string,
    price: number,
    minThreshold: number
  ) => {
    if (!algodClient || !account) {
      throw new Error('Algod client or account not initialized');
    }

    try {
      // Get suggested parameters
      const suggestedParams = await algodClient.getTransactionParams().do();

      // Create metadata JSON
      const metadata = {
        description,
        price,
        minThreshold,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Convert metadata to Uint8Array
      const metadataStr = JSON.stringify(metadata);
      const metadataBytes = new TextEncoder().encode(metadataStr);

      // Create asset creation transaction
      const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
        from: account.addr,
        total: totalSupply,
        decimals,
        defaultFrozen: false,
        manager: account.addr,
        reserve: account.addr,
        freeze: account.addr,
        clawback: account.addr,
        unitName,
        assetName: name,
        note: metadataBytes,
        suggestedParams,
      });

      // Sign transaction
      const signedTxn = txn.signTxn(account.sk);
      
      // Submit transaction
      const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
      
      // Wait for confirmation
      const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 5);
      
      // Get the new asset ID
      const assetId = confirmedTxn.assetIndex;
      console.log('Asset created with ID:', assetId);
      
      return assetId;
    } catch (error) {
      console.error('Error creating asset:', error);
      throw error;
    }
  };

  const updateAssetQuantity = async (assetId: number, newQuantity: number) => {
    if (!algodClient || !account) {
      throw new Error('Algod client or account not initialized');
    }

    try {
      // Get asset info to determine current supply
      const assetInfo = await algodClient.getAssetByID(assetId).do();
      const currentSupply = assetInfo.params.total;
      
      // Get suggested parameters
      const suggestedParams = await algodClient.getTransactionParams().do();

      // Create asset configuration transaction to update total supply
      const txn = algosdk.makeAssetConfigTxnWithSuggestedParamsFromObject({
        from: account.addr,
        suggestedParams,
        assetIndex: assetId,
        manager: account.addr,
        reserve: account.addr,
        freeze: account.addr,
        clawback: account.addr,
        total: newQuantity,
        strictEmptyAddressChecking: false,
      });

      // Sign transaction
      const signedTxn = txn.signTxn(account.sk);
      
      // Submit transaction
      const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
      
      // Wait for confirmation
      await algosdk.waitForConfirmation(algodClient, txId, 5);
      
      console.log(`Asset ${assetId} quantity updated from ${currentSupply} to ${newQuantity}`);
    } catch (error) {
      console.error('Error updating asset quantity:', error);
      throw error;
    }
  };

  const getAssetInfo = async (assetId: number) => {
    if (!algodClient) {
      throw new Error('Algod client not initialized');
    }

    try {
      const assetInfo = await algodClient.getAssetByID(assetId).do();
      
      // Parse metadata from note if available
      let metadata = {};
      if (assetInfo.params.note) {
        try {
          const noteString = new TextDecoder().decode(assetInfo.params.note);
          metadata = JSON.parse(noteString);
        } catch (e) {
          console.warn('Could not parse asset note as JSON');
        }
      }
      
      return {
        ...assetInfo.params,
        metadata,
      };
    } catch (error) {
      console.error('Error getting asset info:', error);
      throw error;
    }
  };

  const value = {
    algodClient,
    account,
    isConnected,
    balance,
    connectWallet,
    disconnectWallet,
    createAsset,
    updateAssetQuantity,
    getAssetInfo,
  };

  return (
    <AlgorandContext.Provider value={value}>
      {children}
    </AlgorandContext.Provider>
  );
};