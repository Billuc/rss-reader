export function consoleLog(message) {
  console.log(message);
}

export function consoleError(message) {
  console.error(message);
}

export function uuid() {
  return crypto.randomUUID();
}