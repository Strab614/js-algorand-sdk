import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAlgorand } from '../context/AlgorandContext';

interface ProductDetails {
  id: number;
  name: string;
  unitName: string;
  total: number;
  decimals: number;
  url?: string;
  metadata: {
    description: string;
    price: number;
    minThreshold: number;
    createdAt: string;
    updatedAt: string;
  };
}

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isConnected, connectWallet, getAssetInfo, updateAssetQuantity } = useAlgorand();
  
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!isConnected) return;
      
      try {
        setLoading(true);
        
        if (id) {
          // In a real app, this would fetch from the blockchain
          // For now, we'll simulate with mock data or use the getAssetInfo function
          
          // Mock data for demonstration
          if (id === '1') {
            setProduct({
              id: 1,
              name: 'Organic Apples',
              unitName: 'APPLE',
              total: 150,
              decimals: 0,
              metadata: {
                description: 'Fresh organic apples from local farms',
                price: 1.99,
                minThreshold: 50,
                createdAt: '2023-04-15T10:30:00Z',
                updatedAt: '2023-04-15T10:30:00Z'
              }
            });
          } else {
            // Attempt to get real data
            const assetInfo = await getAssetInfo(parseInt(id));
            setProduct({
              id: parseInt(id),
              name: assetInfo.assetName,
              unitName: assetInfo.unitName,
              total: assetInfo.total,
              decimals: assetInfo.decimals,
              url: assetInfo.url,
              metadata: assetInfo.metadata
            });
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching product details:', error);
        setError('Failed to load product details');
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id, isConnected, getAssetInfo]);

  useEffect(() => {
    if (product) {
      setNewQuantity(product.total);
    }
  }, [product]);

  const handleUpdateQuantity = async () => {
    if (!product || !id) return;
    
    try {
      setUpdating(true);
      await updateAssetQuantity(parseInt(id), newQuantity);
      
      // Update the local product state
      setProduct(prev => {
        if (!prev) return null;
        return {
          ...prev,
          total: newQuantity,
          metadata: {
            ...prev.metadata,
            updatedAt: new Date().toISOString()
          }
        };
      });
      
      setUpdating(false);
    } catch (error) {
      console.error('Error updating quantity:', error);
      setError('Failed to update quantity');
      setUpdating(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="card max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="mb-6 text-gray-600">
            You need to connect your wallet to view product details.
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

  if (error || !product) {
    return (
      <div className="card text-center py-12">
        <p className="text-red-500 mb-4">{error || 'Product not found'}</p>
        <button onClick={() => navigate('/products')} className="btn btn-primary">
          Back to Products
        </button>
      </div>
    );
  }

  const isLowStock = product.total <= product.metadata.minThreshold;
  const formattedCreatedDate = new Date(product.metadata.createdAt).toLocaleDateString();
  const formattedUpdatedDate = new Date(product.metadata.updatedAt).toLocaleDateString();

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{product.name}</h1>
          <p className="text-gray-600">Product Details</p>
        </div>
        <button 
          onClick={() => navigate('/products')}
          className="btn btn-secondary"
        >
          Back to Products
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">Product Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Product Name</p>
                <p className="font-medium">{product.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unit Name</p>
                <p className="font-medium">{product.unitName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Asset ID</p>
                <p className="font-medium">{product.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Decimals</p>
                <p className="font-medium">{product.decimals}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Price</p>
                <p className="font-medium">${product.metadata.price.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="font-medium">${(product.total * product.metadata.price).toFixed(2)}</p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-2">Description</p>
              <p>{product.metadata.description}</p>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Update Inventory</h2>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Quantity
              </label>
              <input
                type="number"
                value={newQuantity}
                onChange={(e) => setNewQuantity(parseInt(e.target.value))}
                className="input"
                min="0"
              />
            </div>
            
            <button
              onClick={handleUpdateQuantity}
              className="btn btn-primary"
              disabled={updating || newQuantity === product.total}
            >
              {updating ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </span>
              ) : (
                'Update Quantity'
              )}
            </button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">Inventory Status</h2>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">Current Quantity</span>
                <span className={`text-sm font-medium ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                  {product.total} {isLowStock && '(Low Stock)'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${isLowStock ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(100, (product.total / (product.metadata.minThreshold * 2)) * 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500">Minimum Threshold</p>
              <p className="font-medium">{product.metadata.minThreshold}</p>
            </div>
            
            {isLowStock && (
              <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
                <p className="font-medium">Reorder Alert</p>
                <p className="text-sm">Stock is below the minimum threshold. Consider reordering soon.</p>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Product History</h2>
            
            <div className="mb-2">
              <p className="text-sm text-gray-500">Created On</p>
              <p className="font-medium">{formattedCreatedDate}</p>
            </div>
            
            <div className="mb-2">
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="font-medium">{formattedUpdatedDate}</p>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500 mb-2">Blockchain Details</p>
              <p className="text-xs text-gray-600 break-all">
                Asset ID: {product.id}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;