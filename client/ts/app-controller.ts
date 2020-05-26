import io from 'socket.io-client';
import localVideoController from './local-video';
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
    { urls: 'stun:stun.ekiga.net' },
    { urls: 'stun:stun.fwdnet.net' },
    { urls: 'stun:stun.ideasip.com' },
    { urls: 'stun:stun.iptel.org' },
    { urls: 'stun:stun.rixtelecom.se' },
    { urls: 'stun:stun.schlund.de' },
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stunserver.org' },
    { urls: 'stun:stun.softjoys.com' },
    { urls: 'stun:stun.voiparound.com' },
    { urls: 'stun:stun.voipbuster.com' },
    { urls: 'stun:stun.voipstunt.com' },
    { urls: 'stun:stun.voxgratia.org' },
    { urls: 'stun:stun.xten.com' },
    {
        urls: 'turn:numb.viagenie.ca',
        credential: 'muazkh',
        username: 'webrtc@live.com'
    },
    {
        urls: 'turn:192.158.29.39:3478?transport=udp',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        username: '28224511:1379330808'
    },
    {
        urls: 'turn:192.158.29.39:3478?transport=tcp',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        username: '28224511:1379330808'
    }
];

export default class AppController {
  private localVideo: HTMLVideoElement | null;

  private remoteVideo: HTMLVideoElement | null;

  private popup: HTMLElement | null;

  private activeUserContainer: HTMLElement | null;

  private isCaller: Boolean;

  private peerConnection: RTCPeerConnection | null; // RTCPeerConnection

  private socket: SocketIOClient.Socket | null;

  private myUsername: string;

  private webcamStream: MediaStream | null;       // MediaStream from webcam

  // private transceiver: RTCRtpTransceiver | null;  // RTCRtpTransceiver

  private sender: RTCRtpSender | null;

  private targetSocketId: string;      // To store socket id of other peer

  private isCalling: Boolean;

  private isChannelReady: Boolean;

