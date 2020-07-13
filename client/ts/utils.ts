// This function is used for logging.
export function trace(text: string, target: string) {
  if (text[text.length - 1] === '\n') {
    text = text.substring(0, text.length - 1);
  }
  if (window.performance) {
    var now = (window.performance.now() / 1000).toFixed(3);
    console.log(`${target}: ${text} @${now}`);
  } else {
    console.log(`${target}: ${text}`);
  }
}

// This function is used for alerting
export function alert(text: string, target: string) {
  if (text[text.length - 1] === '\n') {
    text = text.substring(0, text.length - 1);
  }
  if (window.performance) {
    var now = (window.performance.now() / 1000).toFixed(3);
    console.error(`${target}: ${text} @${now}`);
  } else {
    console.error(`${target}: ${text}`);
  }
}
