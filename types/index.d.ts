declare namespace Baobi {
  interface Server {
    listen(callback: (port: number | string) => void): void;
  }

  interface Mediator {
    updateCallerStatus(status: boolean): void;
    updateChannelStatus(status: boolean): void;
    updateTargetId(userId: string): void;
    prepareToStart(): Promise<void>;
    prepareToStop(userId: string): void;
    handleOffer(SocketMessage): Promise<void>;
    handleAnswer(SocketMessage): Promise<void>;
    handleRejection(SocketMessage): void;
    handleNewIceCandidate(SocketMessage): Promise<void>;
  }

  interface SocketMessage {
    socketId: string;
    username?: string;
    offer?: any;
    answer?: any;
    candidate?: any;
  }
};