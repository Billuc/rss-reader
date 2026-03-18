import gleam/javascript/promise
import gleam/result
import rss_reader/node

type DevContext {
  DevContext(command: List(String), child_proc: ChildProcess, continue: Bool)
}

pub fn start_watcher(command: List(String)) -> Nil {
  node.console_log("Starting watcher...")

  case start_server(command) {
    Ok(child_proc) -> {
      watch("./src", DevContext(command, child_proc, True), on_event)
      Nil
    }
    Error(e) -> {
      node.console_error("Failed to start server: " <> e)
    }
  }

  Nil
}

fn on_event(ctx: DevContext, _event) -> promise.Promise(DevContext) {
  node.console_log("Changes detected, rebuilding...")

  use restart_res <- promise.await(rebuild_and_restart(ctx))
  case restart_res {
    Ok(new_ctx) -> promise.resolve(new_ctx)
    Error(_) -> graceful_shutdown(ctx)
  }
}

fn rebuild_and_restart(
  ctx: DevContext,
) -> promise.Promise(Result(DevContext, Nil)) {
  use _ <- promise.try_await(rebuild())
  node.console_log("Rebuild succeeded ! Restarting server...")
  use child_proc <- promise.map_try(restart_server(ctx))
  Ok(DevContext(ctx.command, child_proc, True))
}

fn rebuild() -> promise.Promise(Result(Nil, Nil)) {
  case spawn(["gleam", "build"]) {
    Ok(process) -> {
      wait_process(process)
      |> promise.map(fn(res) {
        res
        |> result.map_error(fn(e) {
          node.console_error("Build failed: " <> e)
          Nil
        })
      })
    }
    Error(e) -> {
      node.console_error("Build spawn failed: " <> e)
      Error(Nil) |> promise.resolve()
    }
  }
}

fn restart_server(ctx: DevContext) -> promise.Promise(Result(ChildProcess, Nil)) {
  use kill_res <- promise.map(kill_process(ctx.child_proc))

  case kill_res {
    Error(e) -> {
      node.console_error("Failed to kill process: " <> e)
      Error(Nil)
    }
    Ok(_) -> {
      node.console_log("Process killed. Starting new server...")

      case start_server(ctx.command) {
        Ok(new_proc) -> Ok(new_proc)
        Error(e) -> {
          node.console_error("Failed to start new server: " <> e)
          Error(Nil)
        }
      }
    }
  }
}

fn graceful_shutdown(ctx: DevContext) -> promise.Promise(DevContext) {
  node.console_error("Failed to restart server. Shutting down.")

  use kill_res <- promise.map(kill_process(ctx.child_proc))

  case kill_res {
    Ok(_) -> node.console_log("Server shutdown completed.")
    Error(e) -> node.console_error("Also failed to kill process: " <> e)
  }

  DevContext(ctx.command, ctx.child_proc, False)
}

fn start_server(command: List(String)) -> Result(ChildProcess, String) {
  command |> spawn()
}

type ChildProcess

@external(javascript, "../dev_ffi.js", "watch_dir")
fn watch(
  path: String,
  initial_ctx: ctx,
  callback: fn(ctx, event) -> promise.Promise(ctx),
) -> promise.Promise(Nil)

@external(javascript, "../dev_ffi.js", "spawn")
fn spawn(args: List(String)) -> Result(ChildProcess, String)

@external(javascript, "../dev_ffi.js", "kill_process")
fn kill_process(process: ChildProcess) -> promise.Promise(Result(Nil, String))

@external(javascript, "../dev_ffi.js", "wait_process")
fn wait_process(process: ChildProcess) -> promise.Promise(Result(Nil, String))
