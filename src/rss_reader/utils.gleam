import brioche/server
import gleam/dict
import gleam/javascript/promise
import gleam/list
import gleam/option
import gleam/string
import gleam/uri
import rss_reader/node

pub fn await_or_err(
  promise: promise.Promise(Result(a, b)),
  err: c,
  callback: fn(a) -> promise.Promise(Result(d, c)),
) -> promise.Promise(Result(d, c)) {
  promise.await(promise, fn(res) {
    case res {
      Error(e) -> {
        node.console_error("Error: " <> string.inspect(e))
        promise.resolve(Error(err))
      }
      Ok(v) -> callback(v)
    }
  })
}

pub fn await_with_timeout(
  promise: promise.Promise(Result(a, b)),
  timeout_ms: Int,
  err: b,
) -> promise.Promise(Result(a, b)) {
  let timeout_promise =
    promise.wait(timeout_ms) |> promise.map(fn(_) { Error(err) })

  promise.race_list([promise, timeout_promise])
}

pub fn opt_map_or(opt: option.Option(a), or: b, f: fn(a) -> b) -> b {
  case opt {
    option.Some(v) -> f(v)
    option.None -> or
  }
}

pub fn res_map_or(res: Result(a, c), or: b, f: fn(a) -> b) -> b {
  case res {
    Ok(v) -> f(v)
    Error(_) -> or
  }
}

pub fn query_dict(request: server.Request) -> dict.Dict(String, String) {
  use query <- opt_map_or(request.query, dict.new())
  use query_elts <- res_map_or(uri.parse_query(query), dict.new())
  use acc, kv <- list.fold(query_elts, dict.new())

  acc
  |> dict.upsert(kv.0, fn(old) {
    case old {
      option.Some(v) -> v <> "," <> kv.1
      option.None -> kv.1
    }
  })
}

pub fn not_found_response() -> server.Response {
  server.response(404) |> server.text_body("Not Found")
}
