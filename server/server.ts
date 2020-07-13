import express, { Application } from 'express';
import socketIO, { Server as SocketIOServer, Socket } from 'socket.io';
import { createServer, Server as HTTPServer } from 'http';
import path from 'path';

export default class Server implements Baobi.Server {
  private _httpServer: HTTPServer;
  private _app: Application;
  private _io: SocketIOServer;

  private readonly DEFAULT_PORT = process.env.PORT || 8080;

  constructor() {
    this._app = express();
    this._httpServer = createServer(this._app);
    this._io = socketIO(this._httpServer);

    this.configureApp();
    this.configureRoutes();
    this.handleSocketConnect_ion();
  }

  private configureApp(): void {
    this._app.use(express.static(path.join(__dirname, '../../webpack')));
  }

  private configureRoutes(): void {
    this._app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../../webpack/index.html'))
    });
  }

  private handleSocketConnect_ion(): void {
    this._io.on('connection', (socket: Socket) => {
      socket.on('create or join', (room: string) => {
    
        let clientsInRoom = this._io.sockets.adapter.rooms[room];
        let numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
        
        if (numClients === 0) {
          socket.join(room);
          socket.emit('created', room);
        } else if (numClients === 1) {
          this._io.sockets.in(room).emit('join', {
            socketId: socket.id,
          });
          socket.join(room);
          socket.emit('joined', {
            socketId: Object.keys(clientsInRoom.sockets)[0],
          });
          this._io.sockets.in(room).emit('ready');
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

      socket.on('stream-ready', () => {
        socket.broadcast.emit('stream-ready');
      });

      socket.on('new-ice-candidate', (data: any) => {
        socket.to(data.to).emit('new-ice-candidate', {
          candidate: data.candidate,
          socketId: socket.id,
        });
      });

      socket.on('reject-offer', (data: any) => {
        socket.to(data.from).emit('reject-offer', {
          socketId: socket.id
        });
      });

      socket.on('disconnect', () => {
        socket.broadcast.emit('close-conncetion', {
          socketId: socket.id
        });
      });
    });
  }

  public listen(callback: (port: number | string) => void): void {
    this._httpServer.listen(this.DEFAULT_PORT, () => {
      callback(this.DEFAULT_PORT);
    });
  }
}
