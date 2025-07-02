import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup, Table, Badge, Alert } from 'react-bootstrap';
import { AlgorandContext } from '../contexts/AlgorandContext';

const Transactions = () => {
  const { algod, account, appIds } = useContext(AlgorandContext);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        if (algod && account) {
          // In a real application, you would fetch this data from the blockchain
          // For now, we'll use mock data
          const mockTransactions = [
            { 
              id: 'TX12345', 
              type: 'Restock', 
              product: 'Widget A', 
              quantity: 50, 
              date: '2023-11-15',
              user: 'Admin',
              txId: 'ALGOTX123456789',
              confirmed: true
            },
            { 
              id: 'TX12346', 
              type: 'Sale', 
              product: 'Gadget B', 
              quantity: -5, 
              date: '2023-11-14',
              user: 'System',
              txId: 'ALGOTX123456790',
              confirmed: true
            },
            { 
              id: 'TX12347', 
              type: 'Adjustment', 
              product: 'Tool C', 
              quantity: -2, 
              date: '2023-11-13',
              user: 'Admin',
              txId: 'ALGOTX123456791',
              confirmed: true
            },
            { 
              id: 'TX12348', 
              type: 'Restock', 
              product: 'Part D', 
              quantity: 100, 
              date: '2023-11-12',
              user: 'Admin',
              txId: 'ALGOTX123456792',
              confirmed: true
            },
            { 
              id: 'TX12349', 
              type: 'Transfer', 
              product: 'Component E', 
              quantity: -10, 
              date: '2023-11-11',
              user: 'Manager',
              txId: 'ALGOTX123456793',
              confirmed: true
            },
            { 
              id: 'TX12350', 
              type: 'Audit', 
              product: 'Material F', 
              quantity: 0, 
              date: '2023-11-10',
              user: 'System',
              txId: 'ALGOTX123456794',
              confirmed: true
            },
            { 
              id: 'TX12351', 
              type: 'Reorder', 
              product: 'Tool C', 
              quantity: 20, 
              date: '2023-11-09',
              user: 'System',
              txId: 'ALGOTX123456795',
              confirmed: false
            }
          ];
          
          setTransactions(mockTransactions);
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to load transactions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, [algod, account]);
  
  // Filter and search transactions
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tx.txId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filter === 'all' || tx.type.toLowerCase() === filter.toLowerCase();
    
    const txDate = new Date(tx.date);
    const matchesDateStart = !dateRange.start || txDate >= new Date(dateRange.start);
    const matchesDateEnd = !dateRange.end || txDate <= new Date(dateRange.end);
    
    return matchesSearch && matchesType && matchesDateStart && matchesDateEnd;
  });
  
  const getTypeBadge = (type) => {
    switch (type.toLowerCase()) {
      case 'restock':
        return <Badge bg="success">{type}</Badge>;
      case 'sale':
        return <Badge bg="danger">{type}</Badge>;
      case 'adjustment':
        return <Badge bg="warning">{type}</Badge>;
      case 'transfer':
        return <Badge bg="info">{type}</Badge>;
      case 'audit':
        return <Badge bg="secondary">{type}</Badge>;
      case 'reorder':
        return <Badge bg="primary">{type}</Badge>;
      default:
        return <Badge bg="secondary">{type}</Badge>;
    }
  };
  
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
  
  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }
  
  return (
    <Container>
      <h1 className="mb-4">Transaction History</h1>
      
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
                  <option value="adjustment">Adjustment</option>
                  <option value="transfer">Transfer</option>
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
                  <th>User</th>
                  <th>Status</th>
                  <th>Transaction ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map(tx => (
                    <tr key={tx.id}>
                      <td>{tx.id}</td>
                      <td>{getTypeBadge(tx.type)}</td>
                      <td>{tx.product}</td>
                      <td className={tx.quantity >= 0 ? 'text-success' : 'text-danger'}>
                        {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                      </td>
                      <td>{tx.date}</td>
                      <td>{tx.user}</td>
                      <td>
                        {tx.confirmed ? (
                          <Badge bg="success">Confirmed</Badge>
                        ) : (
                          <Badge bg="warning">Pending</Badge>
                        )}
                      </td>
                      <td>
                        <small>{tx.txId.substring(0, 8)}...{tx.txId.substring(tx.txId.length - 4)}</small>
                      </td>
                      <td>
                        <Button variant="outline-primary" size="sm">
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
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Transactions;