import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAlgorand } from '../context/AlgorandContext';
import ProductCard from '../components/ProductCard';

interface Product {
  id: number;
  name: string;
  unitName: string;
  quantity: number;
  minThreshold: number;
  price: number;
}

const Dashboard: React.FC = () => {
  const { isConnected, connectWallet } = useAlgorand();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real application, you would fetch products from the blockchain
    // For now, we'll use mock data
    if (isConnected) {
      setTimeout(() => {
        setProducts([
          { id: 1, name: 'Organic Apples', unitName: 'APPLE', quantity: 150, minThreshold: 50, price: 1.99 },
          { id: 2, name: 'Premium Coffee', unitName: 'COFFEE', quantity: 25, minThreshold: 30, price: 12.99 },
          { id: 3, name: 'Whole Wheat Bread', unitName: 'BREAD', quantity: 75, minThreshold: 20, price: 3.49 },
          { id: 4, name: 'Organic Milk', unitName: 'MILK', quantity: 40, minThreshold: 15, price: 4.29 },
        ]);
        setLoading(false);
      }, 1000);
    }
  }, [isConnected]);

  const lowStockItems = products.filter(product => product.quantity <= product.minThreshold);
  const totalItems = products.reduce((sum, product) => sum + product.quantity, 0);
  const totalValue = products.reduce((sum, product) => sum + (product.quantity * product.price), 0);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="card max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Welcome to Algorand Inventory System</h2>
          <p className="mb-6 text-gray-600">
            Connect your wallet to manage your inventory on the Algorand blockchain.
          </p>
          <button onClick={connectWallet} className="btn btn-primary">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-algorand-accent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Overview of your inventory</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Products</h3>
          <p className="text-3xl font-bold text-gray-800">{products.length}</p>
        </div>
        
        <div className="card bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Items</h3>
          <p className="text-3xl font-bold text-gray-800">{totalItems}</p>
        </div>
        
        <div className="card bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Value</h3>
          <p className="text-3xl font-bold text-gray-800">${totalValue.toFixed(2)}</p>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Low Stock Alert</h2>
            <Link to="/products" className="text-algorand-accent hover:underline text-sm">
              View All Products
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lowStockItems.map(product => (
              <ProductCard 
                key={product.id}
                id={product.id}
                name={product.name}
                unitName={product.unitName}
                quantity={product.quantity}
                minThreshold={product.minThreshold}
                price={product.price}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Recent Products</h2>
          <Link to="/products/create" className="text-algorand-accent hover:underline text-sm">
            Add New Product
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.slice(0, 3).map(product => (
            <ProductCard 
              key={product.id}
              id={product.id}
              name={product.name}
              unitName={product.unitName}
              quantity={product.quantity}
              minThreshold={product.minThreshold}
              price={product.price}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;