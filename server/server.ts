import express, { Application } from 'express';
import socketIO, { Server as SocketIOServer } from 'socket.io';
import { createServer, Server as HTTPServer } from 'http';
import path from 'path';

export class Server {
  private httpServer: HTTPServer;
  private app: Application;
  private io: SocketIOServer;

  private readonly DEFAULT_PORT = process.env.PORT || 8080;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = socketIO(this.httpServer);

    this.configureApp();
    this.configureRoutes();
    this.handleSocketConnection();
  }

  private configureApp(): void {
    this.app.use(express.static(path.join(__dirname, '../webpack')));
  }

  private configureRoutes(): void {
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../webpack/index.html'))
    });
  }

  private handleSocketConnection(): void {
    this.io.on('connection', socket => {
      socket.on('create or join', (room: any) => {
    
        let clientsInRoom = this.io.sockets.adapter.rooms[room];
        let numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
        
        if (numClients === 0) {
          socket.join(room);
          socket.emit('created', room);
        } else if (numClients === 1) {
          this.io.sockets.in(room).emit('join', {
            user: socket.id,
          });
          socket.join(room);
          socket.emit('joined', {
            user: Object.keys(clientsInRoom.sockets)[0],
          });
          this.io.sockets.in(room).emit('ready');
        } else { // max two clients
          socket.emit('full', room);
        }
      });

      socket.on('video-offer', (data: any) => {
        socket.to(data.to).emit('video-offer', {
          offer: data.offer,
          username: data.username,
          socketId: socket.id,
        });
      });

      socket.on('video-answer', (data: any) => {
        socket.to(data.to).emit('video-answer', {
          answer: data.answer,
          username: data.username,
          socketId: socket.id,
        });
      });

      socket.on('stream-ready', data => {
        socket.broadcast.emit('stream-ready');
      });

      socket.on('new-ice-candidate', data => {
        socket.to(data.to).emit('new-ice-candidate', {
          candidate: data.candidate,
          socketId: socket.id,
        });
      });

      socket.on('reject-offer', data => {
        socket.to(data.from).emit('reject-offer', {
          socketId: socket.id
        });
      });

      socket.on('disconnect', data => {
        socket.to(data.to).emit('remove-user', {
          socketId: socket.id
        });
      });
    });
  }

  public listen(callback: (port: number | string) => void): void {
    this.httpServer.listen(this.DEFAULT_PORT, () => {
      callback(this.DEFAULT_PORT);
    });
  }
}
