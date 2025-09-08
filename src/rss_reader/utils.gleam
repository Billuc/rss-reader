import gleam/javascript/promise
import gleam/string
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
