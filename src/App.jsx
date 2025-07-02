import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Container, Nav, Navbar } from 'react-bootstrap';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Transactions from './components/Transactions';
import Settings from './components/Settings';
import ProductDetail from './components/ProductDetail';
import CreateProduct from './components/CreateProduct';
import { AlgorandContext } from './contexts/AlgorandContext';
import { initAlgorand } from './utils/algorand';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/App.css';

function App() {
  const [algod, setAlgod] = useState(null);
  const [account, setAccount] = useState(null);
  const [appIds, setAppIds] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const init = async () => {
      try {
        const { algodClient, accountInfo, appIds } = await initAlgorand();
        setAlgod(algodClient);
        setAccount(accountInfo);
        setAppIds(appIds);
      } catch (error) {
        console.error('Failed to initialize Algorand connection:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Connecting to Algorand network...</p>
        </div>
      </Container>
    );
  }

  return (
    <AlgorandContext.Provider value={{ algod, account, appIds }}>
      <div className="app-container">
        <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
          <Container>
            <Navbar.Brand as={Link} to="/">Algorand Inventory Management</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/" active={location.pathname === '/'}>Dashboard</Nav.Link>
                <Nav.Link as={Link} to="/products" active={location.pathname === '/products'}>Products</Nav.Link>
                <Nav.Link as={Link} to="/transactions" active={location.pathname === '/transactions'}>Transactions</Nav.Link>
                <Nav.Link as={Link} to="/settings" active={location.pathname === '/settings'}>Settings</Nav.Link>
              </Nav>
              {account && (
                <Navbar.Text>
                  Connected: <span className="text-light">{account.address.substring(0, 8)}...{account.address.substring(account.address.length - 4)}</span>
                </Navbar.Text>
              )}
            </Navbar.Collapse>
          </Container>
        </Navbar>

        <Container className="py-3">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/create" element={<CreateProduct />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Container>

        <footer className="bg-dark text-light py-4 mt-5">
          <Container>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5>Algorand Inventory Management</h5>
                <p className="mb-0">Powered by Algorand Blockchain</p>
              </div>
              <div>
                {account && (
                  <small>
                    Connected to {algod ? 'Algorand Network' : 'No Network'}<br />
                    Account: {account.address.substring(0, 8)}...{account.address.substring(account.address.length - 4)}
                  </small>
                )}
              </div>
            </div>
          </Container>
        </footer>
      </div>
    </AlgorandContext.Provider>
  );
}

export default App;