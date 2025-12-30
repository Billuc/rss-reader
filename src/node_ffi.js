import * as fs from "node:fs";
import * as $gleam from "./gleam.mjs";

export function consoleLog(message) {
  console.log(message);
}

export function consoleError(message) {
  console.error(message);
}

export function readFileSync(path) {
  try {
    return new $gleam.Ok(fs.readFileSync(path, { encoding: "utf8" }));
  } catch (e) {
    return new $gleam.Error(e.message);
  }
}

export function readBase64FileSync(path) {
  try {
    return new $gleam.Ok(fs.readFileSync(path, { encoding: "base64" }));
  } catch (e) {
    return new $gleam.Error(e.message);
  }
}
