import gleam/list
import gleam/result
import gleam/string
import plinth/javascript/storage

pub fn get() {
  case storage.local() {
    Error(_) -> Error("Local storage not available")
    Ok(store) -> {
      storage.get_item(store, "feed_urls")
      |> result.unwrap("")
      |> string.split(";")
      |> list.unique()
      |> list.filter(fn(s) { s != "" })
      |> Ok
    }
  }
}

pub fn set(urls: List(String)) -> Result(Nil, String) {
  case storage.local() {
    Error(_) -> Error("Local storage not available")
    Ok(store) -> {
      let value = urls |> list.unique() |> string.join(";")
      storage.set_item(store, "feed_urls", value)
      |> result.replace_error("Failed to save feed URLs")
    }
  }
}
