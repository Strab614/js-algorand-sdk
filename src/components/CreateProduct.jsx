import React, { useState, useContext } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Image } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AlgorandContext } from '../contexts/AlgorandContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Dropzone from 'react-dropzone';
import Compressor from 'compressorjs';

const CreateProduct = () => {
  const { algod, account, isConnected, connectWallet, createAsset, uploadImage } = useContext(AlgorandContext);
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
  
  const [productImage, setProductImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
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
  
  const handleImageDrop = (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }
    
    // Compress the image
    new Compressor(file, {
      quality: 0.8,
      maxWidth: 1000,
      success: (compressedFile) => {
        setProductImage(compressedFile);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewImage(e.target.result);
        };
        reader.readAsDataURL(compressedFile);
      },
      error: (err) => {
        toast.error('Error compressing image');
        console.error(err);
      },
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (!isConnected) {
        await connectWallet();
      }
      
      if (!algod || !account) {
        throw new Error('Algorand connection not established');
      }
      
      // Upload image if provided
      let imageUrl = undefined;
      if (productImage) {
        toast.info('Uploading product image...');
        imageUrl = await uploadImage(productImage);
      }
      
      // Create the asset on Algorand
      toast.info('Creating product on blockchain...');
      const assetId = await createAsset(
        formData.name,
        formData.unitName,
        parseInt(formData.quantity),
        0, // Decimals (0 for inventory items)
        formData.description,
        parseFloat(formData.price),
        parseInt(formData.minThreshold),
        imageUrl
      );
      
      setSuccess(`Product "${formData.name}" created successfully with Asset ID: ${assetId}`);
      
      // Redirect after a delay
      setTimeout(() => {
        navigate(`/products/${assetId}`);
      }, 2000);
      
    } catch (err) {
      console.error('Error creating product:', err);
      setError(err.message || 'Failed to create product. Please try again later.');
      toast.error('Failed to create product');
    } finally {
      setLoading(false);
    }
  };
  
  if (!isConnected) {
    return (
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Create New Product</h1>
          <Button as={Link} to="/products" variant="secondary">Back to Products</Button>
        </div>
        
        <Card className="shadow-sm text-center p-5">
          <Card.Body>
            <h2 className="mb-4">Connect Your Wallet</h2>
            <p className="mb-4">You need to connect your wallet to create a new product.</p>
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
  
  return (
    <Container>
      <ToastContainer position="top-right" autoClose={5000} />
      
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
              </Col>
            </Row>
            
            <Row className="mt-3">
              <Col md={12}>
                <h5 className="mb-3">Product Image</h5>
                <Dropzone 
                  onDrop={handleImageDrop}
                  accept={{
                    'image/jpeg': ['.jpg', '.jpeg'],
                    'image/png': ['.png'],
                    'image/webp': ['.webp']
                  }}
                  maxFiles={1}
                >
                  {({getRootProps, getInputProps}) => (
                    <div 
                      {...getRootProps()} 
                      className="border border-dashed border-secondary rounded p-4 text-center cursor-pointer"
                    >
                      <input {...getInputProps()} />
                      {previewImage ? (
                        <div className="text-center">
                          <Image 
                            src={previewImage} 
                            alt="Product preview" 
                            style={{ maxHeight: '200px' }} 
                            className="mb-3"
                            thumbnail
                          />
                          <p>Click or drag to replace image</p>
                        </div>
                      ) : (
                        <div>
                          <p className="mb-0">Drag & drop a product image here, or click to select</p>
                          <p className="text-muted small">Supports JPG, PNG, WEBP (max 10MB)</p>
                        </div>
                      )}
                    </div>
                  )}
                </Dropzone>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-end mt-4">
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