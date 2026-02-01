// frontend/src/pages/Login.tsx
import React, { useState } from 'react';
import { 
  Box, Container, TextField, Button, Typography, 
  Card, CardContent, Alert 
} from '@mui/material';
import { api, setToken } from '../api/client';

export default function Login({ onLogged }: { onLogged: (role: string, username: string) => void }) {
  const [username, setUsername] = useState('gv001');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      const { access_token, role, username: u, user_id } = res.data;

      setToken(access_token);
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify({ username: u, role, user_id }));

      onLogged(role, u);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 2 }}>
      <Container maxWidth="sm">
        <Card sx={{ width: '100%', maxWidth: 400, borderRadius: 3, boxShadow: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={800} color="primary.main" gutterBottom sx={{ textAlign: 'center' }}>
              📚 English E-Learning
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
              Hệ thống học tiếng Anh trực tuyến
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TextField 
              label="Tài khoản" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              fullWidth 
              margin="normal" 
              autoFocus 
            />
            <TextField
              label="Mật khẩu"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              margin="normal"
            />

            <Button 
              variant="contained" 
              fullWidth 
              onClick={submit} 
              disabled={loading}
              sx={{ mt: 3, py: 1.5, borderRadius: 2 }}
            >
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </Button>

            <Box sx={{ mt: 4, p: 2, bgcolor: 'primary.light', borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                🧪 Tài khoản demo:
              </Typography>
              <Typography 
                variant="body2" 
                onClick={() => {
                  setUsername('gv001');
                  setPassword('123456');
                }}
                sx={{ 
                  display: 'block',
                  color: 'primary.main', 
                  cursor: 'pointer',
                  mb: 0.5,
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                👨‍🏫 Giáo viên: gv001 / 123456
              </Typography>
              <Typography 
                variant="body2" 
                onClick={() => {
                  setUsername('sv001');
                  setPassword('123456');
                }}
                sx={{ 
                  display: 'block',
                  color: 'primary.main', 
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                👨‍🎓 Sinh viên: sv001 / 123456
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}