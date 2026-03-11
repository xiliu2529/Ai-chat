// 优先从内存读取，刷新后从 localStorage 恢复
let token: string | null = localStorage.getItem("token");

/** 统一响应校验：非 2xx 时抛出带状态码的错误 */
async function parseResponse(res: Response) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

/** 获取当前内存/本地存储中的 token，无则抛错 */
function requireToken(): string {
  if (!token) token = localStorage.getItem("token");
  if (!token) throw new Error("Not logged in");
  return token;
}

// 登录后保存 token 到内存和 localStorage
export async function login(username: string, password: string) {
  const res = await fetch(
    `http://127.0.0.1:8000/login?username=${username}&password=${password}`,
    { method: "POST" }
  );
  const data = await parseResponse(res);
  if (data.access_token) {
    token = data.access_token;
    localStorage.setItem("token", token); // 持久化
  }
  return data;
}

// 注册
export async function register(username: string, email: string, password: string) {
  const res = await fetch(
    `http://127.0.0.1:8000/register?username=${username}&email=${email}&password=${password}`,
    { method: "POST" }
  );
  return parseResponse(res);
}

// 获取当前用户信息
export async function getCurrentUser() {
  const res = await fetch("http://127.0.0.1:8000/me", {
    headers: { Authorization: `Bearer ${requireToken()}` }
  });
  return parseResponse(res);
}

// 发送聊天消息
export async function sendChat(question: string) {
  const res = await fetch(`http://127.0.0.1:8000/chat?question=${encodeURIComponent(question)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${requireToken()}` }
  });
  return parseResponse(res);
}

// 获取聊天历史
export async function getHistory() {
  const res = await fetch("http://127.0.0.1:8000/history", {
    headers: { Authorization: `Bearer ${requireToken()}` }
  });
  return parseResponse(res);
}

// 删除聊天历史
export async function deleteHistory() {
  const res = await fetch("http://127.0.0.1:8000/history", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${requireToken()}` }
  });
  return parseResponse(res);
}