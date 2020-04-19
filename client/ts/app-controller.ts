import localVideoController from './local-video';
import popUpController from './pop-up';

const UI_ID_CONSTANTS = {
  localVideo: 'local-video',
  remoteVideo: 'remote-video',
  popup: 'popup',
};

export default class AppController {
  private localVideo: HTMLElement | null;

  private popup: HTMLElement | null;

  public constructor() {
    this.localVideo = document.getElementById(UI_ID_CONSTANTS.localVideo);
    localVideoController(this.localVideo); // make local video draggable
    this.popup = document.getElementById(UI_ID_CONSTANTS.popup);
    popUpController(this.popup);
  }
}