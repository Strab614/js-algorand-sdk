import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import CreateProduct from './pages/CreateProduct';
import ProductDetails from './pages/ProductDetails';
import Settings from './pages/Settings';
import { AlgorandProvider } from './context/AlgorandContext';

const App: React.FC = () => {
  return (
    <AlgorandProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/create" element={<CreateProduct />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </AlgorandProvider>
  );
};

export default App;