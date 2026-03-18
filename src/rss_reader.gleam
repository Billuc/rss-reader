import brioche
import brioche/server
import envoy
import gleam/dict
import gleam/fetch
import gleam/http
import gleam/http/request
import gleam/int
import gleam/javascript/promise
import gleam/list
import gleam/result
import gleam/string
import glisse
import lustre/element
import rss_reader/node
import rss_reader/static
import rss_reader/utils
import rss_reader/view

pub fn main() {
  let port = envoy.get("PORT") |> result.try(int.parse) |> result.unwrap(3002)
  let base = envoy.get("BASE") |> result.unwrap("/") |> sanitize_base

  node.console_log(
    "Starting server on port " <> int.to_string(port) <> " with base " <> base,
  )

  server.handler(fn(req, server) { handler(req, server, base) })
  |> server.port(port)
  |> server.serve()
}

pub fn handler(
  req: server.Request,
  _server: brioche.Server(_),
  base: String,
) -> promise.Promise(server.Response) {
  use <- log_request(req)
  use req <- check_base(req, base)
  use <- static.serve_static(req, "/static", "./dist/static")

  case req.path {
    "/" -> {
      let urls =
        req
        |> utils.query_dict
        |> dict.get("feed-url[]")
        |> result.unwrap("")
        |> string.split(",")
        |> list.filter(fn(s) { string.trim(s) != "" })

      view.view(base, urls, [])
      |> element.to_document_string()
      |> server.html_response(200)
      |> promise.resolve()
    }
    "/items" -> {
      let url =
        req
        |> utils.query_dict()
        |> dict.get("feed-url")
        |> result.unwrap("")

      use res <- promise.map(
        fetch_feed(url)
        |> utils.await_with_timeout(3000, "Timeout fetching URL: " <> url),
      )

      view.feed_result_view(url, res)
      |> element.to_string()
      |> server.html_response(200)
    }
    _ -> utils.not_found_response() |> promise.resolve()
  }
}

fn sanitize_base(base: String) -> String {
  case string.ends_with(base, "/") {
    True -> string.drop_end(base, 1)
    False -> base
  }
}

fn log_request(
  req: server.Request,
  next: fn() -> promise.Promise(server.Response),
) -> promise.Promise(server.Response) {
  let uuid = node.uuid()
  node.console_log(
    uuid
    <> " - RECV "
    <> req.method |> http.method_to_string()
    <> " "
    <> req.path,
  )

  use res <- promise.map(next())

  node.console_log(
    uuid <> " - SENT " <> int.to_string(res.status) <> " " <> req.path,
  )
  res
}

fn check_base(
  req: server.Request,
  base: String,
  next: fn(server.Request) -> promise.Promise(server.Response),
) -> promise.Promise(server.Response) {
  case string.starts_with(req.path, base) {
    True -> {
      let new_path = case string.drop_start(req.path, string.length(base)) {
        "" -> "/"
        p -> p
      }
      next(request.Request(..req, path: new_path))
    }
    False -> utils.not_found_response() |> promise.resolve()
  }
}

fn fetch_feed(
  url: String,
) -> promise.Promise(Result(glisse.RssDocument, String)) {
  case request.to(url) {
    Error(_) -> promise.resolve(Error("Invalid URL: " <> url))
    Ok(req) -> {
      node.console_log("Fetching feed from " <> url)
      use resp <- utils.await_or_err(
        fetch.send(req),
        "Error fetching URL: " <> url,
      )
      use resp <- utils.await_or_err(
        fetch.read_text_body(resp),
        "Error reading response body from URL: " <> url,
      )

      promise.resolve(glisse.parse_rss(resp.body))
    }
  }
}
