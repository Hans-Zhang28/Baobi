import localVideoController from './local-video';

const UI_ID_CONSTANTS = {
  localVideo: 'local-video',
  remoteVideo: 'remote-video',
};

export default class AppController {
  private localVideo: HTMLElement | null;

  public constructor() {
    this.localVideo = document.getElementById(UI_ID_CONSTANTS.localVideo);
    localVideoController(this.localVideo); // make local video draggable
  }
}