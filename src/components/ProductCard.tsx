import React from 'react';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  id: number;
  name: string;
  unitName: string;
  quantity: number;
  minThreshold: number;
  price: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  id, 
  name, 
  unitName, 
  quantity, 
  minThreshold,
  price
}) => {
  const isLowStock = quantity <= minThreshold;

  return (
    <Link to={`/products/${id}`} className="block">
      <div className="card hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{name}</h3>
            <p className="text-sm text-gray-500">Unit: {unitName}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-medium">${price.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">Quantity</span>
            <span className={`text-sm font-medium ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
              {quantity} {isLowStock && '(Low Stock)'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${isLowStock ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(100, (quantity / (minThreshold * 2)) * 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Min threshold: {minThreshold}</p>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;