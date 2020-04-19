export default function addPopupListener(element: HTMLElement | null): void {
  let closeButton: HTMLElement | null;
  let submitButton: HTMLElement | null;

  if (!element) return;

  closeButton = document.getElementById('popup-close');
  submitButton = document.getElementById('submit-button');

  if (closeButton) {
    closeButton.addEventListener('mousedown', closePopup, false);
    closeButton.addEventListener('touchstart', closePopup, false);
  }

  if (submitButton) {
    submitButton.addEventListener('mousedown', closePopup, false);
    submitButton.addEventListener('touchstart', closePopup, false);
  }

  function closePopup(event: TouchEvent | MouseEvent): void {
    event.preventDefault();

    if (!element) return;
    if (element.style.display === "none") {
      element.style.display = "block";
      return;
    }
    element.style.display = "none";
  }
}