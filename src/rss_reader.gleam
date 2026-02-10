import gleam/dict
import gleam/fetch
import gleam/http
import gleam/http/request
import gleam/int
import gleam/javascript/promise
import gleam/list
import gleam/result
import gleam/string
import glen
import glisse
import lustre/element
import rss_reader/node
import rss_reader/utils
import rss_reader/view

pub fn main() {
  glen.serve(3002, handler)
}

pub fn handler(req: glen.Request) -> promise.Promise(glen.Response) {
  node.console_log(
    "RECV " <> req.method |> http.method_to_string() <> " " <> req.path,
  )

  use <- glen.static(req, "/static", "./dist/static")

  let res = case req.path {
    "/" -> {
      let urls =
        req
        |> utils.query_dict
        |> dict.get("feed-url[]")
        |> result.unwrap("")
        |> string.split(",")
        |> list.filter(fn(s) { string.trim(s) != "" })

      view.view(urls, [])
      |> element.to_document_string()
      |> glen.html(200)
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

      case res {
        Ok(feed) -> view.feed_view(feed)
        Error(e) -> view.error_view(e)
      }
      |> element.to_string()
      |> glen.html(200)
    }
    _ -> glen.text("Not found", 404) |> promise.resolve()
  }

  promise.tap(res, fn(res) {
    node.console_log("SENT " <> int.to_string(res.status) <> " " <> req.path)
  })
  res
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
