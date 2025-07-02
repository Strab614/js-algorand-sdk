import React, { useState } from 'react';
import { useAlgorand } from '../context/AlgorandContext';

const Settings: React.FC = () => {
  const { isConnected, account, connectWallet } = useAlgorand();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="card max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="mb-6 text-gray-600">
            You need to connect your wallet to access settings.
          </p>
          <button onClick={connectWallet} className="btn btn-primary">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-600">Manage your account and application settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">Account Information</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">Wallet Address</p>
              <div className="flex items-center">
                <code className="bg-gray-100 p-2 rounded text-sm flex-1 overflow-x-auto">
                  {account?.addr}
                </code>
                <button 
                  onClick={() => copyToClipboard(account?.addr || '')}
                  className="ml-2 p-2 text-gray-500 hover:text-gray-700"
                >
                  {copied ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span>📋</span>
                  )}
                </button>
              </div>
            </div>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    This is a demo application. In a production environment, you would connect to a real wallet like MyAlgo, Pera Wallet, or AlgoSigner.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Application Settings</h2>
            
            <div className="mb-4">
              <label className="flex items-center">
                <input type="checkbox" className="h-4 w-4 text-algorand-accent focus:ring-algorand-accent border-gray-300 rounded" />
                <span className="ml-2 text-gray-700">Enable low stock notifications</span>
              </label>
            </div>
            
            <div className="mb-4">
              <label className="flex items-center">
                <input type="checkbox" className="h-4 w-4 text-algorand-accent focus:ring-algorand-accent border-gray-300 rounded" />
                <span className="ml-2 text-gray-700">Auto-generate reorder requests</span>
              </label>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Currency
              </label>
              <select className="input">
                <option>USD ($)</option>
                <option>EUR (€)</option>
                <option>GBP (£)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">About</h2>
            <p className="text-gray-600 mb-4">
              Algorand Inventory Management System is a blockchain-based solution for tracking and managing inventory using Algorand Standard Assets (ASA).
            </p>
            <p className="text-gray-600">
              Version: 1.0.0
            </p>
          </div>
          
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Resources</h2>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://developer.algorand.org/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-algorand-accent hover:underline"
                >
                  Algorand Developer Documentation
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/algorand/js-algorand-sdk" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-algorand-accent hover:underline"
                >
                  JavaScript Algorand SDK
                </a>
              </li>
              <li>
                <a 
                  href="https://algoexplorer.io/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-algorand-accent hover:underline"
                >
                  AlgoExplorer
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;