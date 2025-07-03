import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup, Table, Badge, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { AlgorandContext } from '../contexts/AlgorandContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Products = () => {
  const { algod, account, isConnected, connectWallet, getAssetInfo } = useContext(AlgorandContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        if (!isConnected) {
          return;
        }
        
        setLoading(true);
        
        // In a real application, you would fetch this data from the blockchain
        // For now, we'll use mock data
        const mockProductIds = [1001, 1002, 1003, 1004, 1005, 1006];
        const productPromises = mockProductIds.map(id => getAssetInfo(id));
        const productDetails = await Promise.all(productPromises);
        
        const formattedProducts = productDetails.map((product, index) => ({
          id: mockProductIds[index],
          name: product.name,
          unitName: product['unit-name'],
          quantity: product.total,
          minThreshold: product.metadata?.minThreshold || 0,
          price: product.metadata?.price || 0,
          location: product.metadata?.location || 'Unknown',
          supplier: product.metadata?.supplier || 'Unknown',
          imageUrl: product.metadata?.imageUrl,
          lastUpdated: product.metadata?.updatedAt || new Date().toISOString(),
          status: getProductStatus(product.total, product.metadata?.minThreshold || 0)
        }));
        
        setProducts(formattedProducts);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [isConnected, getAssetInfo]);
  
  const getProductStatus = (quantity, minThreshold) => {
    if (quantity <= minThreshold / 2) return 'critical';
    if (quantity <= minThreshold) return 'low';
    return 'active';
  };
  
  // Filter and search products
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.unitName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'low') return matchesSearch && product.status === 'low';
    if (filter === 'critical') return matchesSearch && product.status === 'critical';
    
    return matchesSearch;
  });
  
  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'quantity':
        comparison = a.quantity - b.quantity;
        break;
      case 'price':
        comparison = a.price - b.price;
        break;
      case 'lastUpdated':
        comparison = new Date(a.lastUpdated) - new Date(b.lastUpdated);
        break;
      default:
        comparison = 0;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge bg="success">Normal</Badge>;
      case 'low':
        return <Badge bg="warning">Low Stock</Badge>;
      case 'critical':
        return <Badge bg="danger">Critical</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };
  
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };
  
  if (!isConnected) {
    return (
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Products</h1>
          <Button variant="primary" onClick={connectWallet}>Connect Wallet</Button>
        </div>
        
        <Card className="shadow-sm text-center p-5">
          <Card.Body>
            <h2 className="mb-4">Connect Your Wallet</h2>
            <p className="mb-4">You need to connect your wallet to view products.</p>
            <Button 
              variant="primary" 
              size="lg" 
              onClick={connectWallet}
              disabled={loading}
            >
              {loading ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }
  
  if (loading) {
    return (
      <Container className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading products...</p>
      </Container>
    );
  }
  
  return (
    <Container>
      <ToastContainer position="top-right" autoClose={5000} />
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Products</h1>
        <Link to="/products/create">
          <Button variant="primary">Add New Product</Button>
        </Link>
      </div>
      
      {error && (
        <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row>
            <Col md={6} lg={4}>
              <InputGroup className="mb-3">
                <Form.Control
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button variant="outline-secondary">
                  <i className="bi bi-search"></i> Search
                </Button>
              </InputGroup>
            </Col>
            <Col md={6} lg={3}>
              <Form.Group className="mb-3">
                <Form.Select 
                  value={filter} 
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All Products</option>
                  <option value="low">Low Stock</option>
                  <option value="critical">Critical Stock</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col lg={5}>
              <div className="d-flex gap-2">
                <Form.Group className="mb-3 flex-grow-1">
                  <Form.Select 
                    value={sortBy} 
                    onChange={(e) => handleSort(e.target.value)}
                  >
                    <option value="name">Sort by Name</option>
                    <option value="quantity">Sort by Quantity</option>
                    <option value="price">Sort by Price</option>
                    <option value="lastUpdated">Sort by Last Updated</option>
                  </Form.Select>
                </Form.Group>
                <Button 
                  variant="outline-secondary" 
                  className="mb-3"
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                >
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {sortedProducts.length === 0 ? (
        <Card className="shadow-sm text-center p-5">
          <Card.Body>
            <h3>No products found</h3>
            <p className="mb-4">Try adjusting your search or filter criteria, or add a new product.</p>
            <Link to="/products/create">
              <Button variant="primary">Add New Product</Button>
            </Link>
          </Card.Body>
        </Card>
      ) : (
        <Row>
          {sortedProducts.map(product => (
            <Col key={product.id} md={6} lg={4} className="mb-4">
              <Card className="h-100 shadow-sm product-card">
                <Link to={`/products/${product.id}`} className="text-decoration-none">
                  {product.imageUrl && (
                    <div className="product-image-container">
                      <Card.Img 
                        variant="top" 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="product-image"
                      />
                    </div>
                  )}
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <Card.Title>{product.name}</Card.Title>
                        <Card.Subtitle className="mb-2 text-muted">{product.unitName}</Card.Subtitle>
                      </div>
                      <div>
                        {getStatusBadge(product.status)}
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span>Quantity:</span>
                        <span className={product.status !== 'active' ? 'text-danger' : ''}>
                          {product.quantity}
                        </span>
                      </div>
                      <div className="progress mb-3" style={{ height: '6px' }}>
                        <div 
                          className={`progress-bar ${
                            product.status === 'critical' ? 'bg-danger' : 
                            product.status === 'low' ? 'bg-warning' : 
                            'bg-success'
                          }`}
                          style={{ 
                            width: `${Math.min(100, (product.quantity / (product.minThreshold * 2)) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      
                      <div className="d-flex justify-content-between">
                        <span>Price:</span>
                        <span>${product.price.toFixed(2)}</span>
                      </div>
                      
                      <div className="d-flex justify-content-between">
                        <span>Location:</span>
                        <span>{product.location}</span>
                      </div>
                      
                      <div className="d-flex justify-content-between">
                        <span>Min Threshold:</span>
                        <span>{product.minThreshold}</span>
                      </div>
                    </div>
                  </Card.Body>
                  <Card.Footer className="bg-white">
                    <small className="text-muted">
                      Last updated: {new Date(product.lastUpdated).toLocaleDateString()}
                    </small>
                  </Card.Footer>
                </Link>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default Products;