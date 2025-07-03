import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import algosdk from 'algosdk';
import axios from 'axios';

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
    minThreshold: number,
    imageUrl?: string
  ) => Promise<number>;
  updateAssetQuantity: (assetId: number, newQuantity: number) => Promise<void>;
  getAssetInfo: (assetId: number) => Promise<any>;
  uploadImage: (file: File) => Promise<string>;
  transferAsset: (assetId: number, receiverAddress: string, amount: number) => Promise<void>;
  getTransactionHistory: (assetId?: number) => Promise<any[]>;
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

  const uploadImage = async (file: File): Promise<string> => {
    try {
      // In a real application, you would upload to IPFS or a storage service
      // For this demo, we'll simulate an upload and return a placeholder URL
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return a placeholder image URL based on the file name
      // In a real app, this would be the URL returned from your storage service
      return `https://picsum.photos/seed/${file.name.replace(/\s+/g, '')}/500/500`;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  };

  const createAsset = async (
    name: string, 
    unitName: string, 
    totalSupply: number, 
    decimals: number, 
    description: string,
    price: number,
    minThreshold: number,
    imageUrl?: string
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
        imageUrl,
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

  const transferAsset = async (assetId: number, receiverAddress: string, amount: number) => {
    if (!algodClient || !account) {
      throw new Error('Algod client or account not initialized');
    }

    try {
      // Get suggested parameters
      const suggestedParams = await algodClient.getTransactionParams().do();

      // Create asset transfer transaction
      const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: account.addr,
        to: receiverAddress,
        amount,
        assetIndex: assetId,
        suggestedParams,
      });

      // Sign transaction
      const signedTxn = txn.signTxn(account.sk);
      
      // Submit transaction
      const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
      
      // Wait for confirmation
      await algosdk.waitForConfirmation(algodClient, txId, 5);
      
      console.log(`Transferred ${amount} units of asset ${assetId} to ${receiverAddress}`);
    } catch (error) {
      console.error('Error transferring asset:', error);
      throw error;
    }
  };

  const getAssetInfo = async (assetId: number) => {
    if (!algodClient) {
      throw new Error('Algod client not initialized');
    }

    try {
      // For demo purposes, return mock data if we can't connect to the network
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
        console.warn('Could not fetch real asset info, returning mock data');
        return {
          params: {
            creator: account?.addr || 'PEXLDII3...DDJM',
            total: 1000,
            decimals: 0,
            'default-frozen': false,
            'unit-name': 'PROD',
            name: 'Product ' + assetId,
            url: '',
            metadata: null,
            manager: account?.addr || 'PEXLDII3...DDJM',
            reserve: account?.addr || 'PEXLDII3...DDJM',
            freeze: account?.addr || 'PEXLDII3...DDJM',
            clawback: account?.addr || 'PEXLDII3...DDJM'
          },
          metadata: {
            description: 'Sample product description',
            price: 19.99,
            minThreshold: 20,
            imageUrl: `https://picsum.photos/seed/product${assetId}/500/500`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        };
      }
    } catch (error) {
      console.error('Error getting asset info:', error);
      throw error;
    }
  };

  const getTransactionHistory = async (assetId?: number) => {
    if (!algodClient || !account) {
      throw new Error('Algod client or account not initialized');
    }

    try {
      // In a real application, you would query the Algorand Indexer for transaction history
      // For this demo, we'll return mock data
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate mock transaction history
      const mockTransactions = [
        { 
          id: 'TX12345', 
          type: 'Restock', 
          product: assetId ? `Product ${assetId}` : 'Widget A', 
          assetId: assetId || 12345,
          quantity: 50, 
          date: new Date(Date.now() - 86400000).toISOString(),
          sender: account.addr,
          receiver: account.addr,
          txId: 'ALGOTX123456789',
          confirmed: true
        },
        { 
          id: 'TX12346', 
          type: 'Sale', 
          product: assetId ? `Product ${assetId}` : 'Gadget B', 
          assetId: assetId || 12346,
          quantity: -5, 
          date: new Date(Date.now() - 172800000).toISOString(),
          sender: account.addr,
          receiver: 'XBYLS2E6YI6XXL5BWCAMOA4GTWHXWENZMX5UHXMRNWWUQ7BXCY5WC5TEPA',
          txId: 'ALGOTX123456790',
          confirmed: true
        },
        { 
          id: 'TX12347', 
          type: 'Adjustment', 
          product: assetId ? `Product ${assetId}` : 'Tool C', 
          assetId: assetId || 12347,
          quantity: -2, 
          date: new Date(Date.now() - 259200000).toISOString(),
          sender: account.addr,
          receiver: account.addr,
          txId: 'ALGOTX123456791',
          confirmed: true
        },
        { 
          id: 'TX12348', 
          type: 'Restock', 
          product: assetId ? `Product ${assetId}` : 'Part D', 
          assetId: assetId || 12348,
          quantity: 100, 
          date: new Date(Date.now() - 345600000).toISOString(),
          sender: 'BFRTECKTOOE7A5LHCF3TTEOH2A7BW46IYT2SX5VP6ANKEXHZYJY77SJTVM',
          receiver: account.addr,
          txId: 'ALGOTX123456792',
          confirmed: true
        }
      ];
      
      // Filter by assetId if provided
      return assetId 
        ? mockTransactions.filter(tx => tx.assetId === assetId)
        : mockTransactions;
    } catch (error) {
      console.error('Error getting transaction history:', error);
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
    uploadImage,
    transferAsset,
    getTransactionHistory,
  };

  return (
    <AlgorandContext.Provider value={value}>
      {children}
    </AlgorandContext.Provider>
  );
};