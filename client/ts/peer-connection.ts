import { trace, alert } from './utils';

const TARGET = 'RTC_PEER_CONNECTION';

export const SERVERS = [
  { urls: 'stun:stun01.sipphone.com' },
  // { urls: 'stun:stun.ekiga.net' },
  // { urls: 'stun:stun.fwdnet.net' },
  // { urls: 'stun:stun.ideasip.com' },
  // { urls: 'stun:stun.iptel.org' },
  // { urls: 'stun:stun.rixtelecom.se' },
  // { urls: 'stun:stun.schlund.de' },
  // { urls: 'stun:stun.l.google.com:19302' },
  // { urls: 'stun:stun1.l.google.com:19302' },
  // { urls: 'stun:stun2.l.google.com:19302' },
  // { urls: 'stun:stun3.l.google.com:19302' },
  // { urls: 'stun:stun4.l.google.com:19302' },
  // { urls: 'stun:stunserver.org' },
  // { urls: 'stun:stun.softjoys.com' },
  // { urls: 'stun:stun.voiparound.com' },
  // { urls: 'stun:stun.voipbuster.com' },
  // { urls: 'stun:stun.voipstunt.com' },
  // { urls: 'stun:stun.voxgratia.org' },
  // { urls: 'stun:stun.xten.com' },
  {
      urls: 'turn:numb.viagenie.ca',
      credential: 'muazkh',
      username: 'webrtc@live.com'
  },
  // {
  //     urls: 'turn:192.158.29.39:3478?transport=udp',
  //     credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
  //     username: '28224511:1379330808'
  // },
  // {
  //     urls: 'turn:192.158.29.39:3478?transport=tcp',
  //     credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
  //     username: '28224511:1379330808'
  // }
];

export default class PeerConnection {
  private _appController: Baobi.Mediator;
  private _connection: RTCPeerConnection | null;

  public constructor(mediator: Baobi.Mediator) {
    this._appController = mediator;
    trace('Initialize the RTC peer connection', TARGET);
    this._connection = null
  }

  public setupPeerConnection(): void {
    const { RTCPeerConnection } = window;
    this._connection = new RTCPeerConnection({
      iceServers: SERVERS,
    });

    this._connection.ontrack = (event: RTCTrackEvent): void => {
      trace('Get remote stream', TARGET);
      this._appController.getRemoteStream(event);
    };

    this._connection.onicecandidate = (event: RTCPeerConnectionIceEvent): void => {
      if (event.candidate) {
        trace(`Send the candidate ${event.candidate.candidate} to the remote peer`, TARGET);
        this._appController.sendCandidate(event);
      }
    }

    this._connection.oniceconnectionstatechange = (): void => {
      if (this._connection) {
        if (this._connection.iceConnectionState === 'failed') {
          alert('Failed to connect', TARGET);
        }
        if (this._connection.iceConnectionState === 'disconnected') {
          alert('Lost the connection', TARGET);
        }
        if (this._connection.iceConnectionState === 'closed') {
          trace('Connection has been closed', TARGET);
        }
      }
    };
  }

  public async prepareToConnectAsCaller(): Promise<RTCSessionDescription | null> {
    if (!this._connection) {
      alert('Connection has not been set up yet', TARGET);
      return null;
    }
    trace('Prepare to a connection as a caller', TARGET);
    trace('Create offer', TARGET);
    const offer = await this._connection.createOffer();
    trace('Set local description', TARGET);
    await this._connection.setLocalDescription(offer);

    return this._connection.localDescription;
  }

  public async prepareToConnectAsCallee(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit | null> {
    if (!this._connection) {
      alert('Connection has not been set up yet', TARGET);
      return null;
    }
    const remoteSessionDescription = new RTCSessionDescription(offer);
    // connect when peer connection is stable
    if (this._connection.signalingState !== 'stable') {
      trace('Will Set remote description until the connection is stable', TARGET);

      await Promise.all([
        this._connection.setLocalDescription({type: 'rollback'}),
        this._connection.setRemoteDescription(remoteSessionDescription),
      ]);
      return null;
    }

    trace('Setting remote description', TARGET);
    await this._connection.setRemoteDescription(remoteSessionDescription);

    trace('Create and send answer to caller', TARGET);
    const answer = await this._connection.createAnswer();
    await this._connection.setLocalDescription(new RTCSessionDescription(answer));
    return answer;
  }

  public addLocalTrack(track: MediaStreamTrack, webcamStream: MediaStream): RTCRtpSender | null {
    if (!this._connection) {
      alert('Connection has not been set up yet', TARGET);
      return null;
    }
    return this._connection.addTrack(track, webcamStream);
  }

  public async addRemoteSession(answer: RTCSessionDescriptionInit) {
    if (!this._connection) {
      alert('Connection has not been set up yet', TARGET);
      return null;
    }
    await this._connection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  public async addIceCandidate(candidate: any): Promise<void> {
    if (!this._connection) {
      alert('Connection has not been set up yet', TARGET);
      return;
    }
    const candidateInstance = new RTCIceCandidate(candidate);
    trace("Adding received ICE candidate: " + JSON.stringify(candidateInstance), TARGET);
    await this._connection.addIceCandidate(candidateInstance);
  }

  public prepareToDisconnet(sender: RTCRtpSender | null): void {
    if (!this._connection) {
      alert('Connection has not been set up yet', TARGET);
      return;
    }
    if (sender) {
      this._connection.removeTrack(sender);
    }
    this._connection.close();
    this._connection = null;
  }
}