  public constructor() {
    trace('Initialize default values');
    this.isCaller = false;
    this.localVideo = null;
    this.remoteVideo = null;
    this.popup = null;
    this.activeUserContainer = null;
    this.peerConnection = null;
    this.socket = null;
    this.myUsername = 'Unknown';
    this.webcamStream = null;
    // this.transceiver = null;
    this.sender = null;
    this.targetSocketId = '';
    this.isCalling = false;
    this.isChannelReady = false;

    trace('Setup signaling connection');
    this.setupSignaling();

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

  private setupSignaling() {
    this.socket = io();
    
    if (this.socket) {
      trace('Create or join room for Baobi');
      this.socket.emit('create or join', 'Baobi');

      this.socket.on('created', (room: string) => {
        trace('Created room ' + room);
        this.isCaller = true;
      });

      this.socket.on('full', (room: string) => {
        trace(`${room} is full`);
      });
      
      this.socket.on('join', ({ user }: any) => {
        trace(`Another peer ${user} made a request to join room`);
        this.isChannelReady = true;
        this.targetSocketId = user;
        // this.updateUserList(users);
      });
      
      this.socket.on('joined', ({ user }: any) => {
        trace(`${user} joined`);
        this.isChannelReady = true;
        this.targetSocketId = user;
        // this.updateUserList(users);
      });

      this.socket.on('stream-ready', () => {
        this.prepareToStart();
      });
      
      this.socket.on('remove-user', ({ socketId }: any) => {
        const elToRemove = document.getElementById(socketId);
      
        if (elToRemove) {
          elToRemove.remove();
        }

        this.hangup();
      });
      
      this.socket.on('video-offer', async (data: any) => {
          trace(`Receive offer from caller ${data.username}`);
          this.targetSocketId = data.socketId;

          if (!this.isCaller) {
            const confirmed = window.confirm(`User 'Socket: ${data.username}' wants to call you. Do accept this call?`);
            if (!confirmed) {
              if (this.socket) {
                trace('Reject the offer');
                this.socket.emit('reject-offer', {
                  from: data.socketId
                });
              }
              return;
            }
          }
          
          if (!this.isCaller && !this.isCalling) {
            this.prepareToStart();
          }

          this.makeAnswer(data);
      });
      
      this.socket.on('video-answer', async (data: any) => {
        if (this.peerConnection) {
          trace(`Receive answer from callee ${data.username}`);
          const userContainerEl = document.getElementById(data.socketId);
          if (userContainerEl) {
            userContainerEl.setAttribute('class', 'active-user active-user--selected');
            userContainerEl.innerHTML = data.username;
          }
          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
      });
      
      this.socket.on('reject-offer', (data: any) => {
        alert(`User: 'Socket: ${data.socketId}' rejected your call.`);
        this.unselectUsersFromList();
      });

      this.socket.on('new-ice-candidate', async (data: any) => {
        if (this.isCalling) {
          const candidate = new RTCIceCandidate(data.candidate);
  
          trace("Adding received ICE candidate: " + JSON.stringify(candidate));
          try {
            if (this.peerConnection) {
              await this.peerConnection.addIceCandidate(candidate);
            }
          } catch(e) {
            console.log(e);
            console.error('Failed to add ice candidate');
          }
        }
      });
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
      if (this.socket) {
        this.socket.emit('disconnect', {
          to: this.targetSocketId,
        });
      }
      this.hangup();
    }
  }

  private setupPeerConnection() {
    const { RTCPeerConnection } = window;
    trace('Setup peer connection');
    this.peerConnection = new RTCPeerConnection({
      iceServers: globalServers,
    });

    // this.peerConnection.onnegotiationneeded = async (event): Promise<void> => {
      // trace('Peer connection negotiation needed');

      // try {
      //   if (this.peerConnection) {
      //     trace("Creating offer");
      //     const offer = await this.peerConnection.createOffer();
      
      //     // If the connection hasn't yet achieved the "stable" state,
      //     // return to the caller. Ather negotiationneeded event
      //     // will be fired when the state stabilizes.
      //     if (this.peerConnection.signalingState != "stable") {
      //       trace("The connection isn't stable yet; postponing...")
      //       return;
      //     }
      
      //     // Establish the offer as the local peer's current
      //     // description.
      //     trace("Setting local description to the offer");
      //     await this.peerConnection.setLocalDescription(offer);
      
      //     // Send the offer to the remote peer.
      //     if (this.socket) {
      //       trace("Sending the offer to the remote peer");
      //       this.socket.emit('make-offer', {
      //         offer,
      //         username: this.myUsername,
      //         to: this.targetSocketId,
      //       });
      //     }
      //   }
      // } catch(err) {
      //   console.error("The following error occurred while handling the negotiationneeded event:");
      // };
    // }

    this.peerConnection.ontrack = (event): void => {
      trace('Get remote stream');
      if (this.remoteVideo) {
        this.remoteVideo.srcObject = event.streams[0];
      }
    };

    this.peerConnection.onicecandidate = (event): void => {
      if (event.candidate) {
        trace(`Send the candidate ${event.candidate.candidate} to the remote peer`);
       
        if (this.socket && this.targetSocketId) {
          this.socket.emit('new-ice-candidate', {
            candidate: event.candidate,
            to: this.targetSocketId,
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

    if (this.socket) {
      this.socket.emit('stream-ready');
    }

    if (this.isCaller) {
      this.prepareToStart();
    }
    // try {
    //   trace('Attach webcam stream to transceiver');
    //   this.webcamStream.getTracks().forEach((track: MediaStreamTrack) => {
    //     if (this.peerConnection && this.webcamStream) {
    //       trace(`Attach ${track.kind} stream`);
    //       this.transceiver = this.peerConnection.addTransceiver(track, {streams: [this.webcamStream]});
    //     }
    //   });
    // } catch(e) {
    //   console.error('Failed to add tracks from the stream to the RTCPeerConnection');
    // }
  }

  private async prepareToStart() {
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

  private async makeCall() {
    try {
      if (this.peerConnection) {
        trace('Create offer');
        const offer = await this.peerConnection.createOffer();
    
        trace('Set local description');
        await this.peerConnection.setLocalDescription(offer);

        if (this.socket) {
          trace('Send offer');
          this.socket.emit('video-offer', {
            offer: this.peerConnection.localDescription,
            username: this.myUsername,
            to: this.targetSocketId,
          });
        }
      }

  
    } catch(e) {
      console.error('Failed to create offer: ' + e.message);
    };
  }

  private hangup() {
    trace('Hang up');
    if (this.peerConnection) {
      if (this.sender) {
        this.peerConnection.removeTrack(this.sender);
      }
      this.peerConnection.close();
    }
  }

  private async makeAnswer(data: any) {
    const desc = new RTCSessionDescription(data.offer);
    if (this.peerConnection && this.socket) {

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

      const userContainerEl = document.getElementById(data.socketId);
      if (userContainerEl) {
        userContainerEl.setAttribute('class', 'active-user active-user--selected');
        userContainerEl.innerHTML = data.username;
      }

      trace('Create and send answer to caller')
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(new RTCSessionDescription(answer));
    
      this.socket.emit('video-answer', {
        answer,
        username: this.myUsername,
        to: data.socketId
      });
    }
  }
}