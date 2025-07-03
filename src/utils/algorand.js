import algosdk from 'algosdk';

// Algorand node connection parameters - using public TestNet API
const algodServer = 'https://testnet-api.algonode.cloud';
const algodPort = '';
const algodToken = '';

// Initialize Algorand client
export const initAlgorand = async () => {
  try {
    // Initialize Algod client
    const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);
    
    // Check if we have account info in local storage
    let accountInfo = null;
    const storedAccount = localStorage.getItem('algorandAccount');
    
    if (storedAccount) {
      accountInfo = JSON.parse(storedAccount);
    } else {
      // For demo purposes, we'll create a new account
      // In production, you would use wallet connection
      const account = algosdk.generateAccount();
      accountInfo = {
        address: account.addr.toString(),
        mnemonic: algosdk.secretKeyToMnemonic(account.sk)
      };
      localStorage.setItem('algorandAccount', JSON.stringify(accountInfo));
      
      console.log('Created new account:', accountInfo.address);
      console.log('Please fund this account to use the application');
    }
    
    // Load app IDs from deployed contracts
    let appIds = null;
    try {
      // Try to fetch app IDs from the deployment file
      const response = await fetch('/app_ids.json');
      if (response.ok) {
        appIds = await response.json();
        console.log('Loaded deployed app IDs:', appIds);
      } else {
        throw new Error('app_ids.json not found');
      }
    } catch (error) {
      console.warn('Could not load app IDs from deployment file:', error);
      // Check if we have app IDs in local storage as fallback
      const storedAppIds = localStorage.getItem('algorandAppIds');
      if (storedAppIds) {
        appIds = JSON.parse(storedAppIds);
        console.log('Loaded app IDs from local storage:', appIds);
      } else {
        // Default app IDs for testing - set to non-zero values to simulate deployment
        appIds = {
          inventory_app_id: 123456789,
          asset_app_id: 123456790,
          oracle_app_id: 123456791,
          security_app_id: 123456792
        };
        console.log('Using default test app IDs:', appIds);
        // Store the default IDs for consistency
        localStorage.setItem('algorandAppIds', JSON.stringify(appIds));
      }
    }
    
    return { algodClient, accountInfo, appIds };
  } catch (error) {
    console.error('Error initializing Algorand:', error);
    throw error;
  }
};

// Create an ASA for a product
export const createProductASA = async (algodClient, account, productData) => {
  try {
    // Get suggested parameters
    const params = await algodClient.getTransactionParams().do();
    
    // Convert mnemonic to private key
    const privateKey = algosdk.mnemonicToSecretKey(account.mnemonic).sk;
    
    // Create unsigned asset creation transaction
    const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
      from: account.address,
      total: productData.quantity,
      decimals: 0,
      defaultFrozen: false,
      manager: account.address,
      reserve: account.address,
      freeze: account.address,
      clawback: account.address,
      unitName: productData.unitName,
      assetName: productData.name,
      url: productData.url,
      suggestedParams: params,
    });
    
    // Sign transaction
    const signedTxn = txn.signTxn(privateKey);
    
    // Submit transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    
    // Wait for confirmation
    const result = await waitForConfirmation(algodClient, txId, 5);
    
    // Get the asset ID
    const assetId = result['asset-index'];
    
    return assetId;
  } catch (error) {
    console.error('Error creating product ASA:', error);
    throw error;
  }
};

// Call a smart contract method
export const callApp = async (algodClient, account, appId, appArgs, accounts = undefined, foreignApps = undefined, foreignAssets = undefined) => {
  try {
    // Get suggested parameters
    const params = await algodClient.getTransactionParams().do();
    
    // Convert mnemonic to private key
    const privateKey = algosdk.mnemonicToSecretKey(account.mnemonic).sk;
    
    // Create unsigned application call transaction
    const txn = algosdk.makeApplicationNoOpTxnFromObject({
      from: account.address,
      appIndex: appId,
      appArgs: appArgs.map(arg => 
        typeof arg === 'number' ? algosdk.encodeUint64(arg) : 
        typeof arg === 'string' ? new TextEncoder().encode(arg) : 
        arg
      ),
      accounts,
      foreignApps,
      foreignAssets,
      suggestedParams: params,
    });
    
    // Sign transaction
    const signedTxn = txn.signTxn(privateKey);
    
    // Submit transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    
    // Wait for confirmation
    const result = await waitForConfirmation(algodClient, txId, 5);
    
    return result;
  } catch (error) {
    console.error('Error calling application:', error);
    throw error;
  }
};

// Wait for transaction confirmation
export const waitForConfirmation = async (algodClient, txId, timeout) => {
  try {
    const status = await algodClient.status().do();
    let lastRound = status["last-round"];
    
    for (let i = 0; i < timeout; i++) {
      const pendingInfo = await algodClient.pendingTransactionInformation(txId).do();
      
      if (pendingInfo["confirmed-round"] !== null && pendingInfo["confirmed-round"] > 0) {
        return pendingInfo;
      }
      
      await algodClient.statusAfterBlock(lastRound + 1).do();
      lastRound++;
    }
    
    throw new Error(`Transaction not confirmed after ${timeout} rounds`);
  } catch (error) {
    console.error('Error waiting for confirmation:', error);
    throw error;
  }
};

// Get account information
export const getAccountInfo = async (algodClient, address) => {
  try {
    // For demo purposes, return mock data if we can't connect to the network
    try {
      return await algodClient.accountInformation(address).do();
    } catch (error) {
      console.warn('Could not fetch real account info, returning mock data');
      return {
        amount: 1000000, // 1 Algo
        'min-balance': 100000,
        'created-apps': [],
        'created-assets': []
      };
    }
  } catch (error) {
    console.error('Error getting account info:', error);
    throw error;
  }
};

// Get asset information
export const getAssetInfo = async (algodClient, assetId) => {
  try {
    // For demo purposes, return mock data if we can't connect to the network
    try {
      return await algodClient.getAssetByID(assetId).do();
    } catch (error) {
      console.warn('Could not fetch real asset info, returning mock data');
      return {
        params: {
          creator: 'PEXLDII3...DDJM',
          total: 1000,
          decimals: 0,
          'default-frozen': false,
          'unit-name': 'PROD',
          name: 'Product ' + assetId,
          url: '',
          metadata: null,
          manager: 'PEXLDII3...DDJM',
          reserve: 'PEXLDII3...DDJM',
          freeze: 'PEXLDII3...DDJM',
          clawback: 'PEXLDII3...DDJM'
        },
        metadata: {
          description: 'Sample product description',
          price: 19.99,
          minThreshold: 20,
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