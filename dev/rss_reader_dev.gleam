import argv
import brioche/server
import esgleam
import gleam/float
import gleam/io
import gleam/javascript/promise
import gleam/string
import gleam/time/timestamp
import rss_reader
import rss_reader/node
import rss_reader_dev/watcher

pub fn main() {
  let args = argv.load()

  case args.arguments {
    ["bundle"] -> bundle()
    ["_run"] -> {
      start_dev_server()
      Nil
    }
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
  [args.runtime, args.program, "_run"]
}

fn start_dev_server() {
  let start_time = timestamp.system_time() |> timestamp.to_unix_seconds()
  node.console_log("Starting development server on http://localhost:1212")

  server.handler(fn(req, server) {
    use <- with_dev_script()
    rss_reader.handler(req, server, "")
  })
  |> server.static([
    #("/last-updated", server.text_response(float.to_string(start_time))),
  ])
  |> server.port(1212)
  |> server.serve()
}

fn with_dev_script(
  next: fn() -> promise.Promise(server.Response),
) -> promise.Promise(server.Response) {
  use res <- promise.map(next())

  case res.body {
    server.Text(body) -> {
      let new_body = inject_reload_script(body)
      res |> server.set_body(server.Text(new_body))
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
