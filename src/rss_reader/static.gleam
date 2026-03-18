import brioche/file
import brioche/server
import gleam/bool
import gleam/javascript/promise
import gleam/string
import rss_reader/utils

pub fn serve_static(
  req: server.Request,
  prefix: String,
  directory: String,
  next: fn() -> promise.Promise(server.Response),
) -> promise.Promise(server.Response) {
  use <- bool.lazy_guard(
    when: req.path |> string.starts_with(prefix),
    otherwise: next,
  )

  let path = directory <> req.path |> string.drop_start(string.length(prefix))
  serve_file(path)
}

fn serve_file(path: String) -> promise.Promise(server.Response) {
  let static_file = file.new(path)

  use exists <- promise.map(file.exists(static_file))

  case exists {
    Ok(True) -> static_file |> server.file_response(200)
    Ok(False) | Error(_) -> utils.not_found_response()
  }
}
