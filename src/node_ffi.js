import * as fs from "node:fs";

export function consoleLog(message) {
  console.log(message);
}

export function consoleError(message) {
  console.error(message);
}

export function readFileSync(path) {
  return fs.readFileSync(path);
}
