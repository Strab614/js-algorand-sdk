import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Table, Badge, Alert, Form, Modal, Image, Tabs, Tab } from 'react-bootstrap';
import { AlgorandContext } from '../contexts/AlgorandContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { algod, account, isConnected, connectWallet, getAssetInfo, updateAssetQuantity, transferAsset, getTransactionHistory } = useContext(AlgorandContext);
  
  const [product, setProduct] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateQuantity, setUpdateQuantity] = useState(0);
  const [updateType, setUpdateType] = useState('add');
  
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAmount, setTransferAmount] = useState(1);
  const [receiverAddress, setReceiverAddress] = useState('');
  
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        if (!isConnected) {
          return;
        }
        
        setLoading(true);
        
        if (id) {
          // Fetch product details
          const assetInfo = await getAssetInfo(parseInt(id));
          setProduct(assetInfo);
          
          // Fetch transaction history
          const txHistory = await getTransactionHistory(parseInt(id));
          setTransactions(txHistory);
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
        setError('Failed to load product details. Please try again later.');
        toast.error('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductDetails();
  }, [id, isConnected, getAssetInfo, getTransactionHistory]);
  
  const handleUpdateQuantity = async () => {
    try {
      setActionLoading(true);
      
      // Calculate the new quantity
      const quantityChange = updateType === 'add' ? parseInt(updateQuantity) : -parseInt(updateQuantity);
      const newQuantity = product.total + quantityChange;
      
      if (newQuantity < 0) {
        setError('Quantity cannot be negative');
        toast.error('Quantity cannot be negative');
        return;
      }
      
      // Update the quantity on the blockchain
      await updateAssetQuantity(parseInt(id), newQuantity);
      
      // Update the local state
      setProduct({
        ...product,
        total: newQuantity,
        metadata: {
          ...product.metadata,
          updatedAt: new Date().toISOString()
        }
      });
      
      // Add to transaction history
      const newTransaction = {
        id: `TX${Date.now()}`,
        type: updateType === 'add' ? 'Restock' : 'Adjustment',
        product: product.name,
        assetId: parseInt(id),
        quantity: quantityChange,
        date: new Date().toISOString(),
        sender: account.addr,
        receiver: account.addr,
        txId: `ALGOTX${Date.now()}`,
        confirmed: true
      };
      
      setTransactions([newTransaction, ...transactions]);
      
      setShowUpdateModal(false);
      setUpdateQuantity(0);
      toast.success(`Quantity ${updateType === 'add' ? 'increased' : 'decreased'} successfully`);
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError('Failed to update quantity. Please try again later.');
      toast.error('Failed to update quantity');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleTransferProduct = async () => {
    try {
      setActionLoading(true);
      
      if (!receiverAddress) {
        toast.error('Receiver address is required');
        return;
      }
      
      if (transferAmount <= 0 || transferAmount > product.total) {
        toast.error(`Amount must be between 1 and ${product.total}`);
        return;
      }
      
      // Transfer the asset on the blockchain
      await transferAsset(parseInt(id), receiverAddress, transferAmount);
      
      // Update the local state
      setProduct({
        ...product,
        total: product.total - transferAmount,
        metadata: {
          ...product.metadata,
          updatedAt: new Date().toISOString()
        }
      });
      
      // Add to transaction history
      const newTransaction = {
        id: `TX${Date.now()}`,
        type: 'Transfer',
        product: product.name,
        assetId: parseInt(id),
        quantity: -transferAmount,
        date: new Date().toISOString(),
        sender: account.addr,
        receiver: receiverAddress,
        txId: `ALGOTX${Date.now()}`,
        confirmed: true
      };
      
      setTransactions([newTransaction, ...transactions]);
      
      setShowTransferModal(false);
      setTransferAmount(1);
      setReceiverAddress('');
      toast.success('Product transferred successfully');
    } catch (err) {
      console.error('Error transferring product:', err);
      setError('Failed to transfer product. Please try again later.');
      toast.error('Failed to transfer product');
    } finally {
      setActionLoading(false);
    }
  };
  
  const getStatusBadge = () => {
    if (!product) return null;
    
    const quantity = product.total;
    const minThreshold = product.metadata?.minThreshold || 0;
    
    if (quantity <= minThreshold / 2) {
      return <Badge bg="danger">Critical</Badge>;
    } else if (quantity <= minThreshold) {
      return <Badge bg="warning">Low Stock</Badge>;
    } else {
      return <Badge bg="success">Normal</Badge>;
    }
  };
  
  if (!isConnected) {
    return (
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Product Details</h1>
          <Button as={Link} to="/products" variant="secondary">Back to Products</Button>
        </div>
        
        <Card className="shadow-sm text-center p-5">
          <Card.Body>
            <h2 className="mb-4">Connect Your Wallet</h2>
            <p className="mb-4">You need to connect your wallet to view product details.</p>
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
        <p className="mt-3">Loading product details...</p>
      </Container>
    );
  }
  
  if (error && !product) {
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
  
  const isLowStock = product.total <= (product.metadata?.minThreshold || 0);
  const formattedCreatedDate = new Date(product.metadata?.createdAt || Date.now()).toLocaleDateString();
  const formattedUpdatedDate = new Date(product.metadata?.updatedAt || Date.now()).toLocaleDateString();
  
  return (
    <Container>
      <ToastContainer position="top-right" autoClose={5000} />
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Product Details</h1>
        <Button as={Link} to="/products" variant="secondary">Back to Products</Button>
      </div>
      
      {error && (
        <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Row>
        <Col lg={8}>
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h2>{product.name}</h2>
                  <p className="text-muted">Asset ID: {id} | Unit: {product['unit-name']}</p>
                </div>
                <div>
                  {getStatusBadge()}
                </div>
              </div>
              
              <Row>
                <Col md={product.metadata?.imageUrl ? 8 : 12}>
                  <p className="mb-4">{product.metadata?.description || 'No description available.'}</p>
                  
                  <Tabs defaultActiveKey="details" className="mb-3">
                    <Tab eventKey="details" title="Details">
                      <Table bordered>
                        <tbody>
                          <tr>
                            <th width="30%">Price</th>
                            <td>${product.metadata?.price?.toFixed(2) || '0.00'}</td>
                          </tr>
                          <tr>
                            <th>Location</th>
                            <td>{product.metadata?.location || 'Not specified'}</td>
                          </tr>
                          <tr>
                            <th>Supplier</th>
                            <td>{product.metadata?.supplier || 'Not specified'}</td>
                          </tr>
                          <tr>
                            <th>Created</th>
                            <td>{formattedCreatedDate}</td>
                          </tr>
                          <tr>
                            <th>Last Updated</th>
                            <td>{formattedUpdatedDate}</td>
                          </tr>
                          <tr>
                            <th>Expiration</th>
                            <td>{product.metadata?.expirationDate || 'Not specified'}</td>
                          </tr>
                        </tbody>
                      </Table>
                    </Tab>
                    <Tab eventKey="blockchain" title="Blockchain Info">
                      <Table bordered>
                        <tbody>
                          <tr>
                            <th width="30%">Asset ID</th>
                            <td>{id}</td>
                          </tr>
                          <tr>
                            <th>Creator</th>
                            <td className="text-truncate">
                              {product.creator || account?.addr || 'Unknown'}
                            </td>
                          </tr>
                          <tr>
                            <th>Manager</th>
                            <td className="text-truncate">
                              {product.manager || account?.addr || 'Unknown'}
                            </td>
                          </tr>
                          <tr>
                            <th>Reserve</th>
                            <td className="text-truncate">
                              {product.reserve || account?.addr || 'Unknown'}
                            </td>
                          </tr>
                          <tr>
                            <th>Freeze</th>
                            <td className="text-truncate">
                              {product.freeze || account?.addr || 'Unknown'}
                            </td>
                          </tr>
                          <tr>
                            <th>Clawback</th>
                            <td className="text-truncate">
                              {product.clawback || account?.addr || 'Unknown'}
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    </Tab>
                  </Tabs>
                </Col>
                
                {product.metadata?.imageUrl && (
                  <Col md={4} className="text-center">
                    <Image 
                      src={product.metadata.imageUrl} 
                      alt={product.name} 
                      className="img-fluid rounded shadow-sm" 
                      style={{ maxHeight: '250px' }}
                    />
                  </Col>
                )}
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
                      <th>Type</th>
                      <th>Quantity</th>
                      <th>Date</th>
                      <th>Sender</th>
                      <th>Receiver</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length > 0 ? (
                      transactions.map(tx => (
                        <tr key={tx.id}>
                          <td>
                            <span className={`badge ${
                              tx.type === 'Sale' || tx.type === 'Transfer' ? 'bg-danger' : 
                              tx.type === 'Restock' ? 'bg-success' : 
                              'bg-warning'
                            }`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className={tx.quantity >= 0 ? 'text-success' : 'text-danger'}>
                            {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                          </td>
                          <td>{new Date(tx.date).toLocaleString()}</td>
                          <td className="text-truncate" style={{maxWidth: '150px'}}>
                            {tx.sender.substring(0, 8)}...{tx.sender.substring(tx.sender.length - 4)}
                          </td>
                          <td className="text-truncate" style={{maxWidth: '150px'}}>
                            {tx.receiver.substring(0, 8)}...{tx.receiver.substring(tx.receiver.length - 4)}
                          </td>
                          <td>
                            {tx.confirmed ? (
                              <Badge bg="success">Confirmed</Badge>
                            ) : (
                              <Badge bg="warning">Pending</Badge>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center">No transaction history available</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card className="mb-4 shadow-sm">
            <Card.Body className="text-center">
              <h5>Current Stock</h5>
              <div className="inventory-meter my-3">
                <div 
                  className={`progress-bar ${isLowStock ? 'bg-danger' : 'bg-success'}`} 
                  style={{ 
                    width: `${Math.min(100, (product.total / ((product.metadata?.minThreshold || 10) * 2)) * 100)}%` 
                  }}
                ></div>
              </div>
              <h2 className="display-4">{product.total}</h2>
              <p className="text-muted">Minimum Threshold: {product.metadata?.minThreshold || 'Not set'}</p>
              <p className="text-muted">Last Updated: {formattedUpdatedDate}</p>
              
              <div className="d-grid gap-2 mt-3">
                <Button 
                  variant="primary" 
                  onClick={() => setShowUpdateModal(true)}
                  disabled={actionLoading}
                >
                  Update Quantity
                </Button>
                <Button 
                  variant="outline-primary"
                  onClick={() => setShowTransferModal(true)}
                  disabled={actionLoading || product.total <= 0}
                >
                  Transfer Product
                </Button>
              </div>
            </Card.Body>
          </Card>
          
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <h5>Quick Actions</h5>
              <div className="d-grid gap-2">
                {isLowStock && (
                  <Button variant="warning">
                    <i className="bi bi-truck"></i> Order Restock
                  </Button>
                )}
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
              <h5>Product Value</h5>
              <Table bordered size="sm">
                <tbody>
                  <tr>
                    <th>Unit Price</th>
                    <td>${product.metadata?.price?.toFixed(2) || '0.00'}</td>
                  </tr>
                  <tr>
                    <th>Total Value</th>
                    <td>${((product.metadata?.price || 0) * product.total).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <th>Value at Min Threshold</th>
                    <td>${((product.metadata?.price || 0) * (product.metadata?.minThreshold || 0)).toFixed(2)}</td>
                  </tr>
                </tbody>
              </Table>
              <div className="d-grid mt-3">
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => window.open(`https://testnet.algoexplorer.io/asset/${id}`, '_blank')}
                >
                  View on AlgoExplorer
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
              {updateType === 'remove' && (
                <Form.Text className="text-muted">
                  Maximum removal: {product.total}
                </Form.Text>
              )}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUpdateModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUpdateQuantity}
            disabled={actionLoading || updateQuantity <= 0 || (updateType === 'remove' && updateQuantity > product.total)}
          >
            {actionLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Updating...
              </>
            ) : 'Update'}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Transfer Product Modal */}
      <Modal show={showTransferModal} onHide={() => setShowTransferModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Transfer Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Receiver Address</Form.Label>
              <Form.Control 
                type="text" 
                value={receiverAddress} 
                onChange={(e) => setReceiverAddress(e.target.value)}
                placeholder="Enter Algorand address"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Amount</Form.Label>
              <Form.Control 
                type="number" 
                min="1" 
                max={product.total}
                value={transferAmount} 
                onChange={(e) => setTransferAmount(parseInt(e.target.value))}
              />
              <Form.Text className="text-muted">
                Available: {product.total}
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTransferModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleTransferProduct}
            disabled={
              actionLoading || 
              !receiverAddress || 
              transferAmount <= 0 || 
              transferAmount > product.total
            }
          >
            {actionLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Transferring...
              </>
            ) : 'Transfer'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProductDetail;