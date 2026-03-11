import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, sendChat, getHistory, deleteHistory } from "../api/auth";

interface Message {
  role: "user" | "ai";
  content: string;
}

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState("...");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // 初始化：获取用户信息 + 加载历史记录（仅执行一次）
  useEffect(() => {
    getCurrentUser()
      .then((data) => setCurrentUser(data.username ?? data.name ?? "用户"))
      .catch(() => {
        // token 无效或过期，清除后跳回登录
        localStorage.removeItem("token");
        navigate("/");
      });

    getHistory()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const loaded: Message[] = data.flatMap((item: { question: string; answer: string }) => [
            { role: "user" as const, content: item.question },
            { role: "ai" as const, content: item.answer },
          ]);
          setMessages(loaded);
        }
      })
      .catch(() => {}); // 历史记录加载失败不阻断主流程
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // 点击外部关闭用户菜单
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const question = input.trim();
    const newMessages: Message[] = [...messages, { role: "user", content: question }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const data = await sendChat(question);
      setMessages([...newMessages, { role: "ai", content: data.answer ?? data.response ?? "无回复" }]);
    } catch (err) {
      console.error(err);
      setMessages([...newMessages, { role: "ai", content: "⚠ 连接失败，请检查服务是否运行" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleClearHistory = async () => {
    try {
      await deleteHistory();
      setMessages([]);
    } catch {
      alert("清除失败，请稍后再试");
    } finally {
      setShowClearConfirm(false);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div style={styles.page}>
        {/* 顶部导航栏 */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.headerLogo}>🤖</span>
            <span style={styles.headerTitle}>AI 学习助手</span>
          </div>
          <div style={styles.headerRight} ref={menuRef}>
            <div style={styles.userArea} onClick={() => setShowUserMenu(!showUserMenu)}>
              <div style={styles.avatar}>{currentUser[0]?.toUpperCase()}</div>
              <span style={styles.userName}>{currentUser}</span>
              <span style={styles.chevron}>{showUserMenu ? "▲" : "▼"}</span>
            </div>
            {showUserMenu && (
              <div style={styles.userMenu}>
                <div style={styles.userMenuHeader}>
                  <div style={styles.menuAvatar}>{currentUser[0]?.toUpperCase()}</div>
                  <div>
                    <div style={styles.menuName}>{currentUser}</div>
                    <div style={styles.menuRole}>学习者</div>
                  </div>
                </div>
                <div style={styles.menuDivider} />
                <button
                  style={styles.menuItemNormal}
                  onClick={() => { setShowClearConfirm(true); setShowUserMenu(false); }}
                >
                  🗑 清除聊天记录
                </button>
                <button style={styles.menuItemDanger} onClick={handleLogout}>
                  🚪 退出登录
                </button>
              </div>
            )}
          </div>
        </header>

        {/* 聊天主体 */}
        <main style={styles.main}>
          <div style={styles.chatContainer}>
            {/* 消息列表 */}
            <div style={styles.messageList}>
              {messages.length === 0 && (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>💬</div>
                  <div style={styles.emptyText}>开始与 AI 对话吧！</div>
                  <div style={styles.emptySubText}>输入您的问题，AI 将为您解答</div>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    ...styles.messageRow,
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  {msg.role === "ai" && <div style={styles.aiAvatar}>🤖</div>}
                  <div
                    style={{
                      ...styles.bubble,
                      ...(msg.role === "user" ? styles.userBubble : styles.aiBubble),
                    }}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div style={styles.userAvatarSmall}>{currentUser[0]?.toUpperCase()}</div>
                  )}
                </div>
              ))}
              {loading && (
                <div style={{ ...styles.messageRow, justifyContent: "flex-start" }}>
                  <div style={styles.aiAvatar}>🤖</div>
                  <div style={{ ...styles.bubble, ...styles.aiBubble }}>
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 输入区 */}
            <div style={styles.inputArea}>
              <input
                style={styles.input}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="输入您的问题，按 Enter 发送..."
                disabled={loading}
              />
              <button
                style={{ ...styles.sendBtn, opacity: loading || !input.trim() ? 0.6 : 1 }}
                onClick={sendMessage}
                disabled={loading || !input.trim()}
              >
                发送
              </button>
            </div>
          </div>
        </main>

        {/* 清除历史确认弹窗 */}
        {showClearConfirm && (
          <div style={styles.modalOverlay} onClick={() => setShowClearConfirm(false)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalIcon}>🗑</div>
              <div style={styles.modalTitle}>清除聊天记录</div>
              <div style={styles.modalDesc}>确定要清除所有聊天记录吗？此操作不可恢复。</div>
              <div style={styles.modalActions}>
                <button style={styles.modalCancelBtn} onClick={() => setShowClearConfirm(false)}>
                  取消
                </button>
                <button style={styles.modalConfirmBtn} onClick={handleClearHistory}>
                  确认清除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const css = `
  * { box-sizing: border-box; }
  @keyframes typingBounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
    40% { transform: translateY(-6px); opacity: 1; }
  }
  .typing-dot {
    display: inline-block;
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #999;
    margin: 0 2px;
    animation: typingBounce 1.2s infinite ease-in-out;
  }
  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }
`;

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#f7f8fc",
    fontFamily: "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  },
  header: {
    height: "64px",
    background: "#fff",
    borderBottom: "1px solid #eee",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 32px",
    boxShadow: "0 2px 12px rgba(102,126,234,0.07)",
    flexShrink: 0,
    zIndex: 100,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  headerLogo: { fontSize: "28px" },
  headerTitle: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#1a1a2e",
    letterSpacing: "1px",
  },
  headerRight: { position: "relative" },
  userArea: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    padding: "6px 12px",
    borderRadius: "10px",
    userSelect: "none",
  },
  avatar: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    fontWeight: 700,
    fontSize: "15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  userName: { fontSize: "14px", fontWeight: 600, color: "#333" },
  chevron: { fontSize: "10px", color: "#aaa" },
  userMenu: {
    position: "absolute",
    top: "50px",
    right: 0,
    background: "#fff",
    borderRadius: "14px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
    padding: "16px",
    minWidth: "210px",
    zIndex: 200,
    border: "1px solid #f0f0f0",
  },
  userMenuHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
  },
  menuAvatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    fontWeight: 700,
    fontSize: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  menuName: { fontSize: "15px", fontWeight: 700, color: "#1a1a2e" },
  menuRole: { fontSize: "12px", color: "#999", marginTop: "2px" },
  menuDivider: { height: "1px", background: "#f0f0f0", margin: "8px 0" },
  menuItemNormal: {
    width: "100%",
    padding: "10px 12px",
    background: "transparent",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#555",
    textAlign: "left",
    cursor: "pointer",
    fontWeight: 500,
    marginBottom: "4px",
  },
  menuItemDanger: {
    width: "100%",
    padding: "10px 12px",
    background: "transparent",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#e53935",
    textAlign: "left",
    cursor: "pointer",
    fontWeight: 500,
  },
  main: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    padding: "24px",
    overflow: "hidden",
  },
  chatContainer: {
    width: "100%",
    maxWidth: "800px",
    display: "flex",
    flexDirection: "column",
    background: "#fff",
    borderRadius: "20px",
    boxShadow: "0 8px 40px rgba(102,126,234,0.10)",
    overflow: "hidden",
  },
  messageList: {
    flex: 1,
    overflowY: "auto",
    padding: "28px 28px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  emptyState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 0",
  },
  emptyIcon: { fontSize: "48px", marginBottom: "16px" },
  emptyText: { fontSize: "17px", fontWeight: 600, color: "#ccc", marginBottom: "8px" },
  emptySubText: { fontSize: "13px", color: "#ddd" },
  messageRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: "10px",
  },
  aiAvatar: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0,
  },
  userAvatarSmall: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    fontWeight: 700,
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bubble: {
    maxWidth: "65%",
    padding: "12px 18px",
    borderRadius: "18px",
    fontSize: "15px",
    lineHeight: 1.6,
    wordBreak: "break-word",
    whiteSpace: "pre-wrap",
  },
  userBubble: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    borderBottomRightRadius: "4px",
  },
  aiBubble: {
    background: "#f3f4f8",
    color: "#333",
    borderBottomLeftRadius: "4px",
  },
  inputArea: {
    display: "flex",
    gap: "12px",
    padding: "20px 28px",
    borderTop: "1px solid #f0f0f0",
    background: "#fff",
    flexShrink: 0,
  },
  input: {
    flex: 1,
    padding: "13px 18px",
    fontSize: "15px",
    border: "1.5px solid #e0e0e0",
    borderRadius: "12px",
    outline: "none",
    color: "#333",
    background: "#fafafa",
    transition: "border-color 0.2s",
  },
  sendBtn: {
    padding: "13px 28px",
    fontSize: "15px",
    fontWeight: 600,
    color: "#fff",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    letterSpacing: "1px",
    transition: "opacity 0.2s",
    flexShrink: 0,
  },
  // 弹窗
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 500,
  },
  modal: {
    background: "#fff",
    borderRadius: "20px",
    padding: "40px 36px",
    width: "360px",
    textAlign: "center",
    boxShadow: "0 16px 48px rgba(0,0,0,0.15)",
  },
  modalIcon: { fontSize: "40px", marginBottom: "16px" },
  modalTitle: { fontSize: "20px", fontWeight: 700, color: "#1a1a2e", marginBottom: "10px" },
  modalDesc: { fontSize: "14px", color: "#888", marginBottom: "28px", lineHeight: 1.6 },
  modalActions: { display: "flex", gap: "12px" },
  modalCancelBtn: {
    flex: 1,
    padding: "12px",
    fontSize: "15px",
    fontWeight: 600,
    color: "#667eea",
    background: "transparent",
    border: "1.5px solid #667eea",
    borderRadius: "12px",
    cursor: "pointer",
  },
  modalConfirmBtn: {
    flex: 1,
    padding: "12px",
    fontSize: "15px",
    fontWeight: 600,
    color: "#fff",
    background: "linear-gradient(135deg, #e53935, #c62828)",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
  },
};
