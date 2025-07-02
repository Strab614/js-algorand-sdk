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
    
    // Load app IDs
    let appIds = null;
    try {
      const response = await fetch('/app_ids.json');
      appIds = await response.json();
    } catch (error) {
      console.warn('Could not load app IDs:', error);
      // Default app IDs for testing
      appIds = {
        inventory_app_id: 0,
        asset_app_id: 0,
        oracle_app_id: 0,
        security_app_id: 0
      };
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
};

// Get account information
export const getAccountInfo = async (algodClient, address) => {
  try {
    return await algodClient.accountInformation(address).do();
  } catch (error) {
    console.error('Error getting account info:', error);
    throw error;
  }
};

// Get asset information
export const getAssetInfo = async (algodClient, assetId) => {
  try {
    return await algodClient.getAssetByID(assetId).do();
  } catch (error) {
    console.error('Error getting asset info:', error);
    throw error;
  }
};