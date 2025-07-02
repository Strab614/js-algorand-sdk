import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Table, Badge, Alert, Form, Modal } from 'react-bootstrap';
import { AlgorandContext } from '../contexts/AlgorandContext';
import { getAssetInfo, callApp } from '../utils/algorand';

const ProductDetail = () => {
  const { id } = useParams();
  const { algod, account, appIds } = useContext(AlgorandContext);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateQuantity, setUpdateQuantity] = useState(0);
  const [updateType, setUpdateType] = useState('add');
  const [transactionHistory, setTransactionHistory] = useState([]);
  
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        if (algod && account) {
          // In a real application, you would fetch this data from the blockchain
          // For now, we'll use mock data
          const mockProduct = { 
            id: parseInt(id), 
            name: `Product ${id}`, 
            quantity: 65, 
            minThreshold: 25, 
            price: 19.99, 
            location: 'Warehouse 1', 
            supplier: 'Supplier X',
            assetId: 12345,
            lastUpdated: '2023-11-10',
            status: 'active',
            description: 'This is a detailed description of the product. It includes information about the product specifications, usage, and other relevant details.',
            expirationDate: '2024-12-31',
            createdAt: '2023-01-15',
            metadata: {
              weight: '1.5 kg',
              dimensions: '10 x 15 x 5 cm',
              category: 'Electronics',
              sku: 'SKU12345'
            }
          };
          
          setProduct(mockProduct);
          
          // Mock transaction history
          setTransactionHistory([
            { id: 1, type: 'Restock', quantity: 50, date: '2023-11-10', user: 'Admin' },
            { id: 2, type: 'Sale', quantity: -10, date: '2023-11-08', user: 'System' },
            { id: 3, type: 'Adjustment', quantity: -5, date: '2023-11-05', user: 'Admin' },
            { id: 4, type: 'Restock', quantity: 30, date: '2023-10-28', user: 'Admin' }
          ]);
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
        setError('Failed to load product details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductDetails();
  }, [algod, account, id]);
  
  const handleUpdateQuantity = async () => {
    try {
      setLoading(true);
      
      // Calculate the new quantity
      const quantityChange = updateType === 'add' ? parseInt(updateQuantity) : -parseInt(updateQuantity);
      const newQuantity = product.quantity + quantityChange;
      
      if (newQuantity < 0) {
        setError('Quantity cannot be negative');
        return;
      }
      
      // In a real application, you would call the smart contract to update the quantity
      // For now, we'll just update the local state
      setProduct({
        ...product,
        quantity: newQuantity,
        lastUpdated: new Date().toISOString().split('T')[0],
        status: newQuantity < product.minThreshold ? (newQuantity < product.minThreshold / 2 ? 'critical' : 'low') : 'active'
      });
      
      // Add to transaction history
      setTransactionHistory([
        {
          id: transactionHistory.length + 1,
          type: updateType === 'add' ? 'Restock' : 'Adjustment',
          quantity: quantityChange,
          date: new Date().toISOString().split('T')[0],
          user: 'Admin'
        },
        ...transactionHistory
      ]);
      
      setShowUpdateModal(false);
      setUpdateQuantity(0);
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError('Failed to update quantity. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
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
        <p className="mt-3">Loading product details...</p>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
        <Button as={Link} to="/products" variant="secondary">Back to Products</Button>
      </Container>
    );
  }
  
  if (!product) {
    return (
      <Container className="my-5">
        <Alert variant="warning">Product not found</Alert>
        <Button as={Link} to="/products" variant="secondary">Back to Products</Button>
      </Container>
    );
  }
  
  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Product Details</h1>
        <Button as={Link} to="/products" variant="secondary">Back to Products</Button>
      </div>
      
      <Row>
        <Col md={8}>
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h2>{product.name}</h2>
                  <p className="text-muted">ID: {product.id} | Asset ID: {product.assetId}</p>
                </div>
                <div>
                  {getStatusBadge(product.status)}
                </div>
              </div>
              
              <p>{product.description}</p>
              
              <Row className="mt-4">
                <Col md={6}>
                  <h5>Product Information</h5>
                  <Table bordered>
                    <tbody>
                      <tr>
                        <th>Price</th>
                        <td>${product.price.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <th>Location</th>
                        <td>{product.location}</td>
                      </tr>
                      <tr>
                        <th>Supplier</th>
                        <td>{product.supplier}</td>
                      </tr>
                      <tr>
                        <th>Created</th>
                        <td>{product.createdAt}</td>
                      </tr>
                      <tr>
                        <th>Expiration</th>
                        <td>{product.expirationDate}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
                <Col md={6}>
                  <h5>Metadata</h5>
                  <Table bordered>
                    <tbody>
                      {Object.entries(product.metadata).map(([key, value]) => (
                        <tr key={key}>
                          <th>{key.charAt(0).toUpperCase() + key.slice(1)}</th>
                          <td>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          
          <Card className="shadow-sm">
            <Card.Body>
              <h5>Transaction History</h5>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Type</th>
                      <th>Quantity</th>
                      <th>Date</th>
                      <th>User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionHistory.map(tx => (
                      <tr key={tx.id}>
                        <td>{tx.id}</td>
                        <td>
                          <span className={`badge ${tx.type === 'Sale' ? 'bg-danger' : tx.type === 'Restock' ? 'bg-success' : 'bg-warning'}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td>{tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}</td>
                        <td>{tx.date}</td>
                        <td>{tx.user}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="mb-4 shadow-sm">
            <Card.Body className="text-center">
              <h5>Current Stock</h5>
              <div className="inventory-meter my-3">
                <div 
                  className={`progress-bar ${product.quantity < product.minThreshold ? 'bg-danger' : 'bg-success'}`} 
                  style={{ width: `${Math.min(100, (product.quantity / (product.minThreshold * 2)) * 100)}%` }}
                ></div>
              </div>
              <h2 className="display-4">{product.quantity}</h2>
              <p className="text-muted">Minimum Threshold: {product.minThreshold}</p>
              <p className="text-muted">Last Updated: {product.lastUpdated}</p>
              
              <div className="d-grid gap-2 mt-3">
                <Button variant="primary" onClick={() => setShowUpdateModal(true)}>
                  Update Quantity
                </Button>
                <Button variant="outline-secondary">
                  Audit Product
                </Button>
              </div>
            </Card.Body>
          </Card>
          
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <h5>Quick Actions</h5>
              <div className="d-grid gap-2">
                <Button variant="outline-primary">
                  <i className="bi bi-truck"></i> Order Restock
                </Button>
                <Button variant="outline-secondary">
                  <i className="bi bi-arrow-left-right"></i> Transfer Location
                </Button>
                <Button variant="outline-info">
                  <i className="bi bi-pencil"></i> Edit Details
                </Button>
                <Button variant="outline-danger">
                  <i className="bi bi-trash"></i> Remove Product
                </Button>
              </div>
            </Card.Body>
          </Card>
          
          <Card className="shadow-sm">
            <Card.Body>
              <h5>Blockchain Information</h5>
              <Table bordered size="sm">
                <tbody>
                  <tr>
                    <th>Asset ID</th>
                    <td>{product.assetId}</td>
                  </tr>
                  <tr>
                    <th>Contract</th>
                    <td>{appIds?.inventory_app_id || 'Not deployed'}</td>
                  </tr>
                  <tr>
                    <th>Last Transaction</th>
                    <td>Round #12345678</td>
                  </tr>
                </tbody>
              </Table>
              <div className="d-grid mt-3">
                <Button variant="outline-secondary" size="sm">
                  View on Explorer
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Update Quantity Modal */}
      <Modal show={showUpdateModal} onHide={() => setShowUpdateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Quantity</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Update Type</Form.Label>
              <Form.Select 
                value={updateType} 
                onChange={(e) => setUpdateType(e.target.value)}
              >
                <option value="add">Add Stock</option>
                <option value="remove">Remove Stock</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Quantity</Form.Label>
              <Form.Control 
                type="number" 
                min="1" 
                value={updateQuantity} 
                onChange={(e) => setUpdateQuantity(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUpdateModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateQuantity}>
            Update
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProductDetail;