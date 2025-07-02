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

const Products: React.FC = () => {
  const { isConnected } = useAlgorand();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOption, setFilterOption] = useState('all');

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
          { id: 5, name: 'Free Range Eggs', unitName: 'EGGS', quantity: 120, minThreshold: 40, price: 5.99 },
          { id: 6, name: 'Avocados', unitName: 'AVOCADO', quantity: 60, minThreshold: 25, price: 2.49 },
        ]);
        setLoading(false);
      }, 1000);
    }
  }, [isConnected]);

  const filteredProducts = products
    .filter(product => {
      if (filterOption === 'low-stock') {
        return product.quantity <= product.minThreshold;
      }
      return true;
    })
    .filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.unitName.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-algorand-accent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Products</h1>
          <p className="text-gray-600">Manage your inventory products</p>
        </div>
        <Link to="/products/create" className="btn btn-primary">
          Add New Product
        </Link>
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search products..."
            className="input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <select
            className="input"
            value={filterOption}
            onChange={(e) => setFilterOption(e.target.value)}
          >
            <option value="all">All Products</option>
            <option value="low-stock">Low Stock</option>
          </select>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">No products found</p>
          <Link to="/products/create" className="btn btn-primary inline-block">
            Add Your First Product
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
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
      )}
    </div>
  );
};

export default Products;