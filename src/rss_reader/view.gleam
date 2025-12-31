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
import rss_reader/icons

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
:root {
  --bg-color: seashell;
  --text-color: #222222;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-color: #222222;
    --text-color: seashell;
  }
}

[data-theme=\"dark\"] {
  --bg-color: #222222;
  --text-color: seashell;
}

[data-theme=\"light\"] {
  --bg-color: seashell;
  --text-color: #222222;
}

body {
  background: var(--bg-color);
  color: var(--text-color);
  transition: background 0.3s, color 0.3s;
  font-family: serif;
  margin: 0;
  padding: 1rem 6rem;
}

a {
  color: coral;
}

.loader {
    width: 24px;
    height: 24px;
    border: 3px solid currentColor;
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
  height: calc(100vh - 12rem);
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
  color: color-mix(in oklab, currentColor 75%, coral);
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
  opacity: 0.8;
  padding-left: 1em;
}

header {
  font-family: \"Verdana\", sans-serif;
}

header h1 {
  margin: 0 0 0.25rem;
  padding: 0.25rem;
  border-block: 4px double currentColor;
}

header h2 {
  margin: 0.25rem 0;
  padding: 0.5rem;
  font-size: 0.8rem;
  border-bottom: 1px solid currentColor;
  text-transform: uppercase;
}

summary.item-title {
  font-size: 0.9em;
  padding-left: 1em;
  border-left: 2px solid coral;
}

.sources {
  padding: 0.5rem;
  border-bottom: 1px solid color-mix(in oklab, currentColor 20%, transparent);
}

@media (max-width: 600px) {
  body {
    padding: 1rem 2rem;
  }
}

.sources form {
  margin: 1rem 0 0.5rem;
}

#feed-inputs {
  display:flex;
  flex-wrap: wrap;
  gap: 0.25em 0.5em;
  margin-bottom: 0.5em;
}

#feed-inputs > div {
  display: flex;
  align-items: center;
  gap: 0.25em;
}

#feed-inputs input {
  padding: 0.25em 1em 0.25em 0.5em;
  min-width: 200px;
  border-width: 0;
  border-left: 2px solid coral;
  background: color-mix(in oklab, var(--bg-color) 80%, var(--text-color));
  color: currentColor;
  text-overflow: ellipsis;
  flex-shrink: 1;
  min-width: 150px;
}

.sources button:has(svg) {
  font-size: 16px;
  width: 24px;
  height: 24px;
  padding: 4px;
}

.sources button svg {
  width: 1em;
  height: 1em;
}

.sources form input[type=\"submit\"], .sources button {
  border: 0;
  border-radius: 0.5em;
  background: coral;
  cursor: pointer;
  box-shadow: 0 2px 3px #0006;
  padding: 0.2em 0.5em;
  font-size: 14px;
  color: #222222;
}

#theme-toggle {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  background: coral;
  border: none;
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  cursor: pointer;
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
      ..theme_toggle_view()
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
          html.text(description <> " "),
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
    html.summary(
      [attribute.styles([#("font-weight", "bold"), #("opacity", "0.6")])],
      [
        html.text("Sources"),
      ],
    ),
    html.form([attribute.method("GET"), attribute.action("/")], {
      source_inputs(initial_values)
      |> list.append(add_feed_button())
      |> list.append([
        html.input([
          attribute.type_("submit"),
          attribute.value("Save"),
          attribute.style("vertical-align", "bottom"),
        ]),
      ])
    }),
  ])
}

fn add_feed_button() {
  [
    html.button(
      [
        attribute.attribute("onclick", "addFeedInput()"),
        attribute.type_("button"),
        attribute.style("margin-right", "0.5em"),
        attribute.aria_label("Add Feed"),
      ],
      [icons.plus([])],
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

fn source_inputs(feed_urls: List(String)) -> List(element.Element(_)) {
  [
    keyed.div([attribute.id(feed_inputs_id)], {
      use url <- list.map(feed_urls)
      #(
        url,
        html.div([], [
          html.input([attribute.name("feed-url[]"), attribute.value(url)]),
          html.button(
            [
              attribute.aria_label("Move up"),
              attribute.type_("button"),
              attribute.attribute("onclick", "moveFeedUp(event)"),
            ],
            [icons.chevron_up([])],
          ),
          html.button(
            [
              attribute.aria_label("Move down"),
              attribute.type_("button"),

              attribute.attribute("onclick", "moveFeedDown(event)"),
            ],
            [icons.chevron_down([])],
          ),
          html.button(
            [
              attribute.aria_label("Remove"),
              attribute.type_("button"),
              attribute.attribute("onclick", "removeFeed(event)"),
            ],
            [icons.trash_2([])],
          ),
        ]),
      )
    }),
    html.script(
      [],
      "
    function moveFeedUp(event) {
      const button = event.currentTarget;
      const div = button.parentElement;
      const container = div.parentElement;
      if (div.previousElementSibling) {
        container.insertBefore(div, div.previousElementSibling);
      }
    }

    function moveFeedDown(event) {
      const button = event.currentTarget;
      const div = button.parentElement;
      const container = div.parentElement;
      if (div.nextElementSibling) {
        container.insertBefore(div.nextElementSibling, div);
      }
    }

    function removeFeed(event) {
      const button = event.currentTarget;
      const div = button.parentElement;
      const container = div.parentElement;
      container.removeChild(div);
    }
    ",
    ),
  ]
}

fn theme_toggle_view() -> List(element.Element(Nil)) {
  [
    html.button(
      [
        attribute.id("theme-toggle"),
        attribute.attribute("onclick", "toggleTheme()"),
        attribute.aria_label("Toggle Theme"),
      ],
      [icons.sun_moon([])],
    ),
    html.script(
      [],
      "
    function toggleTheme() {
      const userPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const currentTheme = document.documentElement.getAttribute('data-theme');
      let newTheme;

      if (!currentTheme) {
        newTheme = userPrefersDark ? 'light' : 'dark';
      } else {
        newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      }

      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    }

    document.addEventListener('DOMContentLoaded', () => {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
      }
    });
    ",
    ),
  ]
}
