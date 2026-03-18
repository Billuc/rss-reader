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

const feed_inputs_id = "feed-inputs"

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
      html.script(
        [
          attribute.src(
            "https://cdn.jsdelivr.net/npm/htmx.org@2.0.6/dist/htmx.min.js",
          ),
          attribute.crossorigin("anonymous"),
        ],
        "",
      ),
      html.link([
        attribute.rel("stylesheet"),
        attribute.href("./static/styles.css"),
      ]),
      html.script([attribute.src("./static/rss_reader.js")], ""),
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
        use url, i <- list.index_map(urls)
        let id = "item" <> int.to_string(i)
        #(
          id,
          feed_loader(url, "load", [
            html.div([], [html.span([attribute.class("loader")], [])]),
          ]),
        )
      }),
      html.footer([], [
        html.text("Developed by "),
        html.a([attribute.href("https://billuc.github.io")], [
          html.text("Luc Billaud"),
        ]),
        html.text(" using Gleam, Lustre, Brioche and Bun."),
      ]),
      theme_toggle_button(),
    ]),
  ])
}

fn feed_loader(
  url: String,
  trigger: String,
  children: List(element.Element(Nil)),
) -> element.Element(Nil) {
  html.div(
    [
      attribute.attribute("hx-get", "./items?feed-url=" <> url),
      attribute.attribute("hx-trigger", trigger),
      attribute.attribute("hx-target", "this"),
      attribute.attribute("hx-swap", "outerHTML"),
      attribute.class("feed-container"),
    ],
    children,
  )
}

pub fn feed_result_view(
  url: String,
  result: Result(glisse.RssDocument, String),
) -> element.Element(Nil) {
  let children = case result {
    Ok(feed) -> [feed_view(feed)]
    Error(e) -> [error_view(e), reload_button()]
  }

  feed_loader(url, "click from:find .reload", children)
}

fn feed_view(feed: glisse.RssDocument) -> element.Element(Nil) {
  html.div([attribute.class("feed")], [
    html.h2([], [
      html.a([attribute.href(feed.channel.link)], [
        html.text(feed.channel.title),
      ]),
      reload_button(),
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

fn reload_button() {
  html.button(
    [
      attribute.aria_label("Reload"),
      attribute.type_("submit"),
      attribute.class("reload"),
    ],
    [icons.rotate_cw([])],
  )
}

pub fn error_view(error: String) -> element.Element(Nil) {
  html.p([attribute.style("color", "red")], [html.text(error)])
}

fn feed_inputs_view(initial_values: List(String)) -> element.Element(Nil) {
  html.details([attribute.class("sources")], [
    html.summary(
      [attribute.styles([#("font-weight", "bold"), #("opacity", "0.6")])],
      [html.text("Sources")],
    ),
    html.form([attribute.method("GET"), attribute.action("/")], {
      [
        source_inputs(initial_values),
        add_feed_button(),
        html.input([
          attribute.type_("submit"),
          attribute.value("Save"),
          attribute.style("vertical-align", "bottom"),
        ]),
      ]
    }),
  ])
}

fn add_feed_button() {
  html.button(
    [
      attribute.attribute("onclick", "addFeedInput('" <> feed_inputs_id <> "')"),
      attribute.type_("button"),
      attribute.style("margin-right", "0.5em"),
      attribute.aria_label("Add Feed"),
    ],
    [icons.plus([])],
  )
}

fn source_inputs(feed_urls: List(String)) -> element.Element(_) {
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
  })
}

fn theme_toggle_button() -> element.Element(Nil) {
  html.button(
    [
      attribute.id("theme-toggle"),
      attribute.attribute("onclick", "toggleTheme()"),
      attribute.aria_label("Toggle Theme"),
    ],
    [
      icons.sun_moon([
        attribute.styles([#("width", "1.5em"), #("height", "1.5em")]),
      ]),
    ],
  )
}
