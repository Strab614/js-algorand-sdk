import React from 'react';
import { useAlgorand } from '../context/AlgorandContext';

const Navbar: React.FC = () => {
  const { isConnected, account, balance, connectWallet, disconnectWallet } = useAlgorand();

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2.5 flex justify-between items-center">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-gray-800">Algorand Inventory System</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        {isConnected ? (
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <span className="block">Address: {account?.addr.substring(0, 8)}...{account?.addr.substring(account.addr.length - 4)}</span>
              <span className="block">Balance: {balance.toFixed(4)} ALGO</span>
            </div>
            <button 
              onClick={disconnectWallet}
              className="btn btn-secondary text-sm"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button 
            onClick={connectWallet}
            className="btn btn-primary text-sm"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;