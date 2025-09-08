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
      html.meta([attribute.charset("UTF-8")]),
      html.meta([
        attribute.name("viewport"),
        attribute.content("width=device-width, initial-scale=1.0"),
      ]),
      html.title([], "RSS Reader"),
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
    width: 24px;
    height: 24px;
    border: 3px solid #000;
    border-bottom-color: transparent;
    border-radius: 50%;
    display: inline-block;
    box-sizing: border-box;
    animation: rotation 1s linear infinite;
      margin: 1em;
}

@keyframes rotation {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

      details {
      background: antiquewhite;
        border-bottom: 1px solid black;
      }
      details:first-of-type {
        border-top: 1px solid black;
      }

      details > *:not(summary) {
      margin: 0.25em 1.5em;
      opacity: 0.8;
      }

      summary {
        cursor: pointer;
        padding: 0.5em 1em;
      border-bottom: none;
      font-size: 1.1em;
      }

      details[open] summary {
      border-bottom: 1px solid black;
      }
",
      ),
    ]),
    html.body([attribute.style("font-family", "monospace")], [
      html.div([], [
        html.div([], {
          use error <- list.map(errors)
          error_view(error)
        }),
        feed_inputs_view(urls),
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
      use item <- list.map(feed.channel.items |> list.take(10))
      let description =
        item.description |> option.unwrap("") |> string.replace("\"", "")

      html.details([], [
        html.summary([], [html.text(item.title |> option.unwrap("No title"))]),
        html.div([], [html.text(description)]),
        html.div([], [
          html.a(
            option.map(item.link, fn(l) { [attribute.href(l)] })
              |> option.unwrap([]),
            [html.text("Read more")],
          ),
        ]),
      ])
    }),
  ])
}

pub fn error_view(error: String) -> element.Element(Nil) {
  html.p([attribute.style("color", "red")], [html.text(error)])
}

const feed_inputs_id = "feed-inputs"

fn feed_inputs_view(initial_values: List(String)) -> element.Element(Nil) {
  html.div([], [
    html.form([attribute.method("GET"), attribute.action("/")], [
      html.div([attribute.id(feed_inputs_id)], {
        use value <- list.map(initial_values)
        html.input([attribute.name("feed-url[]"), attribute.value(value)])
      }),
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
