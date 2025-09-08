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
