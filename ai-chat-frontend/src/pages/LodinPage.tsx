import { useState } from "react";
import { login } from "../api/auth";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username || !password) {
      setError("请填写用户名和密码");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await login(username, password);
      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
        navigate("/chat");
      } else {
        setError("用户名或密码错误，请重试");
      }
    } catch {
      setError("网络错误，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <>
      <style>{responsiveCSS}</style>
      <div style={styles.page}>
        {/* 右侧表单区 */}
        <div style={styles.formPanel}>
          <div style={styles.formCard}>
            <h2 style={styles.formTitle}>欢迎回来</h2>
            <p style={styles.formSubtitle}>请登录您的账号以继续</p>

            {error && <div style={styles.errorBox}>⚠ {error}</div>}

            <div style={styles.inputGroup}>
              <label style={styles.label}>用户名</label>
              <input
                style={{
                  ...styles.input,
                  borderColor:
                    focusedInput === "username" ? "#667eea" : "#e0e0e0",
                  boxShadow:
                    focusedInput === "username"
                      ? "0 0 0 3px rgba(102,126,234,0.15)"
                      : "none",
                }}
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setFocusedInput("username")}
                onBlur={() => setFocusedInput(null)}
                autoComplete="username"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>密码</label>
              <input
                style={{
                  ...styles.input,
                  borderColor:
                    focusedInput === "password" ? "#667eea" : "#e0e0e0",
                  boxShadow:
                    focusedInput === "password"
                      ? "0 0 0 3px rgba(102,126,234,0.15)"
                      : "none",
                }}
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setFocusedInput("password")}
                onBlur={() => setFocusedInput(null)}
                autoComplete="current-password"
              />
            </div>

            <button
              style={{ ...styles.primaryBtn, opacity: loading ? 0.75 : 1 }}
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "登录中..." : "登 录"}
            </button>

            <div style={styles.dividerRow}>
              <span style={styles.dividerLine} />
              <span style={styles.dividerText}>还没有账号？</span>
              <span style={styles.dividerLine} />
            </div>

            <button
              style={styles.secondaryBtn}
              onClick={() => navigate("/register")}
            >
              立即注册
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const responsiveCSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { min-height: 100vh; }
  .brand-panel { display: flex !important; }
  @media (max-width: 768px) {
    .brand-panel { display: none !important; }
    .form-panel-inner { max-width: 100% !important; padding: 32px 24px !important; }
  }
`;

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  },
  brand: {
    flex: "1 1 50%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 48px",
    position: "relative",
    overflow: "hidden",
  },
  brandInner: {
    color: "#fff",
    maxWidth: "420px",
    zIndex: 1,
  },
  brandLogo: {
    fontSize: "64px",
    marginBottom: "24px",
    display: "block",
    filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.2))",
  },
  brandTitle: {
    fontSize: "36px",
    fontWeight: 800,
    marginBottom: "16px",
    letterSpacing: "1px",
    lineHeight: 1.2,
  },
  brandDesc: {
    fontSize: "16px",
    lineHeight: 1.8,
    opacity: 0.88,
    marginBottom: "40px",
  },
  brandFeatures: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  featureItem: {
    background: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(8px)",
    borderRadius: "12px",
    padding: "12px 20px",
    fontSize: "15px",
    fontWeight: 500,
    letterSpacing: "0.5px",
    border: "1px solid rgba(255,255,255,0.2)",
  },
  formPanel: {
    flex: "1 1 50%",
    background: "#f7f8fc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 48px",
  },
  formCard: {
    background: "#fff",
    borderRadius: "20px",
    padding: "48px 44px",
    width: "100%",
    maxWidth: "440px",
    boxShadow: "0 8px 40px rgba(102,126,234,0.10)",
  },
  formTitle: {
    fontSize: "28px",
    fontWeight: 700,
    color: "#1a1a2e",
    marginBottom: "8px",
  },
  formSubtitle: {
    fontSize: "14px",
    color: "#999",
    marginBottom: "32px",
  },
  errorBox: {
    background: "#fff0f0",
    border: "1px solid #ffcdd2",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "13px",
    color: "#e53935",
    marginBottom: "20px",
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "#555",
    marginBottom: "7px",
  },
  input: {
    width: "100%",
    padding: "13px 16px",
    fontSize: "15px",
    border: "1.5px solid #e0e0e0",
    borderRadius: "12px",
    outline: "none",
    color: "#333",
    background: "#fafafa",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  primaryBtn: {
    width: "100%",
    padding: "14px",
    fontSize: "16px",
    fontWeight: 600,
    color: "#fff",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    marginTop: "8px",
    letterSpacing: "3px",
    transition: "opacity 0.2s",
  },
  dividerRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "24px 0 16px",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "#eee",
    display: "block",
  },
  dividerText: {
    fontSize: "13px",
    color: "#bbb",
    whiteSpace: "nowrap",
  },
  secondaryBtn: {
    width: "100%",
    padding: "13px",
    fontSize: "15px",
    fontWeight: 600,
    color: "#667eea",
    background: "transparent",
    border: "1.5px solid #667eea",
    borderRadius: "12px",
    cursor: "pointer",
    letterSpacing: "1px",
    transition: "background 0.2s, color 0.2s",
  },
};
