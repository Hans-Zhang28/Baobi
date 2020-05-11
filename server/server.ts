import express, { Application } from 'express';
import socketIO, { Server as SocketIOServer } from 'socket.io';
import { createServer, Server as HTTPServer } from 'http';
import path from 'path';

export class Server {
  private httpServer: HTTPServer;
  private app: Application;
  private io: SocketIOServer;

  private activeSockets: string[] = [];

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
      const existingSocket = this.activeSockets.find(
        existingSocket => existingSocket === socket.id
      );

      if (!existingSocket) {
        this.activeSockets.push(socket.id);

        socket.emit('update-user-list', {
          users: this.activeSockets.filter(
            existingSocket => existingSocket !== socket.id
          )
        });

        socket.broadcast.emit('update-user-list', {
          users: [socket.id]
        });
      }

      socket.on('make-offer', (data: any) => {
        socket.to(data.to).emit('offer-made', {
          offer: data.offer,
          username: data.username,
          socketId: socket.id,
        });
      });

      socket.on('make-answer', data => {
        socket.to(data.to).emit('answer-made', {
          answer: data.answer,
          username: data.username,
          socketId: socket.id,
        });
      });

      socket.on('new-ice-candidate', data => {
        socket.to(data.to).emit('new-ice-candidate', {
          candidate: data.candidate,
          socketId: socket.id,
        });
      });

      socket.on('reject-offer', data => {
        socket.to(data.from).emit('offer-rejected', {
          socketId: socket.id
        });
      });

      socket.on('disconnect', () => {
        this.activeSockets = this.activeSockets.filter(
          existingSocket => existingSocket !== socket.id
        );
        socket.broadcast.emit('remove-user', {
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
