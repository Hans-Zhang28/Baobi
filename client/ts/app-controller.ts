const io = require('socket.io-client');
import localVideoController from './local-video';
import popUpController from './pop-up';
import { trace } from './utils'; 

const UI_ID_CONSTANTS = {
  localVideo: 'local-video',
  remoteVideo: 'remote-video',
  popup: 'popup',
  activeUserContainer: 'active-user-container',

};

const globalServers = {
  iceServers: [
      { urls: "stun:stun01.sipphone.com" },
      { urls: "stun:stun.ekiga.net" },
      { urls: "stun:stun.fwdnet.net" },
      { urls: "stun:stun.ideasip.com" },
      { urls: "stun:stun.iptel.org" },
      { urls: "stun:stun.rixtelecom.se" },
      { urls: "stun:stun.schlund.de" },
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" },
      { urls: "stun:stunserver.org" },
      { urls: "stun:stun.softjoys.com" },
      { urls: "stun:stun.voiparound.com" },
      { urls: "stun:stun.voipbuster.com" },
      { urls: "stun:stun.voipstunt.com" },
      { urls: "stun:stun.voxgratia.org" },
      { urls: "stun:stun.xten.com" },
      {
          urls: "turn:numb.viagenie.ca",
          credential: "muazkh",
          username: "webrtc@live.com"
      },
      {
          urls: "turn:192.158.29.39:3478?transport=udp",
          credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
          username: "28224511:1379330808"
      },
      {
          urls: "turn:192.158.29.39:3478?transport=tcp",
          credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
          username: "28224511:1379330808"
      }
  ]
};

export default class AppController {
  private localVideo: HTMLVideoElement | null;

  private remoteVideo: HTMLVideoElement | null;

  private popup: HTMLElement | null;

  private activeUserContainer: HTMLElement | null;

  private hasMadeCall: Boolean;

  private beCalled: Boolean;

  private peerConnection: RTCPeerConnection | null;

  private socket: SocketIO.Socket | null;

  public constructor() {
    trace('initialize default values');
    this.hasMadeCall = false;
    this.beCalled = false;
    this.localVideo = null;
    this.remoteVideo = null;
    this.popup = null;
    this.activeUserContainer = null;
    this.peerConnection = null;
    this.socket = null;

    trace('initialize all listeners');
    this.initializeListener();
    
    trace('setup peer conncetion');
    this.setupPeerConnection();

    trace('setup signaling connection');
    this.setupSignaling();
  }

  private setupSignaling() {
    this.socket = io();

    if (this.socket) {
      this.socket.on("update-user-list", ({ users }) => {
        this.updateUserList(users);
      });
      
      this.socket.on("remove-user", ({ socketId }) => {
        const elToRemove = document.getElementById(socketId);
      
        if (elToRemove) {
          elToRemove.remove();
        }
      });
      
      this.socket.on("call-made", async data => {
        if (this.beCalled && this.socket) {
          const confirmed = confirm(
            `User "Socket: ${data.socket}" wants to call you. Do accept this call?`
          );
      
          if (!confirmed) {
            this.socket.emit("reject-call", {
              from: data.socket
            });
      
            return;
          }
        }
        
        if (this.peerConnection && this.socket) {
          await this.peerConnection.setRemoteDescription(
            new RTCSessionDescription(data.offer)
          );
          const answer = await this.peerConnection.createAnswer();
          await this.peerConnection.setLocalDescription(new RTCSessionDescription(answer));
        
          this.socket.emit("make-answer", {
            answer,
            to: data.socket
          });
          this.beCalled = true;
        }
      });
      
      this.socket.on("answer-made", async data => {
        if (this.peerConnection) {
          await this.peerConnection.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
        }
        if (!this.hasMadeCall) {
          this.callUser(data.socket);
          this.hasMadeCall = true;
        }
      });
      
      this.socket.on("call-rejected", data => {
        alert(`User: "Socket: ${data.socket}" rejected your call.`);
        this.unselectUsersFromList();
      });
    }
  }

  private setupPeerConnection() {
    const { RTCPeerConnection } = window;
    trace('setup peer connection');
    this.peerConnection = new RTCPeerConnection(globalServers);

    this.remoteVideo = <HTMLVideoElement>document.getElementById(UI_ID_CONSTANTS.remoteVideo);
    this.peerConnection.ontrack = ({ streams: [stream] }) => {
      if (this.remoteVideo) {
        this.remoteVideo.srcObject = stream;
      }
    };

    this.peerConnection.onicecandidate = (event): void => {
      if (event.candidate) {
        console.log(`Send the candidate ${event.candidate} to the remote peer`);
      }
    }

    this.peerConnection.oniceconnectionstatechange = (): void => {
      if (this.peerConnection &&
          (this.peerConnection.iceConnectionState === "failed" ||
          this.peerConnection.iceConnectionState === "disconnected" ||
          this.peerConnection.iceConnectionState === "closed")) {
        console.error('Failed to connect');
      }
    };
  }

  private initializeListener() {
    this.localVideo = <HTMLVideoElement>document.getElementById(UI_ID_CONSTANTS.localVideo);
    localVideoController(this.localVideo); // make local video draggable
    this.popup = document.getElementById(UI_ID_CONSTANTS.popup);
    popUpController(this.popup);
    this.activeUserContainer = document.getElementById(UI_ID_CONSTANTS.activeUserContainer);
    this.remoteVideo
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

  private createUserItemContainer(socketId: string): HTMLElement {
    const userContainerEl = document.createElement("div");
  
    const usernameEl = document.createElement("p");
  
    userContainerEl.setAttribute("class", "active-user");
    userContainerEl.setAttribute("id", socketId);
    usernameEl.setAttribute("class", "username");
    usernameEl.innerHTML = `Socket: ${socketId}`;
  
    userContainerEl.appendChild(usernameEl);
  
    userContainerEl.addEventListener("click", () => {
      this.unselectUsersFromList();
      userContainerEl.setAttribute("class", "active-user active-user--selected");
      const talkingWithInfo = document.getElementById("talking-with-info");
      if (talkingWithInfo) {
        talkingWithInfo.innerHTML = `Talking with: "Socket: ${socketId}"`;
        this.callUser(socketId);
      }
    });
  
    return userContainerEl;
  }

  private unselectUsersFromList(): void {
    const alreadySelectedUser = document.querySelectorAll(
      ".active-user.active-user--selected"
    );
  
    alreadySelectedUser.forEach(el => {
      el.setAttribute("class", "active-user");
    });
  }

  private async callUser(socketId: string): Promise<void> {
    const offerOptions: RTCOfferOptions = {
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    };

    if (this.peerConnection && this.socket) {
      const offer = await this.peerConnection.createOffer(offerOptions);
      await this.peerConnection.setLocalDescription(new RTCSessionDescription(offer));

      this.socket.emit("call-user", {
        offer,
        to: socketId
      });
    }
  }
}