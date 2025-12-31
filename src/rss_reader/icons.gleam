import lustre/attribute.{type Attribute, attribute}
import lustre/element/svg

pub fn trash_2(attributes: List(Attribute(a))) {
  svg.svg(
    [
      attribute("stroke-linejoin", "round"),
      attribute("stroke-linecap", "round"),
      attribute("stroke-width", "2"),
      attribute("stroke", "currentColor"),
      attribute("fill", "none"),
      attribute("viewBox", "0 0 24 24"),
      attribute("height", "24"),
      attribute("width", "24"),
      ..attributes
    ],
    [
      svg.path([attribute("d", "M10 11v6")]),
      svg.path([attribute("d", "M14 11v6")]),
      svg.path([attribute("d", "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6")]),
      svg.path([attribute("d", "M3 6h18")]),
      svg.path([attribute("d", "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2")]),
    ],
  )
}

pub fn chevron_up(attributes: List(Attribute(a))) {
  svg.svg(
    [
      attribute("stroke-linejoin", "round"),
      attribute("stroke-linecap", "round"),
      attribute("stroke-width", "2"),
      attribute("stroke", "currentColor"),
      attribute("fill", "none"),
      attribute("viewBox", "0 0 24 24"),
      attribute("height", "24"),
      attribute("width", "24"),
      ..attributes
    ],
    [svg.path([attribute("d", "m18 15-6-6-6 6")])],
  )
}

pub fn chevron_down(attributes: List(Attribute(a))) {
  svg.svg(
    [
      attribute("stroke-linejoin", "round"),
      attribute("stroke-linecap", "round"),
      attribute("stroke-width", "2"),
      attribute("stroke", "currentColor"),
      attribute("fill", "none"),
      attribute("viewBox", "0 0 24 24"),
      attribute("height", "24"),
      attribute("width", "24"),
      ..attributes
    ],
    [svg.path([attribute("d", "m6 9 6 6 6-6")])],
  )
}

pub fn plus(attributes: List(Attribute(a))) {
  svg.svg(
    [
      attribute("stroke-linejoin", "round"),
      attribute("stroke-linecap", "round"),
      attribute("stroke-width", "2"),
      attribute("stroke", "currentColor"),
      attribute("fill", "none"),
      attribute("viewBox", "0 0 24 24"),
      attribute("height", "24"),
      attribute("width", "24"),
      ..attributes
    ],
    [
      svg.path([attribute("d", "M5 12h14")]),
      svg.path([attribute("d", "M12 5v14")]),
    ],
  )
}

pub fn sun_moon(attributes: List(Attribute(a))) {
  svg.svg(
    [
      attribute("stroke-linejoin", "round"),
      attribute("stroke-linecap", "round"),
      attribute("stroke-width", "2"),
      attribute("stroke", "currentColor"),
      attribute("fill", "none"),
      attribute("viewBox", "0 0 24 24"),
      attribute("height", "24"),
      attribute("width", "24"),
      ..attributes
    ],
    [
      svg.path([attribute("d", "M12 2v2")]),
      svg.path([
        attribute(
          "d",
          "M14.837 16.385a6 6 0 1 1-7.223-7.222c.624-.147.97.66.715 1.248a4 4 0 0 0 5.26 5.259c.589-.255 1.396.09 1.248.715",
        ),
      ]),
      svg.path([attribute("d", "M16 12a4 4 0 0 0-4-4")]),
      svg.path([attribute("d", "m19 5-1.256 1.256")]),
      svg.path([attribute("d", "M20 12h2")]),
    ],
  )
}
