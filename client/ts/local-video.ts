export default function addLocalVideoListener(element: HTMLElement | null): void {
  let currentX: number, currentY: number, initialX: number, initialY: number;

  if (element) {
    element.addEventListener('touchstart', dragStart, false);
    element.addEventListener('mousedown', dragStart, false);
  }

  // Private functions
  function dragStart(event: TouchEvent | MouseEvent): void {
    event.preventDefault();
    if (event instanceof TouchEvent) {
      initialX = event.touches[0].clientX;
      initialY = event.touches[0].clientY;
    } else {
      initialX = event.clientX;
      initialY = event.clientY;
    }

    document.addEventListener('mouseup', dragEnd, false);
    document.addEventListener('mousemove', drag, false)
    document.addEventListener('touchend', dragEnd, false);
    document.addEventListener('touchmove', drag, false)
  }

  function dragEnd(): void {
    document.removeEventListener('mouseup', dragEnd, false);
    document.removeEventListener('mousemove', drag, false);
    document.removeEventListener('touchstart', dragEnd, false);
    document.removeEventListener('touchmove', drag, false);
  }

  function drag(event: TouchEvent | MouseEvent): void {
    event.preventDefault();
    if (event instanceof TouchEvent) {
      currentX = initialX - event.touches[0].clientX;
      currentY = initialY - event.touches[0].clientY;
      initialX = event.touches[0].clientX;
      initialY = event.touches[0].clientY;
    } else {
      currentX = initialX - event.clientX;
      currentY = initialY - event.clientY;
      initialX = event.clientX;
      initialY = event.clientY;
    }

  
    if (element) {
      element.style.transform = 'rotateY(180deg)';
      element.style.top = `${element.offsetTop - currentY}px`;
      element.style.left = `${element.offsetLeft - currentX}px`;
    }
  }
}
