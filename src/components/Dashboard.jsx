import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { AlgorandContext } from '../contexts/AlgorandContext';
import { getAccountInfo } from '../utils/algorand';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const { algod, account, appIds } = useContext(AlgorandContext);
  const [accountInfo, setAccountInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Mock data for demonstration
  const [inventoryData, setInventoryData] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    totalValue: 0,
    recentTransactions: []
  });
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (algod && account) {
          const info = await getAccountInfo(algod, account.address);
          setAccountInfo(info);
          
          // In a real application, you would fetch this data from the blockchain
          // For now, we'll use mock data
          setInventoryData({
            totalProducts: 12,
            lowStockItems: 3,
            totalValue: 25000,
            recentTransactions: [
              { id: 1, type: 'Restock', product: 'Widget A', quantity: 50, date: '2023-11-15' },
              { id: 2, type: 'Sale', product: 'Gadget B', quantity: 5, date: '2023-11-14' },
              { id: 3, type: 'Adjustment', product: 'Tool C', quantity: -2, date: '2023-11-13' },
              { id: 4, type: 'Restock', product: 'Part D', quantity: 100, date: '2023-11-12' }
            ]
          });
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [algod, account]);
  
  // Chart data
  const inventoryChartData = {
    labels: ['Widget A', 'Gadget B', 'Tool C', 'Part D', 'Component E', 'Material F'],
    datasets: [
      {
        label: 'Current Stock',
        data: [65, 20, 15, 81, 56, 40],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      },
      {
        label: 'Minimum Threshold',
        data: [25, 10, 30, 40, 20, 15],
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }
    ]
  };
  
  const salesChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Sales 2023',
        data: [12, 19, 3, 5, 2, 3, 20, 33, 18, 24, 30, 12],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4
      }
    ]
  };
  
  if (loading) {
    return (
      <Container className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading dashboard data...</p>
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
      <h1 className="mb-4">Dashboard</h1>
      
      {!appIds || Object.values(appIds).every(id => id === 0) ? (
        <Alert variant="warning">
          <Alert.Heading>Setup Required</Alert.Heading>
          <p>
            The smart contracts have not been deployed yet. Please run the deployment script to set up the system.
          </p>
          <hr />
          <p className="mb-0">
            Run <code>python3 scripts/deploy.py</code> to deploy the contracts.
          </p>
        </Alert>
      ) : (
        <>
          <Row className="mb-4">
            <Col md={4}>
              <Card className="h-100 shadow-sm">
                <Card.Body className="text-center">
                  <Card.Title>Total Products</Card.Title>
                  <h2 className="display-4">{inventoryData.totalProducts}</h2>
                  <Link to="/products">
                    <Button variant="outline-primary" size="sm">View All Products</Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 shadow-sm">
                <Card.Body className="text-center">
                  <Card.Title>Low Stock Items</Card.Title>
                  <h2 className="display-4">{inventoryData.lowStockItems}</h2>
                  <Button variant="outline-warning" size="sm">View Low Stock</Button>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 shadow-sm">
                <Card.Body className="text-center">
                  <Card.Title>Total Inventory Value</Card.Title>
                  <h2 className="display-4">${inventoryData.totalValue.toLocaleString()}</h2>
                  <Button variant="outline-success" size="sm">View Valuation</Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Row className="mb-4">
            <Col md={6}>
              <Card className="shadow-sm">
                <Card.Body>
                  <Card.Title>Inventory Levels</Card.Title>
                  <div style={{ height: '300px' }}>
                    <Bar 
                      data={inventoryChartData} 
                      options={{ 
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                          title: {
                            display: true,
                            text: 'Current Stock vs. Minimum Threshold'
                          }
                        }
                      }} 
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="shadow-sm">
                <Card.Body>
                  <Card.Title>Sales Trend</Card.Title>
                  <div style={{ height: '300px' }}>
                    <Line 
                      data={salesChartData} 
                      options={{ 
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                          title: {
                            display: true,
                            text: 'Monthly Sales Trend'
                          }
                        }
                      }} 
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Row>
            <Col md={12}>
              <Card className="shadow-sm">
                <Card.Body>
                  <Card.Title>Recent Transactions</Card.Title>
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Type</th>
                          <th>Product</th>
                          <th>Quantity</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryData.recentTransactions.map(tx => (
                          <tr key={tx.id}>
                            <td>{tx.id}</td>
                            <td>
                              <span className={`badge ${tx.type === 'Sale' ? 'bg-danger' : tx.type === 'Restock' ? 'bg-success' : 'bg-warning'}`}>
                                {tx.type}
                              </span>
                            </td>
                            <td>{tx.product}</td>
                            <td>{tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}</td>
                            <td>{tx.date}</td>
                            <td>
                              <Button variant="outline-secondary" size="sm">View</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-center mt-3">
                    <Link to="/transactions">
                      <Button variant="primary">View All Transactions</Button>
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default Dashboard;