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
body {
    background: antiquewhite;
    font-family: \"Georgia\", serif;
}

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

.feed {}

.feed h2 {
  text-transform: uppercase;
  display: flex;
  align-items: end;
}

.feed h2 span {
  max-width: 30ch;
}

.feed h2 div {
  flex-grow: 1;
  border-bottom: 2px solid #888;
  margin-left: 0.5em;
}

.feed-items {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1em;
}

.feed-items .feed-item:first-of-type {
  grid-area: span 2 / span 2;
}

.item-description {
  font-size: smaller;
}
",
      ),
    ]),
    html.body([], [
      html.h1([attribute.style("text-align", "center")], [
        html.text("RSS Reader"),
      ]),
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
  html.div([attribute.class("feed")], [
    html.h2([], [
      html.span([], [html.text(feed.channel.title)]),
      html.div([], []),
    ]),
    html.div([attribute.class("feed-items")], {
      use item <- list.map(feed.channel.items)
      let description =
        item.description |> option.unwrap("") |> string.replace("\"", "")

      html.div([attribute.class("feed-item")], [
        html.h3([attribute.class("item-title")], [
          html.text(item.title |> option.unwrap("No title")),
        ]),
        html.p([attribute.class("item-description")], [
          html.text(description),
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
