import localVideoController from './local-video';
import SignalingChannel from './signaling-channel';
import popUpController from './pop-up';
import { trace } from './utils'; 

const UI_ID_CONSTANTS = {
  localVideo: 'local-video',
  remoteVideo: 'remote-video',
  popup: 'popup',
  activeUserContainer: 'active-user-container',

};

const globalServers = [
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

export default class AppController implements Baobi.Mediator {
  private localVideo: HTMLVideoElement | null;

  private remoteVideo: HTMLVideoElement | null;

  private popup: HTMLElement | null;

  private activeUserContainer: HTMLElement | null;

  private isCaller: Boolean;

  private peerConnection: RTCPeerConnection | null; // RTCPeerConnection

  private myUsername: string;

  private webcamStream: MediaStream | null;       // MediaStream from webcam

  // private transceiver: RTCRtpTransceiver | null;  // RTCRtpTransceiver

  private sender: RTCRtpSender | null;

  private targetSocketId: string;      // To store socket id of other peer

  private isCalling: Boolean;

  private isChannelReady: Boolean;

  private channel: SignalingChannel;

  public constructor() {
    trace('Initialize default values');
    this.isCaller = false;
    this.localVideo = null;
    this.remoteVideo = null;
    this.popup = null;
    this.activeUserContainer = null;
    this.peerConnection = null;
    this.myUsername = 'Unknown';
    this.webcamStream = null;
    // this.transceiver = null;
    this.sender = null;
    this.targetSocketId = '';
    this.isCalling = false;
    this.isChannelReady = false;

    trace('Setup signaling connection');
    // this.setupSignaling();
    this.channel = new SignalingChannel(this);

    trace('Initialize all listeners');
    this.initializeListener();

    trace('Setup video tags for IOS devices');
    this.setupVideoTag();

    trace('Setup web cam');
    this.setupWebcamStream();
  }

  private setupVideoTag() {
    // iPad or iPhone
    const userAgent = window.navigator.userAgent;
    if (userAgent.match(/iPad/i) || userAgent.match(/iPhone/i)) {
      if (this.remoteVideo) {
        this.remoteVideo.setAttributeNode(document.createAttribute('playsinline'));
      }
      if (this.localVideo) {
        this.localVideo.setAttributeNode(document.createAttribute('playsinline'));
      }
    }
  }

  private initializeListener() {
    this.localVideo = <HTMLVideoElement>document.getElementById(UI_ID_CONSTANTS.localVideo);
    localVideoController(this.localVideo); // make local video draggable
    this.popup = document.getElementById(UI_ID_CONSTANTS.popup);
    popUpController(this.popup);
    this.activeUserContainer = document.getElementById(UI_ID_CONSTANTS.activeUserContainer);
    this.remoteVideo = <HTMLVideoElement>document.getElementById(UI_ID_CONSTANTS.remoteVideo);

    window.onbeforeunload = () => {
      trace('Before unload everything');
      this.channel.disconnect({ socketId: this.targetSocketId });
      this.hangUp();
    }
  }

  private setupPeerConnection() {
    const { RTCPeerConnection } = window;
    trace('Setup peer connection');
    this.peerConnection = new RTCPeerConnection({
      iceServers: globalServers,
    });

    this.peerConnection.ontrack = (event): void => {
      trace('Get remote stream');
      if (this.remoteVideo) {
        this.remoteVideo.srcObject = event.streams[0];
      }
    };

    this.peerConnection.onicecandidate = (event): void => {
      if (event.candidate) {
        trace(`Send the candidate ${event.candidate.candidate} to the remote peer`);
       
        if (this.targetSocketId) {
          this.channel.createNewIceCandidate({
            candidate: event.candidate,
            socketId: this.targetSocketId,
          });
        }
      }
    }

    this.peerConnection.oniceconnectionstatechange = (): void => {
      if (this.peerConnection &&
          (this.peerConnection.iceConnectionState === 'failed' ||
          this.peerConnection.iceConnectionState === 'disconnected' ||
          this.peerConnection.iceConnectionState === 'closed')) {
        console.error('Failed to connect');
      }
    };
  }

  private updateUserList(socketIds: Array<string>) {
    socketIds.forEach(socketId => {
      const alreadyExistingUser = document.getElementById(socketId);
      if (!alreadyExistingUser && this.activeUserContainer) {
        const userContainerEl = this.createUserItemContainer(socketId);
  
        this.activeUserContainer.appendChild(userContainerEl);
      }
    });
  }

  private unselectUsersFromList(): void {
    const alreadySelectedUser = document.querySelectorAll(
      '.active-user.active-user--selected'
    );
  
    alreadySelectedUser.forEach(el => {
      el.setAttribute('class', 'active-user');
    });
  }

  private createUserItemContainer(socketId: string): HTMLElement {
    const userContainerEl = document.createElement('div');
    const usernameEl = document.createElement('p');
  
    userContainerEl.setAttribute('class', 'active-user');
    userContainerEl.setAttribute('id', socketId);
    usernameEl.setAttribute('class', 'username');
    usernameEl.innerHTML = this.myUsername;;
    userContainerEl.appendChild(usernameEl);
    userContainerEl.addEventListener('click', this.invite.bind(this), false);
  
    return userContainerEl;
  }

  private async invite(event: MouseEvent): Promise<void> {
    trace('Send invite');
    this.isCaller = true;
    this.unselectUsersFromList();

    this.targetSocketId = (event.target as HTMLElement).id;

    await this.prepareToStart();
  }

  private async setupWebcamStream(): Promise<void> {
    const constraints = {
      video: { width: 1280, height: 720 },
      audio: true,
    };

    const localUserContainer = document.getElementById('local-user'); // the username has been set most likely
    if (localUserContainer) {
      this.myUsername = localUserContainer.innerHTML;
    }

    try {
      trace('Get local user media');
      this.webcamStream = await navigator.mediaDevices.getUserMedia(constraints);
      if (this.localVideo) {
        this.localVideo.srcObject = this.webcamStream;
      }
    } catch(e) {
      console.error('Failed to get local media stream: ' + e.message);
      return;
    }

    this.channel.readyToStrem();

    if (this.isCaller) {
      this.prepareToStart();
    }
  }

  private async makeCall() {
    try {
      if (this.peerConnection) {
        trace('Create offer');
        const offer = await this.peerConnection.createOffer();
    
        trace('Set local description');
        await this.peerConnection.setLocalDescription(offer);

        this.channel.createOffer({
          socketId: this.targetSocketId,
          username: this.myUsername,
          offer: this.peerConnection.localDescription,
        });
      }

  
    } catch(e) {
      console.error('Failed to create offer: ' + e.message);
    };
  }

  private hangUp() {
    trace('Hang up local peer connection');
    if (this.peerConnection) {
      if (this.sender) {
        this.peerConnection.removeTrack(this.sender);
      }
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }

  private handleRemoteHangUp() {
    trace('Handle remote hang up');
    this.isCalling = false;
    this.isCaller = true;
    this.isChannelReady = false;
    this.hangUp();
  }

  private async makeAnswer({ username, socketId, offer }: Baobi.SocketMessage): Promise<void> {
    const desc = new RTCSessionDescription(offer);
    if (this.peerConnection) {

      // connect when peer connection is stable
      if (this.peerConnection.signalingState !== 'stable') {
        trace('Will Set remote description until the connection is stable');

        await Promise.all([
          this.peerConnection.setLocalDescription({type: 'rollback'}),
          this.peerConnection.setRemoteDescription(desc),
        ]);
        return;
      }
      trace('Setting remote description')
      await this.peerConnection.setRemoteDescription(desc);

      const userContainerEl = document.getElementById(socketId);
      if (userContainerEl) {
        userContainerEl.setAttribute('class', 'active-user active-user--selected');
        userContainerEl.innerHTML = username || 'Anonymous';
      }

      trace('Create and send answer to caller')
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(new RTCSessionDescription(answer));
    
      this.channel.createAnswer({ socketId, answer, username: this.myUsername });
    }
  }

  public updateCallerStatus(status: boolean): void {
    this.isCaller = status;
  }

  public async prepareToStart() {
    trace(`Prepare to start: isCalling ${this.isCalling}, webcamStream ${this.webcamStream}, isCannelReady ${this.isChannelReady}`);
    if (!this.isCalling && this.webcamStream && this.isChannelReady) {
      trace('Setup peer connection');
      this.setupPeerConnection();

      try {
        if (this.webcamStream) {
          this.webcamStream.getTracks().forEach((track: MediaStreamTrack) => {
            if (this.peerConnection && this.webcamStream) {
              trace(`Attach ${track.kind} stream`);
              this.sender = this.peerConnection.addTrack(track, this.webcamStream);
            }
          });
        }
        this.isCalling = true;
      } catch(e) {
        console.error('Failed to attach stream: ' + e.message)
        return;
      }
  
      if (this.isCaller) {
        await this.makeCall();
      }
    }
  }

  public prepareToStop(socketId: string): void {
    const elToRemove = document.getElementById(socketId);
    if (elToRemove) {
      elToRemove.remove();
    }

    if (socketId === this.targetSocketId) {
      this.handleRemoteHangUp();
    }
  }

  public async handleOffer({ username, socketId, offer }: Baobi.SocketMessage): Promise<void> {
    trace(`Receive offer from caller ${username}`);
    this.updateTargetId(socketId);

    if (!this.isCaller) {
      const confirmed = window.confirm(`User 'Socket: ${username}' wants to call you. Do accept this call?`);
      if (!confirmed) {
        this.channel.rejectOffer(socketId);
        return;
      }
    }
    
    if (!this.isCaller && !this.isCalling) {
      await this.prepareToStart();
    }

    await this.makeAnswer({ username, socketId, offer});
  }

  public async handleAnswer({ username, socketId, answer }: Baobi.SocketMessage): Promise<void> {
    if (this.peerConnection) {
      trace(`Receive answer from callee ${username}`);
      const userContainerEl = document.getElementById(socketId);
      if (userContainerEl) {
        userContainerEl.setAttribute('class', 'active-user active-user--selected');
        userContainerEl.innerHTML = username || 'Anonymous';
      }
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  public async handleNewIceCandidate({ candidate }: Baobi.SocketMessage): Promise<void> {
    if (this.isCalling) {
      const candidateInstance = new RTCIceCandidate(candidate);

      trace("Adding received ICE candidate: " + JSON.stringify(candidateInstance));
      try {
        if (this.peerConnection) {
          await this.peerConnection.addIceCandidate(candidateInstance);
        }
      } catch(e) {
        console.error('Failed to add ice candidate');
      }
    }
  }

  public handleRejection({ socketId }: Baobi.SocketMessage): void {
    this.unselectUsersFromList()
  }

  public updateChannelStatus(status: boolean) {
    this.isChannelReady = status;
  }

  public updateTargetId(userId: string) {
    this.targetSocketId = userId;
  }
}
