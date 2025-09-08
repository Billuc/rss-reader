import gleam/dict
import gleam/fetch
import gleam/http/request
import gleam/javascript/promise
import gleam/list
import gleam/result
import gleam/string
import glisse
import lustre/element
import rss_reader/aws
import rss_reader/node
import rss_reader/utils
import rss_reader/view

pub fn handler(event) {
  node.console_log("Received event: " <> string.inspect(event))
  let ev = aws.decode_event(event)

  let res = case ev {
    Error(e) -> {
      node.console_error(e)

      view.view([], [e])
      |> element.to_document_string()
      |> aws.html_response()
      |> aws.return()
      |> promise.resolve()
    }
    Ok(ev) -> {
      case ev.request_context.http.path {
        "/" -> {
          let urls =
            ev.query_string_parameters
            |> dict.get("feed-url[]")
            |> result.unwrap("")
            |> string.split(",")
            |> list.filter(fn(s) { string.trim(s) != "" })

          view.view(urls, [])
          |> element.to_document_string()
          |> aws.html_response()
          |> aws.return()
          |> promise.resolve()
        }
        "/items" -> {
          let url =
            ev.query_string_parameters
            |> dict.get("feed-url")
            |> result.unwrap("")

          fetch_feed(url)
          |> promise.map(fn(res) {
            case res {
              Ok(feed) -> view.feed_view(feed)
              Error(e) -> view.error_view(e)
            }
            |> element.to_string()
            |> aws.html_response()
            |> aws.return()
          })
        }
        _ ->
          aws.html_response("Not found")
          |> aws.status_code(404)
          |> aws.return()
          |> promise.resolve()
      }
    }
  }

  promise.tap(res, fn(res) {
    node.console_log("Returning response: " <> string.inspect(res))
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
