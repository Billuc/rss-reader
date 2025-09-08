export function toResponse(data) {
  return {
    statusCode: data.status_code,
    headers: Object.fromEntries(data.headers.entries()),
    cookies: data.cookies.toArray(),
    body: data.body,
    isBase64Encoded: data.is_base64_encoded,
  };
}
