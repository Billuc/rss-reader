@external(javascript, "../node_ffi.js", "consoleLog")
pub fn console_log(msg: String) -> Nil

@external(javascript, "../node_ffi.js", "consoleError")
pub fn console_error(msg: String) -> Nil

@external(javascript, "../node_ffi.js", "readFileSync")
pub fn read_file_sync(path: String) -> String

@external(javascript, "../node_ffi.js", "readBase64FileSync")
pub fn read_base64_file_sync(path: String) -> String
