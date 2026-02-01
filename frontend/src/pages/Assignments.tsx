// frontend/src/pages/Assignments.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Card, CardContent, 
  Button, TextField, Alert, CircularProgress, List, ListItem
} from '@mui/material';
import { Assignment, Assessment, PlayCircle } from '@mui/icons-material';
import { api } from '../api/client';
import Footer from '../components/Footer';

const Assignments: React.FC = () => {
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [timeLimit, setTimeLimit] = useState('60');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const response = await api.get('/assignments');
      setAssignments(response.data);
    } catch (err) {
      console.error('Error loading assignments:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !instructions || !dueDate || !timeLimit) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const payload = {
        title,
        instructions,
        due_at: dueDate,
        time_limit_minutes: parseInt(timeLimit)
      };

      const response = await api.post('/teacher/assignments', payload);
      
      setSuccess(true);
      setError('');
      setTitle('');
      setInstructions('');
      setDueDate('');
      setTimeLimit('60');
      setAssignments(prev => [...prev, response.data]);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Lỗi tạo bài tập. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 4 }}>
        <Container>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            📝 Bài tập
          </Typography>
          <Typography variant="h6" opacity={0.9}>
            Tạo và quản lý bài tập
          </Typography>
        </Container>
      </Box>

      <Container sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" fontWeight={700} mb={2}>
            Tạo bài tập mới
          </Typography>
          
          <Card sx={{ 
            border: '1px solid #4cc9f0', 
            bgcolor: '#f8f9fa',
            '&:hover': { 
              boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
              borderColor: '#3ab7e0'
            }
          }}>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Tiêu đề bài tập"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  margin="normal"
                  required
                />
                
                <TextField
                  fullWidth
                  label="Hướng dẫn"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  margin="normal"
                  multiline
                  rows={4}
                  required
                />
                
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Hạn nộp"
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                  
                  <TextField
                    fullWidth
                    label="Thời gian làm bài (phút)"
                    type="number"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(e.target.value)}
                    inputProps={{ min: 1 }}
                    required
                  />
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>Bài tập đã được tạo thành công!</Alert>}

                <Button
                  type="submit"
                  variant="contained"
                  color="info"
                  disabled={loading}
                  sx={{ 
                    py: 1.5,
                    borderRadius: 2,
                    '&:hover': { 
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(76, 201, 240, 0.3)'
                    }
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Tạo bài tập'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Typography variant="h5" fontWeight={700} mb={2}>
            Danh sách bài tập
          </Typography>
          
          {assignments.length === 0 ? (
            <Box sx={{ 
              textAlign: 'center', 
              p: 4, 
              bgcolor: 'background.paper',
              borderRadius: 2,
              border: '1px dashed #ccc'
            }}>
              <Assessment fontSize="large" color="action" sx={{ mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Chưa có bài tập nào
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Hãy tạo bài tập đầu tiên để bắt đầu
              </Typography>
            </Box>
          ) : (
            <List>
              {assignments.map((assignment, index) => (
                <ListItem 
                  key={index} 
                  sx={{ 
                    bgcolor: 'background.paper', 
                    mb: 2, 
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      bgcolor: 'info.light',
                      borderColor: 'info.main'
                    }
                  }}
                >
                  <Box sx={{ flex: 1, p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" fontWeight={600}>
                        {assignment.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Hạn: {new Date(assignment.due_at).toLocaleString('vi-VN')}
                      </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                      {assignment.instructions}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Button 
                        variant="outlined" 
                        size="small"
                        startIcon={<PlayCircle />}
                        onClick={() => alert('Chức năng đang phát triển')}
                      >
                        Làm bài
                      </Button>
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={() => alert('Chức năng đang phát triển')}
                      >
                        Xem kết quả
                      </Button>
                    </Box>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default Assignments;