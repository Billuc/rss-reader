import esgleam
import gleam/io

pub fn main() {
  let bundle_res =
    esgleam.new(outdir: "./dist")
    |> esgleam.entry("rss_reader.gleam")
    |> esgleam.platform(esgleam.Node)
    |> esgleam.minify(True)
    |> esgleam.bundle()

  case bundle_res {
    Ok(_) -> io.println("Build succeeded")
    Error(_) -> io.println_error("Build failed")
  }
}
