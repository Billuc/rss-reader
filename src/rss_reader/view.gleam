import gleam/float
import gleam/list
import gleam/option
import gleam/string
import gleam/time/timestamp
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
      html.link([
        attribute.rel("icon"),
        attribute.type_("image/x-icon"),
        attribute.href("/favicon.ico"),
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
  margin: 0;
  padding: 1rem 2rem;
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
    flex: 0 0 auto;
}

@keyframes rotation {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

.feeds {
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-around;
  align-items: flex-start;
  margin-top: 1em;
  column-gap: 2em;
  scroll-snap-type: x mandatory;
  overflow-x: auto;
  height: calc(100vh - 11rem);
}

.feed-container {
  display:contents;
}

.feed {
  width: min(clamp(50%, 400px, 100%), 600px);
  scroll-snap-align: center;
  height: 100%;
  box-sizing: border-box;
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
}

.feed h2 {
  text-transform: uppercase;
  display: flex;
  align-items: end;
  gap: 0.5em;
  margin-top: 0;
  margin-bottom: 1.25em;
  font-size: 1.4em;
}

.feed h2 a {
  color: inherit;
}

.feed-items {
  display: flex;
  flex-direction: column;
  gap: 1.5em;
  overflow-y: auto;
  flex: 1;
}

.feed-items .feed-item:nth-child(even) {
  align-self: flex-end;
}
.feed-items .feed-item:nth-child(odd) {
  align-self: flex-start;
}
.feed-items .feed-item {
  width: 90%;
}

.feed-items .feed-item:first-of-type .item-title {
  font-size: 1.2em;
  width: 100%;
}

.item-description {
  font-size: smaller;
  opacity: 0.7;
  padding-left: 1em;
}

header h1 {
  margin: 0 0 0.25rem;
  padding: 0.25rem;
  border-block: 4px double black;
}

header h2 {
  margin: 0.25rem 0;
  padding: 0.5rem;
  font-weight: normal;
  font-size: 0.8rem;
  border-bottom: 1px solid black;
}

.divider {
  border-bottom: 1px solid #aaa;
  flex-grow: 1;
}

summary.item-title {
  font-size: 0.9em;
  padding-left: 1em;
  border-left: 2px solid coral;
}

.sources {
  margin-inline: 4em;
  padding: 0.5em 1em;
  border-block: 1px solid #0002;
}
@media (max-width: 600px) {
  .sources {
    margin-inline: 1em;
  }
}

.sources form {
  margin: 1em 0 0.5em;
}

#feed-inputs {
  display:flex;
  flex-wrap: wrap;
  gap: 0.25em 0.5em;
  margin-bottom: 0.5em;
}

#feed-inputs input {
  padding: 0.25em 1em 0.25em 0.5em;
  min-width: 200px;
  border-width: 0;
  border-left: 4px solid coral;
  background: floralwhite;
  text-overflow: ellipsis;
}

.sources form input[type=\"submit\"], .sources button {
  border: 0;
  border-radius: 0.5em;
  background: coral;
  cursor: pointer;
  box-shadow: 0 2px 3px #0006;
  padding: 0.2em 0.5em;
  font-size: 14px;
}
",
      ),
    ]),
    html.body([], [
      html.header([], [
        html.h1([attribute.style("text-align", "center")], [
          html.text("RSS Reader"),
        ]),
        html.h2(
          [
            attribute.style("text-align", "center"),
            attribute.data(
              "time",
              timestamp.system_time()
                |> timestamp.to_unix_seconds()
                |> float.to_string(),
            ),
          ],
          [],
        ),
      ]),
      html.div([attribute.style("margin-inline", "1em")], {
        use error <- list.map(errors)
        error_view(error)
      }),
      feed_inputs_view(urls),
      keyed.div([attribute.class("feeds")], {
        use url <- list.map(urls)
        #(
          url,
          html.div(
            [
              attribute.attribute("hx-get", "/items?feed-url=" <> url),
              attribute.attribute("hx-trigger", "load"),
              attribute.attribute("hx-target", "this"),
              attribute.class("feed-container"),
            ],
            [html.span([attribute.class("loader")], [])],
          ),
        )
      }),
    ]),
  ])
}

pub fn feed_view(feed: glisse.RssDocument) -> element.Element(Nil) {
  html.div([attribute.class("feed")], [
    html.h2([], [
      html.a([attribute.href(feed.channel.link)], [
        html.text(feed.channel.title),
      ]),
      html.div([attribute.class("divider")], []),
    ]),
    html.div([attribute.class("feed-items")], {
      use item <- list.map(feed.channel.items)
      let description =
        item.description |> option.unwrap("") |> string.replace("\"", "")

      html.details([attribute.class("feed-item")], [
        html.summary([attribute.class("item-title")], [
          html.text(item.title |> option.unwrap("Untitled")),
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
  html.details([attribute.class("sources")], [
    html.summary([attribute.style("font-weight", "bold")], [
      html.text("Sources"),
    ]),
    html.form([attribute.method("GET"), attribute.action("/")], [
      html.div([attribute.id(feed_inputs_id)], {
        use value <- list.map(initial_values)
        html.input([attribute.name("feed-url[]"), attribute.value(value)])
      }),
      html.input([attribute.type_("submit"), attribute.value("Get feeds")]),
      ..add_feed_button()
    ]),
  ])
}

fn add_feed_button() {
  [
    html.button(
      [
        attribute.attribute("onclick", "addFeedInput()"),
        attribute.type_("button"),
        attribute.style("margin-left", "0.5em"),
      ],
      [html.text("Add Feed")],
    ),
    html.script([], "
    function addFeedInput() {
      const form = document.getElementById('" <> feed_inputs_id <> "');
      if (form) {
        const input = document.createElement('input');
        input.name = 'feed-url[]';
        form.appendChild(input);
      }
    }

    let h2Time = document.querySelector('h2[data-time]');
    h2Time.innerText = new Date(
      parseInt(h2Time.getAttribute('data-time')) * 1000
    ).toLocaleString(navigator.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: 'numeric',
      minute: 'numeric',
    });
    "),
  ]
}
