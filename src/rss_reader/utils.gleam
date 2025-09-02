import gleam/result
import gleam/string
import lustre/effect
import plinth/browser/document
import plinth/browser/element

pub fn dispatch(msg: msg) -> effect.Effect(msg) {
  effect.from(fn(dispatch) { dispatch(msg) })
}

pub fn get_value_from_id(id: String) {
  use el <- result.try(document.get_element_by_id(id))
  use v <- result.try(element.value(el))

  case string.trim(v) {
    "" -> Error(Nil)
    value -> Ok(value)
  }
}
