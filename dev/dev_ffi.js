import * as $gleam from "./gleam.mjs";
import { debounce } from "jsr:@std/async/debounce";

export async function deno_watch(path, initialCtx, onEvent) {
  let watcher = Deno.watchFs(path);
  let context = initialCtx;

  const onEventDebounced = debounce(async (ev) => {
    context = await onEvent(context, ev);

    if (context.continue === false) {
      watcher.close();
    }
  }, 500);

  for await (const event of watcher) {
    await onEventDebounced(event);
  }
}

export function deno_spawn(args) {
  try {
    const [cmd, ...rest] = [...args];

    const command = new Deno.Command(cmd, {
      args: rest,
    });
    const child = command.spawn();
    return new $gleam.Ok(child);
  } catch (error) {
    return new $gleam.Error(error.message);
  }
}

export async function deno_kill_process(process) {
  try {
    process.kill("SIGTERM");
    await process.status;
    return new $gleam.Ok();
  } catch (error) {
    return new $gleam.Error(error.message);
  }
}

export async function deno_wait_process(process) {
  try {
    await process.output();
    return new $gleam.Ok();
  } catch (error) {
    return new $gleam.Error(error.message);
  }
}
