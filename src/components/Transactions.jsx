import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup, Table, Badge, Alert } from 'react-bootstrap';
import { AlgorandContext } from '../contexts/AlgorandContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Transactions = () => {
  const { algod, account, isConnected, connectWallet, getTransactionHistory } = useContext(AlgorandContext);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        if (!isConnected) {
          return;
        }
        
        setLoading(true);
        
        // Fetch transaction history
        const txHistory = await getTransactionHistory();
        setTransactions(txHistory);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to load transactions. Please try again later.');
        toast.error('Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, [isConnected, getTransactionHistory]);
  
  // Filter and search transactions
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      tx.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.txId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.receiver.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filter === 'all' || tx.type.toLowerCase() === filter.toLowerCase();
    
    const txDate = new Date(tx.date);
    const matchesDateStart = !dateRange.start || txDate >= new Date(dateRange.start);
    const matchesDateEnd = !dateRange.end || txDate <= new Date(`${dateRange.end}T23:59:59`);
    
    return matchesSearch && matchesType && matchesDateStart && matchesDateEnd;
  });
  
  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.date) - new Date(b.date);
        break;
      case 'product':
        comparison = a.product.localeCompare(b.product);
        break;
      case 'quantity':
        comparison = a.quantity - b.quantity;
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      default:
        comparison = 0;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  const getTypeBadge = (type) => {
    switch (type.toLowerCase()) {
      case 'restock':
        return <Badge bg="success">{type}</Badge>;
      case 'sale':
      case 'transfer':
        return <Badge bg="danger">{type}</Badge>;
      case 'adjustment':
        return <Badge bg="warning">{type}</Badge>;
      case 'audit':
        return <Badge bg="secondary">{type}</Badge>;
      case 'reorder':
        return <Badge bg="primary">{type}</Badge>;
      default:
        return <Badge bg="info">{type}</Badge>;
    }
  };
  
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };
  
  const handleViewTransaction = (txId) => {
    window.open(`https://testnet.algoexplorer.io/tx/${txId}`, '_blank');
  };
  
  if (!isConnected) {
    return (
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Transaction History</h1>
          <Button variant="primary" onClick={connectWallet}>Connect Wallet</Button>
        </div>
        
        <Card className="shadow-sm text-center p-5">
          <Card.Body>
            <h2 className="mb-4">Connect Your Wallet</h2>
            <p className="mb-4">You need to connect your wallet to view transaction history.</p>
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
        <p className="mt-3">Loading transactions...</p>
      </Container>
    );
  }
  
  return (
    <Container>
      <ToastContainer position="top-right" autoClose={5000} />
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Transaction History</h1>
        <Button 
          variant="outline-primary"
          onClick={() => {
            setLoading(true);
            getTransactionHistory()
              .then(txns => {
                setTransactions(txns);
                toast.success('Transactions refreshed');
              })
              .catch(err => {
                console.error('Error refreshing transactions:', err);
                toast.error('Failed to refresh transactions');
              })
              .finally(() => setLoading(false));
          }}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Refreshing...
            </>
          ) : 'Refresh'}
        </Button>
      </div>
      
      {error && (
        <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row>
            <Col md={4}>
              <InputGroup className="mb-3">
                <Form.Control
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button variant="outline-secondary">
                  <i className="bi bi-search"></i> Search
                </Button>
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Select 
                  value={filter} 
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="restock">Restock</option>
                  <option value="sale">Sale</option>
                  <option value="transfer">Transfer</option>
                  <option value="adjustment">Adjustment</option>
                  <option value="audit">Audit</option>
                  <option value="reorder">Reorder</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={5}>
              <Row>
                <Col>
                  <Form.Group className="mb-3">
                    <Form.Label>From</Form.Label>
                    <Form.Control
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group className="mb-3">
                    <Form.Label>To</Form.Label>
                    <Form.Control
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Col>
          </Row>
          
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Sort By</Form.Label>
                <Form.Select 
                  value={sortBy} 
                  onChange={(e) => handleSort(e.target.value)}
                >
                  <option value="date">Date</option>
                  <option value="product">Product</option>
                  <option value="quantity">Quantity</option>
                  <option value="type">Type</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Sort Direction</Form.Label>
                <Form.Select 
                  value={sortDirection} 
                  onChange={(e) => setSortDirection(e.target.value)}
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={5} className="d-flex align-items-end">
              <Button 
                variant="outline-secondary" 
                className="mb-3 w-100"
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                  setDateRange({ start: '', end: '' });
                  setSortBy('date');
                  setSortDirection('desc');
                }}
              >
                Clear Filters
              </Button>
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
                  <th>Type</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Date</th>
                  <th>Sender</th>
                  <th>Receiver</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedTransactions.length > 0 ? (
                  sortedTransactions.map(tx => (
                    <tr key={tx.id}>
                      <td>{tx.id}</td>
                      <td>{getTypeBadge(tx.type)}</td>
                      <td>{tx.product}</td>
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
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => handleViewTransaction(tx.txId)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center">No transactions found</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
          
          {sortedTransactions.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div>
                <small className="text-muted">
                  Showing {sortedTransactions.length} of {transactions.length} transactions
                </small>
              </div>
              <div>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => {
                    // In a real app, this would export to CSV or PDF
                    toast.info('Export functionality would be implemented here');
                  }}
                >
                  Export
                </Button>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Transactions;