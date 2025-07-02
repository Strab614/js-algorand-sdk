import React, { useState, useContext } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AlgorandContext } from '../contexts/AlgorandContext';
import { createProductASA, callApp } from '../utils/algorand';

const CreateProduct = () => {
  const { algod, account, appIds } = useContext(AlgorandContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    unitName: '',
    description: '',
    quantity: 0,
    minThreshold: 0,
    price: 0,
    location: '',
    supplier: '',
    expirationDate: '',
    category: '',
    sku: '',
    url: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (!algod || !account) {
        throw new Error('Algorand connection not established');
      }
      
      if (!appIds || !appIds.inventory_app_id || appIds.inventory_app_id === 0) {
        throw new Error('Inventory contract not deployed');
      }
      
      // In a real application, you would:
      // 1. Create an ASA for the product
      // 2. Call the inventory contract to register the product
      // 3. Store metadata in IPFS
      
      // For now, we'll simulate success
      console.log('Creating product with data:', formData);
      
      // Simulate blockchain delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess('Product created successfully! In a real application, this would create an ASA and register it with the inventory contract.');
      
      // Redirect after a delay
      setTimeout(() => {
        navigate('/products');
      }, 3000);
      
    } catch (err) {
      console.error('Error creating product:', err);
      setError(err.message || 'Failed to create product. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Create New Product</h1>
        <Button as={Link} to="/products" variant="secondary">Back to Products</Button>
      </div>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" className="mb-4">
          {success}
        </Alert>
      )}
      
      <Card className="shadow-sm">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <h5 className="mb-3">Basic Information</h5>
                
                <Form.Group className="mb-3">
                  <Form.Label>Product Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Unit Name (max 8 chars)</Form.Label>
                  <Form.Control
                    type="text"
                    name="unitName"
                    value={formData.unitName}
                    onChange={handleChange}
                    maxLength={8}
                    required
                  />
                  <Form.Text className="text-muted">
                    This will be used as the ASA unit name
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Control
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>SKU</Form.Label>
                  <Form.Control
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <h5 className="mb-3">Inventory Details</h5>
                
                <Form.Group className="mb-3">
                  <Form.Label>Initial Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    min="0"
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Minimum Threshold</Form.Label>
                  <Form.Control
                    type="number"
                    name="minThreshold"
                    value={formData.minThreshold}
                    onChange={handleChange}
                    min="0"
                    required
                  />
                  <Form.Text className="text-muted">
                    System will alert when stock falls below this level
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Price (USD)</Form.Label>
                  <Form.Control
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Location</Form.Label>
                  <Form.Control
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Supplier</Form.Label>
                  <Form.Control
                    type="text"
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Expiration Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="expirationDate"
                    value={formData.expirationDate}
                    onChange={handleChange}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>URL (IPFS or other)</Form.Label>
                  <Form.Control
                    type="text"
                    name="url"
                    value={formData.url}
                    onChange={handleChange}
                    placeholder="https://ipfs.io/ipfs/..."
                  />
                  <Form.Text className="text-muted">
                    URL to product metadata or documentation
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-end mt-3">
              <Button variant="secondary" as={Link} to="/products" className="me-2">
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Creating...
                  </>
                ) : 'Create Product'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CreateProduct;