import io from 'socket.io-client';
import { trace } from './utils';

const TARGET = 'SOCKET_CHANNEL';

export default class SignalingChannel {
  private _appController: Baobi.Mediator;
  private _channel: SocketIOClient.Socket;

  public constructor(mediator: Baobi.Mediator) {
    this._appController = mediator;
    trace('Initialize the socket channel', TARGET);
    this._channel = io();
    this.setup();
  }

  private prepareToStart(socketId: string) {
    this._appController.updateChannelStatus(true);
    this._appController.updateTargetId(socketId);
    // TODO: update the caller name
  }

  private setup() {
    if (this._channel) {
      trace('Create or join room for Baobi', TARGET);
      this._channel.emit('create or join', 'Baobi', TARGET);
  
      this._channel.on('created', (room: string) => {
        trace('Created room ' + room, TARGET);
        this._appController.updateCallerStatus(true);
      });
  
      this._channel.on('full', (room: string) => {
        trace(`${room} is full`, TARGET);
      });
      
      this._channel.on('join', (data: any) => {
        trace(`${data.user} made a request to join room`, TARGET);
        this.prepareToStart(data.user);
      });
      
      this._channel.on('joined', (data: any) => {
        trace(`${data.user} joined`, TARGET);
        this.prepareToStart(data.user);
      });
  
      this._channel.on('stream-ready', () => {
        trace('Stream is ready', TARGET);
        this._appController.prepareToStart();
      });
      
      this._channel.on('close-conncetion', ({ socketId }: Baobi.SocketMessage) => {
        trace(`${socketId} closed connection`, TARGET);
        this._appController.prepareToStop(socketId);
      });
      
      this._channel.on('video-offer', async (data: Baobi.SocketMessage) => {
        trace(`${data.socketId} sent an offer`, TARGET);
        this._appController.handleOffer(data);
      });
      
      this._channel.on('video-answer', async (data: Baobi.SocketMessage) => {
        trace(`${data.socketId} sent an answer`, TARGET);
        this._appController.handleAnswer(data);
      });
      
      this._channel.on('reject-offer', ({ socketId }: Baobi.SocketMessage) => {
        // this is calling alert from window object
        alert(`${socketId} rejected your call.`);
        this._appController.handleRejection();
      });
  
      this._channel.on('new-ice-candidate', async (data: Baobi.SocketMessage) => {
        trace('There is a new ice candidate', TARGET);
        this._appController.handleNewIceCandidate(data);
      });
    }
  }

  public readyToStrem(): void {
    this._channel.emit('stream-ready');
  }

  public rejectOffer(socketId: string): void {
    this._channel.emit('reject-offer', {
      from: socketId,
    });
  }

  public createAnswer({ socketId, username, answer }: Baobi.SocketMessage): void {
    trace(`Answer ${socketId}`, TARGET);
    this._channel.emit('video-answer', {
      answer,
      username: username,
      to: socketId
    });
  }

  public createOffer({ socketId, username, offer }: Baobi.SocketMessage): void {
    trace(`Send ${socketId} offer`, TARGET);
    this._channel.emit('video-offer', {
      offer: offer,
      username: username,
      to: socketId,
    });
  }

  public createNewIceCandidate({ candidate, socketId }: Baobi.SocketMessage): void {
    trace(`Message ${socketId} for new ice candidate`, TARGET);
    this._channel.emit('new-ice-candidate', {
      candidate: candidate,
      to: socketId,
    });
  }

  public disconnect({ socketId }: Baobi.SocketMessage): void {
    trace(`Disconnect ${socketId}`, TARGET);
    this._channel.emit('disconnect', {
      to: socketId,
    });
  }
}
