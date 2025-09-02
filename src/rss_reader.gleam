import gleam/dict
import gleam/dynamic/decode
import gleam/http/request
import gleam/list
import gleam/option
import gleam/result
import glisse
import lustre
import lustre/attribute
import lustre/effect
import lustre/element
import lustre/element/html
import lustre/element/keyed
import lustre/event
import plinth/javascript/console
import rss_reader/feeds
import rss_reader/utils
import rsvp

const default_urls = []

pub type Model {
  Model(
    feed_urls: List(String),
    feed_items: dict.Dict(String, List(glisse.RssItem)),
  )
}

pub type Msg {
  FeedsLoaded(List(String))
  AddFeed
  RemoveFeed(String)
  FetchFeed(String)
  FeedReceived(String, List(glisse.RssItem))
  OnError(String)
}

pub fn main() {
  let app = lustre.application(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", default_urls)

  Nil
}

fn init(init_state: List(String)) -> #(Model, effect.Effect(Msg)) {
  #(
    Model(feed_urls: init_state, feed_items: dict.new()),
    effect.from(fn(dispatch) {
      case feeds.get() {
        Error(err) -> dispatch(OnError(err))
        Ok(urls) -> dispatch(FeedsLoaded(urls))
      }
    }),
  )
}

fn update(model: Model, msg: Msg) -> #(Model, effect.Effect(Msg)) {
  case msg {
    FeedsLoaded(urls) -> {
      #(
        Model(..model, feed_urls: urls),
        effect.batch(
          urls
          |> list.map(fn(url) { utils.dispatch(FetchFeed(url)) }),
        ),
      )
    }
    AddFeed -> {
      utils.get_value_from_id("feed-url")
      |> result.map(fn(feed) {
        let new_urls = [feed, ..model.feed_urls]
        let effect = {
          use dispatch <- effect.from()
          case feeds.set(new_urls) {
            Error(err) -> dispatch(OnError(err))
            Ok(_) -> dispatch(FetchFeed(feed))
          }
        }
        #(Model(..model, feed_urls: new_urls), effect)
      })
      |> result.unwrap(#(model, effect.none()))
    }
    RemoveFeed(feed) -> {
      let urls = model.feed_urls |> list.filter(fn(url) { url != feed })
      let items = dict.delete(model.feed_items, feed)
      let effect = {
        use dispatch <- effect.from()
        case feeds.set(urls) {
          Error(err) -> dispatch(OnError(err))
          Ok(_) -> Nil
        }
      }
      #(Model(feed_urls: urls, feed_items: items), effect)
    }
    FetchFeed(url) -> #(model, fetch_feed(url, FeedReceived))
    FeedReceived(url, items) -> #(
      Model(..model, feed_items: dict.insert(model.feed_items, url, items)),
      effect.none(),
    )
    OnError(err) -> {
      #(model, effect.from(fn(_) { console.error(err) }))
    }
  }
}

fn view(model: Model) -> element.Element(Msg) {
  html.div([], [
    keyed.div([], {
      use url <- list.map(model.feed_urls)
      let el = {
        html.div([event.on("load", decode.success(FetchFeed(url)))], [
          html.h2([], [
            html.text(url),
            html.button([event.on_click(FetchFeed(url))], [html.text("Reload")]),
            html.button([event.on_click(RemoveFeed(url))], [html.text("Delete")]),
          ]),
          html.ul([], {
            let items = dict.get(model.feed_items, url) |> result.unwrap([])
            use item <- list.map(items)

            html.li([], [
              html.a(
                option.map(item.link, fn(l) { [attribute.href(l)] })
                  |> option.unwrap([]),
                [html.text(item.title |> option.unwrap("No title"))],
              ),
              html.p([], [html.text(item.description |> option.unwrap(""))]),
            ])
          }),
        ])
      }

      #(url, el)
    }),
    html.div([], [
      html.input([attribute.id("feed-url")]),
      html.button([event.on_click(AddFeed)], [html.text("Add Feed")]),
    ]),
  ])
}

fn fetch_feed(
  url: String,
  on_response: fn(String, List(glisse.RssItem)) -> Msg,
) -> effect.Effect(Msg) {
  case request.to(url) {
    Error(_) ->
      effect.from(fn(dispatch) { dispatch(OnError("Invalid URL: " <> url)) })
    Ok(req) -> {
      let handler = {
        use resp <- rsvp.expect_ok_response()
        resp
        |> result.map_error(rsvp_error)
        |> result.try(fn(resp) { glisse.parse_rss(resp.body) })
        |> result.map(fn(doc) { on_response(url, doc.channel.items) })
        |> result.map_error(OnError)
        |> result.unwrap_both()
      }

      console.log("Fetching feed from " <> url)
      rsvp.send(req, handler)
    }
  }
}

fn rsvp_error(error: rsvp.Error) -> String {
  case error {
    rsvp.BadBody -> "Bad response body"
    rsvp.BadUrl(url) -> "Bad URL: " <> url
    rsvp.HttpError(_) -> "HTTP error"
    rsvp.JsonError(_) -> "Json error"
    rsvp.NetworkError -> "Network error"
    rsvp.UnhandledResponse(_) -> "Response not handled"
  }
}
