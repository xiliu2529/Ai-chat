import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LodinPage";
import RegisterPage from "./pages/RegisterPage";
import ChatPage from "./pages/ChatPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  );
}
