import { useMemo, useState } from "react";
import { Box, Button, Card, CardContent, TextField, Typography, Chip } from "@mui/material";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import MicIcon from "@mui/icons-material/Mic";
import SpellcheckIcon from "@mui/icons-material/Spellcheck";

function levenshtein(a: string, b: string) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    const cost = a[i - 1] === b[j - 1] ? 0 : 1;
    dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
  }
  return dp[m][n];
}

export default function Pronunciation() {
  const [target, setTarget] = useState("environment");
  const [heard, setHeard] = useState("");
  const [status, setStatus] = useState("");
  const [score, setScore] = useState<number | null>(null);

  const SpeechRecognition = useMemo(() => (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition, []);
  const canRecognize = !!SpeechRecognition;

  const speak = () => {
    const u = new SpeechSynthesisUtterance(target);
    u.lang = "en-US";
    window.speechSynthesis.speak(u);
  };

  const record = () => {
    if (!SpeechRecognition) {
      setStatus("Trình duyệt chưa hỗ trợ Speech Recognition. Hãy dùng Chrome.");
      return;
    }
    setStatus("Đang nghe...");
    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e: any) => {
      const text = e.results?.[0]?.[0]?.transcript || "";
      setHeard(text);
      const t = target.trim().toLowerCase();
      const h = text.trim().toLowerCase();
      const dist = levenshtein(t, h);
      const s = Math.max(0, Math.round(100 * (1 - dist / Math.max(t.length, h.length, 1))));
      setScore(s);
      setStatus("Đã nhận giọng nói.");
    };
    rec.onerror = () => setStatus("Không nhận được giọng nói. Thử lại ở nơi yên tĩnh.");
    rec.start();
  };

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 800 }}>Luyện phát âm</Typography>

      <Card sx={{ boxShadow: 6 }}>
        <CardContent sx={{ display: "grid", gap: 2 }}>
          <TextField label="Từ/Câu mục tiêu" value={target} onChange={(e) => setTarget(e.target.value)} />

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button variant="contained" startIcon={<VolumeUpIcon />} onClick={speak}>Nghe chuẩn</Button>
            <Button variant="outlined" startIcon={<MicIcon />} onClick={record}>Ghi âm & nhận dạng</Button>
            <Chip icon={<SpellcheckIcon />} label={canRecognize ? "Speech Recognition: OK" : "Speech Recognition: Not supported"} />
          </Box>

          <Typography>SV nói được nhận: <b>{heard || "(chưa có)"}</b></Typography>
          {score !== null && (
            <Typography>
              Điểm gần đúng: <b>{score}/100</b> — Gợi ý: nếu thấp, hãy nghe lại và sửa trọng âm/âm cuối.
            </Typography>
          )}
          {status && <Typography sx={{ opacity: 0.8 }}>{status}</Typography>}
        </CardContent>
      </Card>
    </Box>
  );
}
