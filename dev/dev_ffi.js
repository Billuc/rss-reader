import * as $gleam from "./gleam.mjs";
import { watch } from "fs/promises";

export async function watch_dir(path, initialCtx, onEvent) {
  let context = initialCtx;
  let watcher = watch(path, { recursive: true });

  for await (const event of watcher) {
    context = await onEvent(context, event);

    if (context.continue === false) {
      watcher.close();
    }
  }
}

export function spawn(args) {
  try {
    const proc = Bun.spawn({
      cmd: args.toArray(),
      stdout: "inherit",
    });
    return new $gleam.Ok(proc);
  } catch (error) {
    return new $gleam.Error(error.message);
  }
}

/**
 * @param {Bun.Subprocess} process 
 * @returns 
 */
export async function kill_process(process) {
  try {
    process.kill("SIGTERM");
    await process.exited;
    return new $gleam.Ok();
  } catch (error) {
    return new $gleam.Error(error.message);
  }
}

/**
 * @param {Bun.Subprocess} process 
 * @returns 
 */
export async function wait_process(process) {
  try {
    await process.exited;
    return new $gleam.Ok();
  } catch (error) {
    return new $gleam.Error(error.message);
  }
}
