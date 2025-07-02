import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlgorand } from '../context/AlgorandContext';

const CreateProduct: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected, connectWallet, createAsset } = useAlgorand();
  
  const [formData, setFormData] = useState({
    name: '',
    unitName: '',
    totalSupply: 0,
    decimals: 0,
    description: '',
    price: 0,
    minThreshold: 0,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'name' || name === 'unitName' || name === 'description' 
        ? value 
        : parseFloat(value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      try {
        await connectWallet();
      } catch (error) {
        setError('Failed to connect wallet. Please try again.');
        return;
      }
    }
    
    try {
      setLoading(true);
      setError('');
      
      const assetId = await createAsset(
        formData.name,
        formData.unitName,
        formData.totalSupply,
        formData.decimals,
        formData.description,
        formData.price,
        formData.minThreshold
      );
      
      // Navigate to the product details page
      navigate(`/products/${assetId}`);
    } catch (error) {
      console.error('Error creating product:', error);
      setError('Failed to create product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="card max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="mb-6 text-gray-600">
            You need to connect your wallet to create a new product.
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
        <h1 className="text-2xl font-bold text-gray-800">Create New Product</h1>
        <p className="text-gray-600">Add a new product to your inventory</p>
      </div>

      <div className="card max-w-2xl mx-auto">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                placeholder="e.g., Organic Apples"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Name (max 8 characters)
              </label>
              <input
                type="text"
                name="unitName"
                value={formData.unitName}
                onChange={handleChange}
                className="input"
                placeholder="e.g., APPLE"
                maxLength={8}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Initial Quantity
              </label>
              <input
                type="number"
                name="totalSupply"
                value={formData.totalSupply || ''}
                onChange={handleChange}
                className="input"
                placeholder="e.g., 100"
                min="1"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Decimals
              </label>
              <input
                type="number"
                name="decimals"
                value={formData.decimals || ''}
                onChange={handleChange}
                className="input"
                placeholder="e.g., 0"
                min="0"
                max="19"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Usually 0 for inventory items
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (USD)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price || ''}
                onChange={handleChange}
                className="input"
                placeholder="e.g., 1.99"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Threshold
            </label>
            <input
              type="number"
              name="minThreshold"
              value={formData.minThreshold || ''}
              onChange={handleChange}
              className="input"
              placeholder="e.g., 20"
              min="0"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              System will alert when quantity falls below this threshold
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input min-h-[100px]"
              placeholder="Enter product description..."
              required
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : (
                'Create Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProduct;