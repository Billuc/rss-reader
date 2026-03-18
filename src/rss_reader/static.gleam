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
  use <- bool.lazy_guard(string.starts_with(req.path, prefix), next)

  let path = directory <> req.path |> string.drop_start(string.length(prefix))
  serve_file(path)
}

fn serve_file(path: String) -> promise.Promise(server.Response) {
  let static_file = file.new(path)

  use exists_res <- promise.map(file.exists(static_file))
  use exists <- utils.res_map_or(exists_res, utils.not_found_response())
  use <- bool.guard(exists, utils.not_found_response())

  static_file |> server.file_response(200)
}
