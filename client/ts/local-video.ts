export default function addLocalVideoListener(elementId: string): void {
  let active: boolean = false;
  let currentX: number, currentY: number, initialX: number, initialY: number;
  let xOffset: number = 0;
  let yOffset: number = 0;

  let dragItem: HTMLElement | null = document.querySelector(elementId);
  if (dragItem) {
    dragItem.addEventListener("touchstart", dragStart, false);
    dragItem.addEventListener("touchend", dragEnd, false);
    dragItem.addEventListener("touchmove", drag, false);
  
    dragItem.addEventListener("mousedown", dragStart, false);
    dragItem.addEventListener("mouseup", dragEnd, false);
    dragItem.addEventListener("mousemove", drag, false);
  }

  // Private functions
  function dragStart(event: TouchEvent | MouseEvent): void {
    if (event instanceof TouchEvent) {
      initialX = event.touches[0].clientX - xOffset;
      initialY = event.touches[0].clientY - yOffset;
    } else {
      initialX = event.clientX - xOffset;
      initialY = event.clientY - yOffset;
    }

    if (event.target === dragItem) {
      active = true;
    }
  }

  function dragEnd(): void {
    initialX = currentX;
    initialY = currentY;
    active = false;
  }

  function drag(event: TouchEvent | MouseEvent): void {
    if (active) {
      event.preventDefault();
    
      if (event instanceof TouchEvent) {
        currentX = event.touches[0].clientX - initialX;
        currentY = event.touches[0].clientY - initialY;
      } else {
        currentX = event.clientX - initialX;
        currentY = event.clientY - initialY;
      }
  
      xOffset = currentX;
      yOffset = currentY;
  
      if (dragItem) {
        setTranslate(currentX, currentY, dragItem);
      }
    }
  }
  
  function setTranslate(xPos: number, yPos: number, element: HTMLElement) {
    element.style.transform = `translate(${xPos}px, ${yPos}px) rotateY(180deg)`;
  }
}
