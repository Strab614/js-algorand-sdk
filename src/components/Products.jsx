import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup, Table, Badge, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { AlgorandContext } from '../contexts/AlgorandContext';
import { getAssetInfo } from '../utils/algorand';

const Products = () => {
  const { algod, account, appIds } = useContext(AlgorandContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        if (algod && account) {
          // In a real application, you would fetch this data from the blockchain
          // For now, we'll use mock data
          const mockProducts = [
            { 
              id: 1001, 
              name: 'Widget A', 
              quantity: 65, 
              minThreshold: 25, 
              price: 19.99, 
              location: 'Warehouse 1', 
              supplier: 'Supplier X',
              assetId: 12345,
              lastUpdated: '2023-11-10',
              status: 'active'
            },
            { 
              id: 1002, 
              name: 'Gadget B', 
              quantity: 20, 
              minThreshold: 10, 
              price: 49.99, 
              location: 'Warehouse 2', 
              supplier: 'Supplier Y',
              assetId: 12346,
              lastUpdated: '2023-11-12',
              status: 'active'
            },
            { 
              id: 1003, 
              name: 'Tool C', 
              quantity: 15, 
              minThreshold: 30, 
              price: 29.99, 
              location: 'Warehouse 1', 
              supplier: 'Supplier Z',
              assetId: 12347,
              lastUpdated: '2023-11-14',
              status: 'low'
            },
            { 
              id: 1004, 
              name: 'Part D', 
              quantity: 81, 
              minThreshold: 40, 
              price: 9.99, 
              location: 'Warehouse 3', 
              supplier: 'Supplier X',
              assetId: 12348,
              lastUpdated: '2023-11-15',
              status: 'active'
            },
            { 
              id: 1005, 
              name: 'Component E', 
              quantity: 5, 
              minThreshold: 20, 
              price: 39.99, 
              location: 'Warehouse 2', 
              supplier: 'Supplier Y',
              assetId: 12349,
              lastUpdated: '2023-11-13',
              status: 'critical'
            },
            { 
              id: 1006, 
              name: 'Material F', 
              quantity: 40, 
              minThreshold: 15, 
              price: 14.99, 
              location: 'Warehouse 1', 
              supplier: 'Supplier Z',
              assetId: 12350,
              lastUpdated: '2023-11-11',
              status: 'active'
            }
          ];
          
          setProducts(mockProducts);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [algod, account]);
  
  // Filter and search products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'low') return matchesSearch && product.status === 'low';
    if (filter === 'critical') return matchesSearch && product.status === 'critical';
    
    return matchesSearch;
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
  
  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }
  
  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Products</h1>
        <Link to="/products/create">
          <Button variant="primary">Add New Product</Button>
        </Link>
      </div>
      
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row>
            <Col md={6}>
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
            <Col md={6}>
              <Form.Group>
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
          </Row>
        </Card.Body>
      </Card>
      
      <Card className="shadow-sm">
        <Card.Body>
          <div className="table-responsive">
            <Table striped hover>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Location</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(product => (
                    <tr key={product.id}>
                      <td>{product.id}</td>
                      <td>{product.name}</td>
                      <td>
                        {product.quantity}
                        {product.quantity < product.minThreshold && (
                          <span className="ms-2 text-danger">
                            <i className="bi bi-exclamation-triangle-fill"></i>
                          </span>
                        )}
                      </td>
                      <td>${product.price.toFixed(2)}</td>
                      <td>{product.location}</td>
                      <td>{product.supplier}</td>
                      <td>{getStatusBadge(product.status)}</td>
                      <td>{product.lastUpdated}</td>
                      <td>
                        <Link to={`/products/${product.id}`}>
                          <Button variant="outline-primary" size="sm" className="me-1">
                            View
                          </Button>
                        </Link>
                        <Button variant="outline-secondary" size="sm">
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center">No products found</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Products;