# SaveXTube 下载

Send a selected video link to SaveXTube Desktop or SaveXTube Server from PopClip.

## Setup

1. Install SaveXTube Desktop or configure a SaveXTube Server instance.
2. In PopClip, select **Desktop** or **Server** under Connection Type.
3. Enter the matching HTTP address and access key. Desktop uses the API key from Settings → Remote Control → HTTP API. Server uses a server access key; a web login password or JWT is not accepted.
4. Select a video URL and click **SaveXTube 下载**. The extension sends the selected URL and access key to the configured SaveXTube endpoint. The key is stored in the local macOS Keychain.

Desktop defaults to `http://127.0.0.1:8530` and requires its HTTP API to be enabled. Server mode posts to `/api/download` (or `/download` under a URL that already ends in `/api`) using the `X-Key` header. Use HTTPS when connecting over an untrusted network.

The extension sends only the selected URL to the address configured by the user. It does not send selection data to the extension author.

## Changelog

- 1.0: Initial directory submission; supports Desktop and Server connections.
