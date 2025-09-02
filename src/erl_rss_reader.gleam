//
// import argv
// import gleam/http/request
// import gleam/http/response
// import gleam/httpc
// import gleam/int
// import gleam/io
// import gleam/list
// import gleam/option
// import gleam/regexp
// import gleam/result
// import gleam/string
// import glisse
//
// pub fn main() -> Nil {
//   let args = argv.load()
//   args.arguments
//   |> list.each(try_get_rss)
//
//   io.println("Done")
// }
//
// fn try_get_rss(url: String) -> Nil {
//   let rss_res = {
//     use req <- result.try(
//       request.to(url) |> result.replace_error("Error with URL " <> url),
//     )
//     use resp <- result.try(
//       httpc.send(req) |> result.replace_error("Error fetching URL " <> url),
//     )
//     use _ <- result.try(check_status(resp))
//     use _ <- result.try(check_content_type(resp))
//
//     glisse.parse_rss(resp.body)
//   }
//
//   case rss_res {
//     Error(e) -> io.println_error(e)
//     Ok(rss_doc) -> print_rss_items(rss_doc)
//   }
// }
//
// fn check_status(resp: response.Response(a)) -> Result(Nil, String) {
//   case resp.status {
//     200 -> Ok(Nil)
//     _ -> Error("Non-200 status code: " <> int.to_string(resp.status))
//   }
// }
//
// fn check_content_type(resp: response.Response(a)) -> Result(Nil, String) {
//   let ct_res =
//     resp
//     |> response.get_header("content-type")
//     |> result.try(fn(ct) { string.split_once(ct, ";") })
//     |> result.map(fn(ct) { string.lowercase(ct.0) })
//
//   case ct_res {
//     Error(_) -> Error("No content-type header found")
//     Ok("application/xml") | Ok("text/xml") | Ok("application/rss+xml") ->
//       Ok(Nil)
//     Ok(other) -> Error("Content-Type is not application/xml, but " <> other)
//   }
// }
//
// fn print_rss_items(rss: glisse.RssDocument) -> Nil {
//   use item <- list.each(rss.channel.items)
//
//   io.println("- " <> item.title |> option.unwrap("Untitled"))
//   // option_tap(item.link, fn(l) { io.println("  " <> l) })
//   option_tap(item.description, fn(d) { io.println("  " <> prep_description(d)) })
//   io.println("")
// }
//
// fn option_tap(v: option.Option(a), apply: fn(a) -> Nil) -> Nil {
//   case v {
//     option.Some(value) -> apply(value)
//     option.None -> Nil
//   }
// }
//
// fn prep_description(desc: String) -> String {
//   let assert Ok(reg) = regexp.from_string("&#([0-9]+);")
//   let assert Ok(hex_reg) = regexp.from_string("&#x([0-9a-fA-F]+);")
//
//   let desc =
//     reg
//     |> regexp.match_map(desc, fn(m) {
//       let code = m.submatches |> list.first |> result.unwrap(option.None)
//       case code {
//         option.None -> ""
//         option.Some(num) ->
//           int.base_parse(num, 10)
//           |> result.map(int_to_char)
//           |> result.unwrap("")
//       }
//     })
//   hex_reg
//   |> regexp.match_map(desc, fn(m) {
//     let code = m.submatches |> list.first |> result.unwrap(option.None)
//     case code {
//       option.None -> ""
//       option.Some(hex) ->
//         int.base_parse(hex, 16) |> result.map(int_to_char) |> result.unwrap("")
//     }
//   })
// }
//
// fn int_to_char(i: Int) -> String {
//   string.utf_codepoint(i)
//   |> result.map(fn(code) { string.from_utf_codepoints([code]) })
//   |> result.unwrap("?")
// }
