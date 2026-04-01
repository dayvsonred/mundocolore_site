locals {
  build_output_abs_path = abspath(var.build_output_path)
  build_output_ready    = fileexists("${local.build_output_abs_path}/index.html")

  site_build_files = var.upload_build_files && local.build_output_ready ? fileset(local.build_output_abs_path, "**") : []

  content_types = {
    html  = "text/html; charset=utf-8"
    css   = "text/css; charset=utf-8"
    js    = "application/javascript; charset=utf-8"
    json  = "application/json; charset=utf-8"
    map   = "application/json; charset=utf-8"
    txt   = "text/plain; charset=utf-8"
    xml   = "application/xml; charset=utf-8"
    svg   = "image/svg+xml"
    png   = "image/png"
    jpg   = "image/jpeg"
    jpeg  = "image/jpeg"
    webp  = "image/webp"
    gif   = "image/gif"
    ico   = "image/x-icon"
    woff  = "font/woff"
    woff2 = "font/woff2"
    ttf   = "font/ttf"
    eot   = "application/vnd.ms-fontobject"
    otf   = "font/otf"
    pdf   = "application/pdf"
  }
}

check "build_artifacts_ready" {
  assert {
    condition     = !var.upload_build_files || local.build_output_ready
    error_message = "Build artifacts not found. Run 'npm run build -- --configuration production' in the site directory, or set upload_build_files=false."
  }
}

resource "aws_s3_object" "site_build_files" {
  for_each = { for file in local.site_build_files : file => file }

  bucket = aws_s3_bucket.site.id
  key    = each.value
  source = "${local.build_output_abs_path}/${each.value}"
  etag   = filemd5("${local.build_output_abs_path}/${each.value}")

  content_type = lookup(
    local.content_types,
    lower(trimprefix(try(regex("\\.[^.]+$", each.value), ""), ".")),
    "application/octet-stream"
  )

  cache_control = lower(trimprefix(try(regex("\\.[^.]+$", each.value), ""), ".")) == "html" ? "no-cache" : "public, max-age=86400"
}
