"use strict";
exports.__esModule = true;
function addLocalVideoListener(elementId) {
    console.log("chat-controller is compiled successfully");
}
exports["default"] = addLocalVideoListener;
//   private active: Boolean;
//   private currentX: number;
//   private currentY: number;
//   private initialX: number;
//   private initialY: number;
//   private xOffset: number;
//   private yOffset: number;
//   private dragItem: HTMLElement;
//   public constructor(elementId: string) {
//     this.dragItem = document.querySelector(elementId);
//     this.dragItem.addEventListener("touchstart", this.dragStart, false);
//     this.dragItem.addEventListener("touchend", this.dragEnd, false);
//     this.dragItem.addEventListener("touchmove", this.drag, false);
//     this.dragItem.addEventListener("mousedown", this.dragStart, false);
//     this.dragItem.addEventListener("mouseup", this.dragEnd, false);
//     this.dragItem.addEventListener("mousemove", this.drag, false);
//   }
//   private dragStart(event: TouchEvent | MouseEvent): void {
//     if (event instanceof TouchEvent) {
//       this.initialX = event.touches[0].clientX - this.xOffset;
//       this.initialY = event.touches[0].clientY - this.yOffset;
//     } else {
//       this.initialX = event.clientX - this.xOffset;
//       this.initialY = event.clientY - this.yOffset;
//     }
//     if (event.target === this.dragItem) {
//       this.active = true;
//     }
//   }
//   private dragEnd(): void {
//     this.initialX = this.currentX;
//     this.initialY = this.currentY;
//     this.active = false;
//   }
//   private drag(event: TouchEvent | MouseEvent): void {
//     if (this.active) {
//       event.preventDefault();
//       if (event instanceof TouchEvent) {
//         this.currentX = event.touches[0].clientX - this.initialX;
//         this.currentY = event.touches[0].clientY - this.initialY;
//       } else {
//         this.currentX = event.clientX - this.initialX;
//         this.currentY = event.clientY - this.initialY;
//       }
//       this.xOffset = this.currentX;
//       this.yOffset = this.currentY;
//       this.setTranslate(this.currentX, this.currentY, this.dragItem);
//     }
//   }
//   private setTranslate(xPos: number, yPos: number, element: HTMLElement) {
//     element.style.transform = `translate(${xPos}px, ${yPos}px) rotateY(180deg)`;
//   }
// }
