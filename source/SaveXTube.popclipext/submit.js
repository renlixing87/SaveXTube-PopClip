const selectedUrl = String(
  popclip.input.matchedText || popclip.input.data?.urls?.[0] || popclip.input.text || "",
).trim();
const address = String(popclip.options.serverAddress || "").trim();
const apiKey = String(popclip.options.apiKey || "").trim();
// 旧版本没有连接类型，升级后仍沿用 Desktop 设置。
const connectionType = String(popclip.options.connectionType || "desktop");
if (!["desktop", "server"].includes(connectionType)) {
  throw new Error("Settings error: 请选择有效的连接类型。");
}
if (!address) {
  throw new Error("Settings error: 请先填写 SaveXTube 访问地址。");
}
if (!apiKey) {
  throw new Error("Settings error: 请先填写 SaveXTube 访问密钥。");
}

let baseUrl;
try {
  baseUrl = new URL(address);
} catch {
  throw new Error("Settings error: 访问地址格式不正确，请包含 http:// 或 https://。");
}
if (!["http:", "https:"].includes(baseUrl.protocol)
    || baseUrl.username || baseUrl.password || baseUrl.search || baseUrl.hash) {
  throw new Error("Settings error: 请填写 HTTP 或 HTTPS 访问地址，不要包含账号、查询参数或锚点。");
}
let videoUrl;
try {
  videoUrl = new URL(selectedUrl);
} catch {
  throw new Error("请选择一个完整的视频网页链接。");
}
if (!["http:", "https:"].includes(videoUrl.protocol) || !videoUrl.hostname) {
  throw new Error("请选择一个完整的视频网页链接。");
}

let basePath = baseUrl.pathname.replace(/\/+$/, "");
if (connectionType === "server" && !basePath.endsWith("/api")) {
  basePath += "/api";
}
baseUrl.pathname = `${basePath}/download`;
const headers = { "Content-Type": "application/json" };
if (connectionType === "server") {
  headers["X-Key"] = apiKey;
} else {
  headers.Authorization = `Bearer ${apiKey}`;
}
const axios = require("axios");
let response;
try {
  response = await axios.post(baseUrl.toString(), { url: selectedUrl }, {
    headers,
    timeout: 20000,
    // 避免地址跳转时将访问密钥发送到其他服务。
    maxRedirects: 0,
  });
} catch (error) {
  const serverMessage = error.response?.data?.error;
  if (error.response?.status === 401) {
    throw new Error("Settings error: 访问密钥不正确，请检查密钥及连接类型。");
  }
  if (serverMessage === "SaveXTube Desktop Pro is required") {
    throw new Error("当前 SaveXTube Desktop 授权不支持 HTTP API。");
  }
  if (error.response) {
    throw new Error(`SaveXTube 返回错误：${serverMessage || `HTTP ${error.response.status}`}`);
  }
  if (error.code === "ECONNABORTED") {
    throw new Error("连接 SaveXTube 超时，请检查地址和服务运行状态。");
  }
  throw new Error("无法连接 SaveXTube，请检查地址、网络和服务运行状态。");
}
const jobId = response.data?.job_id;
if (jobId == null || String(jobId).trim() === "") {
  throw new Error("SaveXTube 没有返回任务编号，请检查连接类型和访问地址。");
}
popclip.showText(`已发送到 SaveXTube · 任务 #${jobId}`);
