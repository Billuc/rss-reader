import gleam/float
import gleam/int
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

pub fn view(
  base: String,
  urls: List(String),
  errors: List(String),
) -> element.Element(Nil) {
  html.html([], [
    html.head([], [
      html.base([attribute.href(base <> "/")]),
      html.meta([attribute.charset("UTF-8")]),
      html.meta([
        attribute.name("viewport"),
        attribute.content("width=device-width, initial-scale=1.0"),
      ]),
      html.link([
        attribute.rel("icon"),
        attribute.type_("image/x-icon"),
        attribute.href("./static/favicon.ico"),
      ]),
      html.title([], "RSS Reader"),
      html.link([
        attribute.rel("stylesheet"),
        attribute.href("./static/styles.css"),
      ]),
      html.script([attribute.src("./static/rss_reader.js")], "")
    ]),
    html.body([], [
      html.iframe([
        attribute.hidden(True),
        attribute.name("htmz"),
        attribute.attribute(
          "onload",
 "setTimeout(()=>document.querySelector(contentWindow.location.hash||null)?.replaceWith(...contentDocument.body.childNodes))",
        ),
      ]),
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
        use url, i <- list.index_map(urls)
        let id = "item" <> int.to_string(i)
        #(
          url,
          html.form(
            [
              attribute.id(id),
              attribute.target("htmz"),
              attribute.action("./items#" <> id),
              attribute.class("feed-container"),
            ],
            [
                html.input([attribute.type_("hidden"), attribute.name("feed-url"), attribute.value(url)]),
                html.div([], [html.span([attribute.class("loader")], [])])
            ],
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
