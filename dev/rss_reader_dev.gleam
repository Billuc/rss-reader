import argv
import esgleam
import gleam/bit_array
import gleam/dict
import gleam/dynamic
import gleam/dynamic/decode
import gleam/http
import gleam/io
import gleam/javascript/promise
import gleam/list
import gleam/option
import gleam/result
import gleam/uri
import glen
import rss_reader
import rss_reader/node

pub fn main() {
  let args = argv.load()

  case args.arguments {
    ["build"] -> build()
    ["run"] -> run_dev_server()
    ["run", "watch"] -> start_watcher()
    _ -> io.println("Usage: gleam dev [build|run]")
  }
}

fn build() {
  let bundle_res =
    esgleam.new(outdir: "./dist")
    |> esgleam.entry("rss_reader.gleam")
    |> esgleam.platform(esgleam.Node)
    |> esgleam.minify(True)
    |> esgleam.bundle()

  case bundle_res {
    Ok(_) -> io.println("Build succeeded")
    Error(_) -> io.println_error("Build failed")
  }
}

type DevContext {
  DevContext(child_proc: ChildProcess, continue: Bool)
}

fn start_watcher() {
  node.console_log("Starting watcher...")

  case start_server() {
    Ok(child_proc) -> {
      watch("./src", DevContext(child_proc, True), on_event)
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

  rebuild()
  |> promise.try_await(fn(_) {
    node.console_log("Rebuild succeeded ! Restarting server...")
    restart_server(ctx)
  })
  |> promise.map_try(fn(child_proc) { Ok(DevContext(child_proc, True)) })
  |> promise.await(fn(restart_res) {
    case restart_res {
      Ok(new_ctx) -> promise.resolve(new_ctx)
      Error(_) -> graceful_shutdown(ctx)
    }
  })
}

fn rebuild() -> promise.Promise(Result(Nil, Nil)) {
  case deno_spawn(["gleam", "build"]) {
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

      case start_server() {
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

  DevContext(ctx.child_proc, False)
}

fn run_dev_server() {
  node.console_log("Starting development server on http://localhost:1212")
  glen.serve(1212, glen_handler)
}

fn start_server() -> Result(ChildProcess, String) {
  let args = argv.load()

  // TODO: make cleaner
  // Did it that way because gleam dev run doesn't catch signals :/
  [args.runtime, "--allow-all", args.program, "run"]
  |> deno_spawn()
}

fn glen_handler(request: glen.Request) -> promise.Promise(glen.Response) {
  request_to_event(request)
  |> promise.await(rss_reader.handler)
  |> promise.map(response_to_glen)
}

fn request_to_event(request: glen.Request) -> promise.Promise(dynamic.Dynamic) {
  use body <- promise.map(glen.read_text_body(request))
  let body = body |> result.unwrap("")
  let query_string = request.query |> option.unwrap("")
  dynamic.properties([
    #(dynamic.string("version"), dynamic.string("2.0")),
    #(dynamic.string("rawPath"), dynamic.string(request.path)),
    #(dynamic.string("rawQueryString"), dynamic.string(query_string)),
    #(dynamic.string("cookies"), dynamic.list([])),
    #(dynamic.string("headers"), dynamic.properties([])),
    #(
      dynamic.string("queryStringParameters"),
      query_to_properties(query_string),
    ),
    #(dynamic.string("requestContext"), request |> to_context()),
    #(dynamic.string("body"), dynamic.string(body)),
    #(dynamic.string("isBase64Encoded"), dynamic.bool(False)),
  ])
}

fn to_context(request: glen.Request) -> dynamic.Dynamic {
  dynamic.properties([
    #(dynamic.string("accountId"), dynamic.string("test")),
    #(dynamic.string("apiId"), dynamic.string("test")),
    #(dynamic.string("domainName"), dynamic.string("localhost")),
    #(dynamic.string("domainPrefix"), dynamic.string("test")),
    #(dynamic.string("http"), {
      dynamic.properties([
        #(
          dynamic.string("method"),
          dynamic.string(http.method_to_string(request.method)),
        ),
        #(dynamic.string("path"), dynamic.string(request.path)),
        #(dynamic.string("protocol"), dynamic.string("HTTP/1.1")),
        #(dynamic.string("sourceIp"), dynamic.string("test")),
        #(dynamic.string("userAgent"), dynamic.string("test")),
      ])
    }),
    #(dynamic.string("requestId"), dynamic.string("local-request")),
    #(dynamic.string("time"), dynamic.string("local-time")),
    #(dynamic.string("timeEpoch"), dynamic.int(0)),
  ])
}

fn query_to_properties(query: String) -> dynamic.Dynamic {
  query
  |> uri.parse_query
  |> result.unwrap([])
  |> list.fold(dict.new(), fn(acc, kv) {
    dict.upsert(acc, kv.0, fn(old) {
      case old {
        option.Some(v) -> v <> "," <> kv.1
        option.None -> kv.1
      }
    })
  })
  |> dict.to_list()
  |> list.map(fn(kv) { #(dynamic.string(kv.0), dynamic.string(kv.1)) })
  |> dynamic.properties
}

fn response_to_glen(dynamic: dynamic.Dynamic) -> glen.Response {
  let decoder = {
    use status_code <- decode.field("statusCode", decode.int)
    use headers <- decode.field(
      "headers",
      decode.dict(decode.string, decode.string),
    )
    use body <- decode.field("body", decode.string)
    use is_base64_encoded <- decode.field("isBase64Encoded", decode.bool)

    case make_glen_body(body, is_base64_encoded) {
      Error(_) -> decode.failure(glen.response(500), "Failed to decode body")
      Ok(glen_body) -> {
        let response =
          glen.response(status_code)
          |> glen.set_body(glen_body)

        let response =
          list.fold(headers |> dict.to_list(), response, fn(resp, header) {
            resp |> glen.set_header(header.0, header.1)
          })

        decode.success(response)
      }
    }
  }

  decode.run(dynamic, decoder)
  |> result.unwrap(glen.response(500))
}

fn make_glen_body(
  body: String,
  is_base64_encoded: Bool,
) -> Result(glen.ResponseBody, Nil) {
  case is_base64_encoded {
    True -> bit_array.base64_decode(body) |> result.map(glen.Bits)
    False -> Ok(glen.Text(body))
  }
}

type ChildProcess

@external(javascript, "./dev_ffi.js", "deno_watch")
fn watch(
  path: String,
  initial_ctx: ctx,
  callback: fn(ctx, event) -> promise.Promise(ctx),
) -> promise.Promise(Nil)

@external(javascript, "./dev_ffi.js", "deno_spawn")
fn deno_spawn(args: List(String)) -> Result(ChildProcess, String)

@external(javascript, "./dev_ffi.js", "deno_kill_process")
fn kill_process(process: ChildProcess) -> promise.Promise(Result(Nil, String))

@external(javascript, "./dev_ffi.js", "deno_wait_process")
fn wait_process(process: ChildProcess) -> promise.Promise(Result(Nil, String))
