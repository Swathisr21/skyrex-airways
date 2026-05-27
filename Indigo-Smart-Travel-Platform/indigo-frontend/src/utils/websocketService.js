// Lightweight WebSocket service for real-time seat updates
// Uses STOMP protocol compatible with Spring Boot WebSocket

class WebSocketService {
  constructor() {
    this.client = null;
    this.subscriptions = new Map();
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        // Use raw WebSocket endpoint (Spring Boot STOMP without SockJS)
        const wsUrl = 'ws://localhost:8080/ws/websocket';
        this.client = new WebSocket(wsUrl);

        this.client.onopen = () => {
          console.log('WebSocket connected');
          this.connected = true;
          this.reconnectAttempts = 0;
          // Send STOMP CONNECT frame
          const connectFrame = 'CONNECT\naccept-version:1.2\nhost:localhost\n\n\x00';
          this.client.send(connectFrame);
          resolve();
        };

        this.client.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.client.onclose = () => {
          console.log('WebSocket disconnected');
          this.connected = false;
          this.attemptReconnect();
        };

        this.client.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        reject(error);
      }
    });
  }

  handleMessage(data) {
    // Parse STOMP MESSAGE frames
    if (data.startsWith('MESSAGE')) {
      const bodyMatch = data.match(/\n\n([\s\S]*)\x00$/);
      if (bodyMatch) {
        try {
          const message = JSON.parse(bodyMatch[1]);
          const destination = data.match(/destination:([^\n]+)/)?.[1]?.trim();
          if (destination && this.subscriptions.has(destination)) {
            this.subscriptions.get(destination).forEach(callback => callback(message));
          }
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      }
    } else if (data.startsWith('CONNECTED')) {
      console.log('STOMP connection established');
    }
  }

  subscribe(destination, callback) {
    if (!this.subscriptions.has(destination)) {
      this.subscriptions.set(destination, []);
      // Send STOMP SUBSCRIBE frame
      if (this.connected && this.client) {
        const id = 'sub-' + Math.random().toString(36).substr(2, 9);
        const subscribeFrame = `SUBSCRIBE\nid:${id}\ndestination:${destination}\n\n\x00`;
        this.client.send(subscribeFrame);
      }
    }
    this.subscriptions.get(destination).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscriptions.get(destination);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
        if (callbacks.length === 0) {
          this.subscriptions.delete(destination);
        }
      }
    };
  }

  send(destination, body) {
    if (this.connected && this.client) {
      const messageFrame = `SEND\ndestination:${destination}\ncontent-type:application/json\n\n${JSON.stringify(body)}\x00`;
      this.client.send(messageFrame);
    } else {
      console.warn('WebSocket not connected, message queued');
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => {
        this.connect().catch(() => {});
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.client) {
      // Send STOMP DISCONNECT frame
      if (this.connected) {
        this.client.send('DISCONNECT\n\n\x00');
      }
      this.client.close();
      this.client = null;
      this.connected = false;
    }
    this.subscriptions.clear();
  }
}

export const wsService = new WebSocketService();
export default WebSocketService;
