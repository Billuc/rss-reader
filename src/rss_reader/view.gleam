import gleam/list
import gleam/option
import gleam/string
import glisse
import lustre/attribute
import lustre/element
import lustre/element/html
import lustre/element/keyed

pub fn view(urls: List(String), errors: List(String)) -> element.Element(Nil) {
  html.html([], [
    html.head([], [
      html.script(
        [
          attribute.src(
            "https://cdn.jsdelivr.net/npm/htmx.org@2.0.6/dist/htmx.min.js",
          ),
          attribute.crossorigin("anonymous"),
        ],
        "",
      ),
      html.style(
        [],
        "
.loader {
    width: 48px;
    height: 48px;
    border: 5px solid #FFF;
    border-bottom-color: transparent;
    border-radius: 50%;
    display: inline-block;
    box-sizing: border-box;
    animation: rotation 1s linear infinite;
}

@keyframes rotation {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}",
      ),
    ]),
    html.body([], [
      html.div([], [
        html.div([], {
          use error <- list.map(errors)
          error_view(error)
        }),
        feed_inputs_view(),
        keyed.div([], {
          use url <- list.map(urls)
          #(
            url,
            html.div(
              [
                attribute.attribute("hx-get", "/items?feed-url=" <> url),
                attribute.attribute("hx-trigger", "load"),
                attribute.attribute("hx-target", "this"),
              ],
              [html.span([attribute.class("loader")], [])],
            ),
          )
        }),
      ]),
    ]),
  ])
}

pub fn feed_view(feed: glisse.RssDocument) -> element.Element(Nil) {
  html.div([], [
    html.h2([], [html.text(feed.channel.title)]),
    html.div([], {
      use item <- list.map(feed.channel.items)
      let description =
        item.description |> option.unwrap("") |> string.replace("\"", "")

      html.details([], [
        html.summary([], [html.text(item.title |> option.unwrap("No title"))]),
        html.p([], [html.text(description)]),
        html.a(
          option.map(item.link, fn(l) { [attribute.href(l)] })
            |> option.unwrap([]),
          [html.text("Read more")],
        ),
        html.hr([]),
      ])
    }),
  ])
}

pub fn error_view(error: String) -> element.Element(Nil) {
  html.p([attribute.style("color", "red")], [html.text(error)])
}

const feed_inputs_id = "feed-inputs"

fn feed_inputs_view() -> element.Element(Nil) {
  html.div([], [
    html.form([attribute.method("GET"), attribute.action("/")], [
      html.div([attribute.id(feed_inputs_id)], [
        html.input([attribute.name("feed-url[]")]),
      ]),
      html.input([attribute.type_("submit"), attribute.value("Get feeds")]),
    ]),
    ..add_feed_button()
  ])
}

fn add_feed_button() {
  [
    html.button([attribute.attribute("onclick", "addFeedInput()")], [
      html.text("Add Feed"),
    ]),
    html.script([], "
    function addFeedInput() {
      const form = document.getElementById('" <> feed_inputs_id <> "');
      if (form) {
        const input = document.createElement('input');
        input.name = 'feed-url[]';
        form.appendChild(input);
      }
    }
    "),
  ]
}
