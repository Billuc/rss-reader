import argv
import esgleam
import gleam/float
import gleam/io
import gleam/javascript/promise
import gleam/string
import gleam/time/timestamp
import glen
import rss_reader
import rss_reader/node
import rss_reader_dev/watcher

pub fn main() {
  let args = argv.load()

  case args.arguments {
    ["bundle"] -> bundle()
    ["_run"] -> run_dev_server()
    ["run"] -> watcher.start_watcher(dev_server_command())
    _ -> io.println("Usage: gleam dev [bundle|run]")
  }
}

fn bundle() {
  let bundle_res =
    esgleam.new(outdir: "./dist")
    |> esgleam.entry("rss_reader.gleam")
    |> esgleam.platform(esgleam.Node)
    |> esgleam.minify(True)
    |> esgleam.kind(esgleam.Script)
    |> esgleam.bundle()

  case bundle_res {
    Ok(_) -> io.println("Build succeeded")
    Error(err) -> {
      io.println_error("Build failed")
      io.println_error(err)
    }
  }
}

fn dev_server_command() -> List(String) {
  let args = argv.load()

  // TODO: make cleaner
  // Did it that way because gleam dev run doesn't catch signals :/
  [args.runtime, "--allow-all", args.program, "_run"]
}

fn run_dev_server() {
  let start_time = timestamp.system_time() |> timestamp.to_unix_seconds()
  node.console_log("Starting development server on http://localhost:1212")

  glen.serve(1212, fn(req) {
    use <- handle_last_updated(req, start_time)
    use <- with_dev_script()
    rss_reader.handler(req, "")
  })
}

fn handle_last_updated(
  req: glen.Request,
  start_time: Float,
  next: fn() -> promise.Promise(glen.Response),
) -> promise.Promise(glen.Response) {
  case glen.path_segments(req) {
    ["last-updated"] ->
      glen.response(200)
      |> glen.set_body(glen.Text(float.to_string(start_time)))
      |> promise.resolve()
    _ -> next()
  }
}

fn with_dev_script(
  next: fn() -> promise.Promise(glen.Response),
) -> promise.Promise(glen.Response) {
  use res <- promise.map(next())

  case res.body {
    glen.Text(body) -> {
      let new_body = inject_reload_script(body)
      res |> glen.set_body(glen.Text(new_body))
    }
    _ -> res
  }
}

fn inject_reload_script(body: String) -> String {
  case string.split_once(body, "</head>") {
    Error(_) -> body
    Ok(#(before, after)) -> {
      before <> "<script>
            let serverStartTime = undefined;

            setInterval(() => {
              fetch('/last-updated')
                .then(response => response.text())
                .then((data) => {
                  if (!serverStartTime) {
                    serverStartTime = parseFloat(data);
                  } else {
                    const newStartTime = parseFloat(data);
                    if (newStartTime !== serverStartTime) {
                      console.log('Changes detected on server. Reloading page...');
                      window.location.reload();
                    }
                  }
                });
            }, 1000);
            </script>" <> "</head>" <> after
    }
  }
}
