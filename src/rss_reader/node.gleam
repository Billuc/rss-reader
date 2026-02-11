@external(javascript, "../node_ffi.js", "consoleLog")
pub fn console_log(msg: a) -> Nil

@external(javascript, "../node_ffi.js", "consoleError")
pub fn console_error(msg: String) -> Nil

@external(javascript, "../node_ffi.js", "uuid")
pub fn uuid() -> String
