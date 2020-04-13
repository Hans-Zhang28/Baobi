import addLocalVideoListener from './local-video';

const UI_CONSTANTS = {
  localVideo: '#local-video',
  remoteVideo: '#remote-video',
};

export default class AppController {
  private localVideo: JQuery<HTMLElement>;

  public constructor() {
    this.localVideo = $(UI_CONSTANTS.localVideo);
    debugger;
    this.localVideo.draggable();
  }
}