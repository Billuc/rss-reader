import gleam/dict
import gleam/dynamic
import gleam/dynamic/decode
import gleam/result
import gleam/string
import rss_reader/node

pub type LambdaEvent {
  LambdaEvent(
    version: String,
    raw_path: String,
    raw_query_string: String,
    cookies: List(String),
    headers: dict.Dict(String, String),
    query_string_parameters: dict.Dict(String, String),
    request_context: RequestContext,
    body: String,
    is_base64_encoded: Bool,
  )
}

pub type RequestContext {
  RequestContext(
    account_id: String,
    api_id: String,
    domain_name: String,
    domain_prefix: String,
    http: Http,
    request_id: String,
    time: String,
    time_epoch: Int,
  )
}

pub type Http {
  Http(
    method: String,
    path: String,
    protocol: String,
    source_ip: String,
    user_agent: String,
  )
}

pub type LambdaResponse {
  LambdaResponse(
    status_code: Int,
    headers: dict.Dict(String, String),
    cookies: List(String),
    body: String,
    is_base64_encoded: Bool,
  )
}

pub fn decode_event(event: dynamic.Dynamic) {
  decode.run(event, lambda_event_decoder())
  |> result.map_error(fn(err) {
    node.console_error("Decode error: " <> string.inspect(err))
    "Failed to decode Lambda event"
  })
}

fn lambda_event_decoder() -> decode.Decoder(LambdaEvent) {
  use version <- decode.field("version", decode.string)
  use raw_path <- decode.field("rawPath", decode.string)
  use raw_query_string <- decode.field("rawQueryString", decode.string)
  use cookies <- decode.optional_field(
    "cookies",
    [],
    decode.list(decode.string),
  )
  use headers <- decode.field(
    "headers",
    decode.dict(decode.string, decode.string),
  )
  use query_string_parameters <- decode.optional_field(
    "queryStringParameters",
    dict.new(),
    decode.dict(decode.string, decode.string),
  )
  use request_context <- decode.field(
    "requestContext",
    request_context_decoder(),
  )
  use body <- decode.optional_field("body", "", decode.string)
  use is_base64_encoded <- decode.field("isBase64Encoded", decode.bool)

  decode.success(LambdaEvent(
    version:,
    raw_path:,
    raw_query_string:,
    cookies:,
    headers:,
    query_string_parameters:,
    request_context:,
    body:,
    is_base64_encoded:,
  ))
}

fn request_context_decoder() -> decode.Decoder(RequestContext) {
  use account_id <- decode.field("accountId", decode.string)
  use api_id <- decode.field("apiId", decode.string)
  use domain_name <- decode.field("domainName", decode.string)
  use domain_prefix <- decode.field("domainPrefix", decode.string)
  use http <- decode.field("http", http_decoder())
  use request_id <- decode.field("requestId", decode.string)
  use time <- decode.field("time", decode.string)
  use time_epoch <- decode.field("timeEpoch", decode.int)

  decode.success(RequestContext(
    account_id:,
    api_id:,
    domain_name:,
    domain_prefix:,
    http:,
    request_id:,
    time:,
    time_epoch:,
  ))
}

fn http_decoder() -> decode.Decoder(Http) {
  use method <- decode.field("method", decode.string)
  use path <- decode.field("path", decode.string)
  use protocol <- decode.field("protocol", decode.string)
  use source_ip <- decode.field("sourceIp", decode.string)
  use user_agent <- decode.field("userAgent", decode.string)

  decode.success(Http(method:, path:, protocol:, source_ip:, user_agent:))
}

pub fn html_response(html: String) -> LambdaResponse {
  LambdaResponse(
    status_code: 200,
    headers: dict.from_list([#("Content-Type", "text/html; charset=utf-8")]),
    cookies: [],
    body: html,
    is_base64_encoded: False,
  )
}

pub fn status_code(response: LambdaResponse, code: Int) -> LambdaResponse {
  LambdaResponse(..response, status_code: code)
}

pub fn add_header(
  response: LambdaResponse,
  key: String,
  value: String,
) -> LambdaResponse {
  LambdaResponse(..response, headers: dict.insert(response.headers, key, value))
}

pub fn add_cookie(response: LambdaResponse, cookie: String) -> LambdaResponse {
  LambdaResponse(..response, cookies: [cookie, ..response.cookies])
}

@external(javascript, "../aws_ffi.js", "toResponse")
pub fn return(response: LambdaResponse) -> dynamic.Dynamic
