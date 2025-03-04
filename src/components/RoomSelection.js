import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Modal, Container, Row, Col, Card } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/RoomSelection.css';

const RoomSelection = () => {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (roomName && userName) {
      navigate(`/room/${roomName}`, { state: { userName, isHost: true } });
    }
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (roomName && userName) {
      navigate(`/room/${roomName}`, { state: { userName, isHost: false } });
    }
  };

  return (
    <Container className="room-selection">
      <h1 className="text-center mb-4">Welcome to Collab Canvas</h1>
      <Row className="justify-content-center">
        <Col md={6} className="text-center">
          <Card className="mb-3">
            <Card.Body>
              <h2>Start Collaborating</h2>
              <div className="d-grid gap-2">
                <Button variant="primary" size="lg" onClick={() => setShowCreateModal(true)}>
                  Create Room
                </Button>
                <Button variant="secondary" size="lg" onClick={() => setShowJoinModal(true)}>
                  Join Room
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Create Room Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create a Room</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateRoom}>
            <Form.Group className="mb-3">
              <Form.Label>Room Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter room name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Your Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              Create Room
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Join Room Modal */}
      <Modal show={showJoinModal} onHide={() => setShowJoinModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Join a Room</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleJoinRoom}>
            <Form.Group className="mb-3">
              <Form.Label>Room Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter room name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Your Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              Join Room
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default RoomSelection;
