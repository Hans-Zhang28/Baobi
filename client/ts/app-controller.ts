import localVideoController from './local-video';
import SignalingChannel from './signaling-channel';
import popUpController from './pop-up';
import { trace, alert } from './utils'; 
import PeerConnection from './peer-connection';

const TARGET = 'APP_CONTROLLER';

const UI_ID_CONSTANTS = {
  localVideo: 'local-video',
  remoteVideo: 'remote-video',
  popup: 'popup',
  activeUserContainer: 'active-user-container',
};

export default class AppController implements Baobi.Mediator {
  private localVideo: HTMLVideoElement | null;

  private remoteVideo: HTMLVideoElement | null;

  private popup: HTMLElement | null;

  private activeUserContainer: HTMLElement | null;

  private isCaller: Boolean;

  private peerConnection: PeerConnection; // RTCPeerConnection

  private myUsername: string;

  private webcamStream: MediaStream | null;       // MediaStream from webcam

  // private transceiver: RTCRtpTransceiver | null;  // RTCRtpTransceiver

  private sender: RTCRtpSender | null;

  private targetSocketId: string;      // To store socket id of other peer

  private isCalling: Boolean;

  private isChannelReady: Boolean;

  private channel: SignalingChannel;

  public constructor() {
    trace('Initialize default values', TARGET);
    this.isCaller = false;
    this.localVideo = null;
    this.remoteVideo = null;
    this.popup = null;
    this.activeUserContainer = null;
    this.myUsername = 'Unknown';
    this.webcamStream = null;
    // this.transceiver = null;
    this.sender = null;
    this.targetSocketId = '';
    this.isCalling = false;
    this.isChannelReady = false;

    trace('Setup signaling channel', TARGET);
    this.channel = new SignalingChannel(this);

    trace('Initialize RTC peer connection', TARGET);
    this.peerConnection = new PeerConnection(this);

    trace('Initialize all listeners', TARGET);
    this.initializeListener();

    trace('Setup video tags for IOS devices', TARGET);
    this.setupVideoTag();

    trace('Setup web cam', TARGET);
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
      trace('Before unload everything', TARGET);
      this.channel.disconnect({ socketId: this.targetSocketId });
      this.hangUp();
    }
  }

  private setupPeerConnection() {
    // const { RTCPeerConnection } = window;
    // trace('Setup peer connection');
    // this.peerConnection = new RTCPeerConnection({
    //   iceServers: globalServers,
    // });

    // this.peerConnection.ontrack = (event): void => {
    //   trace('Get remote stream');
    //   if (this.remoteVideo) {
    //     this.remoteVideo.srcObject = event.streams[0];
    //   }
    // };

    // this.peerConnection.onicecandidate = (event): void => {
    //   if (event.candidate) {
    //     trace(`Send the candidate ${event.candidate.candidate} to the remote peer`);
       
    //     if (this.targetSocketId) {
    //       this.channel.createNewIceCandidate({
    //         candidate: event.candidate,
    //         socketId: this.targetSocketId,
    //       });
    //     }
    //   }
    // }

    // this.peerConnection.oniceconnectionstatechange = (): void => {
    //   if (this.peerConnection &&
    //       (this.peerConnection.iceConnectionState === 'failed' ||
    //       this.peerConnection.iceConnectionState === 'disconnected' ||
    //       this.peerConnection.iceConnectionState === 'closed')) {
    //     console.error('Failed to connect');
    //   }
    // };
    this.peerConnection.setupConnection();
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
    trace('Send invite', TARGET);
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
      trace('Get local user media', TARGET);
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
        // trace('Create offer', TARGET);
        // const offer = await this.peerConnection.createOffer();
    
        // trace('Set local description', TARGET);
        // await this.peerConnection.setLocalDescription(offer);
        
        const localDescription = await this.peerConnection.prepareToConnectAsCaller();

        if (!localDescription) {
          alert('Failed to generate RTC session description', TARGET);
          return;
        }

        this.channel.createOffer({
          socketId: this.targetSocketId,
          username: this.myUsername,
          offer: localDescription,
        });
      }
    } catch(e) {
      alert('Failed to create offer: ' + e.message, TARGET);
    };
  }

  private hangUp() {
    trace('Hang up local peer connection', TARGET);
    this.peerConnection.prepareToDisconnet(this.sender);
  }

  private handleRemoteHangUp() {
    trace('Handle remote hang up', TARGET);
    this.isCalling = false;
    this.isCaller = true;
    this.isChannelReady = false;
    this.hangUp();
  }

  private async makeAnswer({ username, socketId, offer }: Baobi.SocketMessage): Promise<void> {
    const desc = new RTCSessionDescription(offer);
    if (this.peerConnection) {
      // connect when peer connection is stable
      // if (this.peerConnection.signalingState !== 'stable') {
      //   trace('Will Set remote description until the connection is stable', TARGET);

      //   await Promise.all([
      //     this.peerConnection.setLocalDescription({type: 'rollback'}),
      //     this.peerConnection.setRemoteDescription(desc),
      //   ]);
      //   return;
      // }
      // trace('Setting remote description', TARGET);
      // await this.peerConnection.setRemoteDescription(desc);

      // trace('Create and send answer to caller', TARGET);
      // const answer = await this.peerConnection.createAnswer();
      // await this.peerConnection.setLocalDescription(new RTCSessionDescription(answer));
      const answer = await this.peerConnection.prepareToConnectAsCallee(offer);

      const userContainerEl = document.getElementById(socketId);
      if (userContainerEl) {
        userContainerEl.setAttribute('class', 'active-user active-user--selected');
        userContainerEl.innerHTML = username || 'Anonymous';
      }
    
      this.channel.createAnswer({ socketId, answer, username: this.myUsername });
    }
  }

  public updateCallerStatus(status: boolean): void {
    this.isCaller = status;
  }

  public async prepareToStart() {
    trace(`Prepare to start: isCalling ${this.isCalling}, webcamStream ${this.webcamStream}, isCannelReady ${this.isChannelReady}`, TARGET);
    if (!this.isCalling && this.webcamStream && this.isChannelReady) {
      trace('Setup peer connection', TARGET);
      this.setupPeerConnection();

      try {
        if (this.webcamStream) {
          this.webcamStream.getTracks().forEach((track: MediaStreamTrack) => {
            if (this.peerConnection && this.webcamStream) {
              trace(`Attach ${track.kind} stream`, TARGET);
              // this.sender = this.peerConnection.addTrack(track, this.webcamStream);
              this.sender = this.peerConnection.addLocalTrack(track, this.webcamStream);
            }
          });
        }
        this.isCalling = true;
      } catch(e) {
        alert('Failed to attach stream: ' + e.message, TARGET);
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
    trace(`Receive offer from caller ${username}`, TARGET);
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
      trace(`Receive answer from callee ${username}`, TARGET);
      const userContainerEl = document.getElementById(socketId);
      if (userContainerEl) {
        userContainerEl.setAttribute('class', 'active-user active-user--selected');
        userContainerEl.innerHTML = username || 'Anonymous';
      }
      // await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      await this.peerConnection.addRemoteSession(answer);
    }
  }

  public async handleNewIceCandidate({ candidate }: Baobi.SocketMessage): Promise<void> {
    if (this.isCalling) {
      // const candidateInstance = new RTCIceCandidate(candidate);

      // trace("Adding received ICE candidate: " + JSON.stringify(candidateInstance), TARGET);
      try {
        if (this.peerConnection) {
          // await this.peerConnection.addIceCandidate(candidateInstance);
          this.peerConnection.addIceCandidate(candidate)
        }
      } catch(e) {
        alert('Failed to add ice candidate', TARGET);
      }
    }
  }

  public handleRejection(): void {
    this.unselectUsersFromList()
  }

  public updateChannelStatus(status: boolean) {
    this.isChannelReady = status;
  }

  public updateTargetId(userId: string) {
    this.targetSocketId = userId;
  }

  // public methods for peer connection
  public getRemoteStream(event: RTCTrackEvent): void{
    if (this.remoteVideo) {
      this.remoteVideo.srcObject = event.streams[0];
    }
  }

  public sendCandidate(event: RTCPeerConnectionIceEvent): void {
    if (this.targetSocketId) {
      this.channel.createNewIceCandidate({
        candidate: event.candidate,
        socketId: this.targetSocketId,
      });
    }
  }
}
