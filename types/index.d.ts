declear namespace Baobi {
  interface Server {
    httpServer: HTTPServer;
    app: Application;
    io: SocketIOServer;
    activeSockets: string[] = [];
  }
};