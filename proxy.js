// proxy.js — 与 WizCloud 前端配套使用
// 运行: node proxy.js
const http = require("http");
const https = require("https");
const { URL } = require("url");

const PORT = 8066;

const server = http.createServer((req, res) => {
  // ── CORS 头 ──
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, PUT, DELETE, PROPFIND, MKCOL, COPY, MOVE, OPTIONS, POST",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type, Depth, Destination, Overwrite, Range",
  );
  res.setHeader(
    "Access-Control-Expose-Headers",
    "Content-Length, Content-Range, Content-Type",
  );

  // 预检请求
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // 解析目标 URL
  // 格式: GET http://localhost:8066/https://target-server/path
  // req.url = "/https://target-server/path"
  const targetUrl = decodeURIComponent(req.url.slice(1)); // 去掉开头的 /

  if (!targetUrl || !targetUrl.startsWith("http")) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(
      "用法: http://localhost:" +
        PORT +
        "/<目标WebDAV地址>\n示例: http://localhost:" +
        PORT +
        "/https://dav.jianguoyun.com/dav/",
    );
    return;
  }

  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch (e) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("无效的 URL: " + targetUrl);
    return;
  }

  const lib = parsed.protocol === "https:" ? https : http;

  // 收集请求体
  const chunks = [];
  req.on("data", (chunk) => chunks.push(chunk));
  req.on("end", () => {
    // 构建转发请求头
    const fwdHeaders = {};
    for (const [key, value] of Object.entries(req.headers)) {
      const lk = key.toLowerCase();
      // 跳过 hop-by-hop 头
      if (["host", "origin", "referer", "connection"].includes(lk)) continue;
      fwdHeaders[key] = value;
    }
    // 覆盖 host 为目标服务器
    fwdHeaders["host"] = parsed.host;

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: req.method,
      headers: fwdHeaders,
      // 忽略自签名证书
      rejectUnauthorized: false,
    };

    const targetReq = lib.request(options, (targetRes) => {
      // 转发响应头，加上 CORS
      const resHeaders = { ...targetRes.headers };
      resHeaders["access-control-allow-origin"] = "*";
      resHeaders["access-control-allow-methods"] =
        "GET, PUT, DELETE, PROPFIND, MKCOL, COPY, MOVE, OPTIONS, POST";
      resHeaders["access-control-allow-headers"] =
        "Authorization, Content-Type, Depth, Destination, Overwrite, Range";

      res.writeHead(targetRes.statusCode, resHeaders);
      targetRes.pipe(res);
    });

    targetReq.on("error", (err) => {
      console.error(`[代理错误] ${req.method} ${targetUrl} → ${err.message}`);
      res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("代理错误: " + err.message);
    });

    // 发送请求体
    if (chunks.length > 0) {
      targetReq.end(Buffer.concat(chunks));
    } else {
      targetReq.end();
    }
  });
});

server.listen(PORT, () => {
  console.log("");
  console.log("  ✅ CORS 代理已启动");
  console.log(`  📡 监听地址 → http://localhost:${PORT}`);
  console.log("  📌 请求格式 → http://localhost:" + PORT + "/<目标WebDAV地址>");
  console.log("  🔓 允许来源 → *");
  console.log("");
  console.log("  示例:");
  console.log(`    http://localhost:${PORT}/https://dav.jianguoyun.com/dav/`);
  console.log(`    http://localhost:${PORT}/http://192.168.1.100:5005/dav/`);
  console.log("");
  console.log("  按 Ctrl+C 停止");
  console.log("");
});
