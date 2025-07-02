import React, { useState, useContext } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Table } from 'react-bootstrap';
import { AlgorandContext } from '../contexts/AlgorandContext';
import { callApp } from '../utils/algorand';

const Settings = () => {
  const { algod, account, appIds } = useContext(AlgorandContext);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [newUser, setNewUser] = useState({
    address: '',
    role: '3' // Default to operator role
  });
  
  const [checkInterval, setCheckInterval] = useState(24); // hours
  
  // Mock users for demonstration
  const [users, setUsers] = useState([
    { address: account?.address || '', role: 1, roleName: 'Admin' },
    { address: 'XBYLS2E6YI6XXL5BWCAMOA4GTWHXWENZMX5UHXMRNWWUQ7BXCY5WC5TEPA', role: 2, roleName: 'Manager' },
    { address: '4H5UNRBJ2Q6JENAXQ6HNTGKLKINP4J4VTQBEPK5F3I6RDICMZBPGNH6KD4', role: 3, roleName: 'Operator' }
  ]);
  
  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (!algod || !account) {
        throw new Error('Algorand connection not established');
      }
      
      if (!appIds || !appIds.security_app_id || appIds.security_app_id === 0) {
        throw new Error('Security contract not deployed');
      }
      
      if (!newUser.address || !newUser.role) {
        throw new Error('Please provide both address and role');
      }
      
      // In a real application, you would call the security contract to add the user
      // For now, we'll just update the local state
      console.log('Adding user:', newUser);
      
      // Simulate blockchain delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add to users list
      const roleName = newUser.role === '1' ? 'Admin' : newUser.role === '2' ? 'Manager' : 'Operator';
      setUsers([
        ...users,
        {
          address: newUser.address,
          role: parseInt(newUser.role),
          roleName
        }
      ]);
      
      setSuccess('User added successfully!');
      setNewUser({ address: '', role: '3' });
      
    } catch (err) {
      console.error('Error adding user:', err);
      setError(err.message || 'Failed to add user. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRemoveUser = async (address) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (!algod || !account) {
        throw new Error('Algorand connection not established');
      }
      
      if (!appIds || !appIds.security_app_id || appIds.security_app_id === 0) {
        throw new Error('Security contract not deployed');
      }
      
      // In a real application, you would call the security contract to remove the user
      // For now, we'll just update the local state
      console.log('Removing user:', address);
      
      // Simulate blockchain delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remove from users list
      setUsers(users.filter(user => user.address !== address));
      
      setSuccess('User removed successfully!');
      
    } catch (err) {
      console.error('Error removing user:', err);
      setError(err.message || 'Failed to remove user. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateCheckInterval = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (!algod || !account) {
        throw new Error('Algorand connection not established');
      }
      
      if (!appIds || !appIds.oracle_app_id || appIds.oracle_app_id === 0) {
        throw new Error('Oracle contract not deployed');
      }
      
      // In a real application, you would call the oracle contract to update the check interval
      // For now, we'll just update the local state
      console.log('Updating check interval to', checkInterval, 'hours');
      
      // Simulate blockchain delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Check interval updated successfully!');
      
    } catch (err) {
      console.error('Error updating check interval:', err);
      setError(err.message || 'Failed to update check interval. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleBackupData = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (!algod || !account) {
        throw new Error('Algorand connection not established');
      }
      
      if (!appIds || !appIds.security_app_id || appIds.security_app_id === 0) {
        throw new Error('Security contract not deployed');
      }
      
      // In a real application, you would call the security contract to backup data
      // For now, we'll just simulate success
      console.log('Backing up data to IPFS...');
      
      // Simulate blockchain delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess('Data backup initiated successfully! The backup will be stored on IPFS and the reference will be recorded on the blockchain.');
      
    } catch (err) {
      console.error('Error backing up data:', err);
      setError(err.message || 'Failed to backup data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container>
      <h1 className="mb-4">Settings</h1>
      
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
      
      <Row>
        <Col md={6}>
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <h5 className="mb-3">User Management</h5>
              <div className="table-responsive mb-3">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Address</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.address}>
                        <td>
                          <small>{user.address.substring(0, 8)}...{user.address.substring(user.address.length - 4)}</small>
                        </td>
                        <td>{user.roleName}</td>
                        <td>
                          {user.address !== account?.address && (
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => handleRemoveUser(user.address)}
                              disabled={loading}
                            >
                              Remove
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              
              <h6>Add New User</h6>
              <Form onSubmit={handleAddUser}>
                <Form.Group className="mb-3">
                  <Form.Label>Algorand Address</Form.Label>
                  <Form.Control
                    type="text"
                    value={newUser.address}
                    onChange={(e) => setNewUser({...newUser, address: e.target.value})}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    required
                  >
                    <option value="1">Admin</option>
                    <option value="2">Manager</option>
                    <option value="3">Operator</option>
                  </Form.Select>
                </Form.Group>
                
                <Button 
                  variant="primary" 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add User'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
          
          <Card className="shadow-sm">
            <Card.Body>
              <h5 className="mb-3">Backup & Recovery</h5>
              <p>
                Backup all inventory data to IPFS. The IPFS hash will be stored on the blockchain for future recovery.
              </p>
              <Button 
                variant="primary" 
                onClick={handleBackupData}
                disabled={loading}
              >
                {loading ? 'Backing up...' : 'Backup Data to IPFS'}
              </Button>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <h5 className="mb-3">Contract Information</h5>
              <Table bordered>
                <tbody>
                  <tr>
                    <th>Inventory Contract</th>
                    <td>{appIds?.inventory_app_id || 'Not deployed'}</td>
                  </tr>
                  <tr>
                    <th>Asset Manager Contract</th>
                    <td>{appIds?.asset_app_id || 'Not deployed'}</td>
                  </tr>
                  <tr>
                    <th>Oracle Contract</th>
                    <td>{appIds?.oracle_app_id || 'Not deployed'}</td>
                  </tr>
                  <tr>
                    <th>Security Contract</th>
                    <td>{appIds?.security_app_id || 'Not deployed'}</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
          
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <h5 className="mb-3">Oracle Settings</h5>
              <Form onSubmit={handleUpdateCheckInterval}>
                <Form.Group className="mb-3">
                  <Form.Label>Inventory Check Interval (hours)</Form.Label>
                  <Form.Control
                    type="number"
                    value={checkInterval}
                    onChange={(e) => setCheckInterval(e.target.value)}
                    min="1"
                    required
                  />
                  <Form.Text className="text-muted">
                    How often the system should automatically check inventory levels
                  </Form.Text>
                </Form.Group>
                
                <Button 
                  variant="primary" 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Interval'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
          
          <Card className="shadow-sm">
            <Card.Body>
              <h5 className="mb-3">System Information</h5>
              <Table bordered>
                <tbody>
                  <tr>
                    <th>Connected Account</th>
                    <td>
                      {account ? (
                        <small>{account.address}</small>
                      ) : 'Not connected'}
                    </td>
                  </tr>
                  <tr>
                    <th>Network</th>
                    <td>Algorand TestNet</td>
                  </tr>
                  <tr>
                    <th>Version</th>
                    <td>1.0.0</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Settings;