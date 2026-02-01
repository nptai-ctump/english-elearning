import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Card, CardContent, 
  Button, TextField, Alert, CircularProgress, List, ListItem
} from '@mui/material';
import { api } from '../api/client';
import { School, CloudUpload } from '@mui/icons-material';
import Footer from '../components/Footer';

const Lectures: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [uploadedLectures, setUploadedLectures] = useState<any[]>([]);

  useEffect(() => {
    loadLectures();
  }, []);

  const loadLectures = async () => {
    try {
      const response = await api.get('/lectures');
      setUploadedLectures(response.data);
    } catch (err) {
      console.error('Error loading lectures:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Vui lòng chọn file trước');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', fileName.split('.')[0]);
      formData.append('description', 'Bài giảng tự động upload');
      formData.append('generate_questions', 'true');

      const response = await api.post('/teacher/lectures/upload-with-questions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess(true);
      setError('');
      setFile(null);
      setFileName('');
      setUploadedLectures(prev => [...prev, response.data]);
      
      // Auto-scroll to the new lecture
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Lỗi tải lên bài giảng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 4 }}>
        <Container>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            📚 Bài giảng
          </Typography>
          <Typography variant="h6" opacity={0.9}>
            Tải lên và quản lý bài giảng
          </Typography>
        </Container>
      </Box>

      <Container sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" fontWeight={700} mb={2}>
            Tải lên bài giảng mới
          </Typography>
          
          <Card sx={{ 
            border: '1px solid #4361ee', 
            bgcolor: '#f8f9fa',
            '&:hover': { 
              boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
              borderColor: '#3a56d4'
            }
          }}>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <Typography variant="body1" color="text.secondary" mb={2}>
                  Tải lên bài giảng (PDF, DOCX, PPTX) để tự động tạo câu hỏi
                </Typography>
                
                <Box sx={{ 
                  border: '2px dashed #4361ee', 
                  borderRadius: 2, 
                  p: 4,
                  textAlign: 'center',
                  mb: 3,
                  bgcolor: '#f0f4ff',
                  '&:hover': { 
                    borderColor: '#3a56d4',
                    bgcolor: '#e6edff'
                  }
                }}>
                  <CloudUpload fontSize="large" color="primary" sx={{ mb: 2 }} />
                  <Typography variant="h6" fontWeight={600} color="primary">
                    Kéo và thả file vào đây
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    hoặc
                  </Typography>
                  <Button 
                    variant="outlined" 
                    component="label" 
                    sx={{ 
                      borderColor: '#4361ee',
                      color: '#4361ee',
                      '&:hover': { 
                        bgcolor: '#e6edff',
                        borderColor: '#3a56d4'
                      }
                    }}
                  >
                    Chọn file
                    <input 
                      type="file" 
                      hidden 
                      onChange={handleFileChange}
                      accept=".pdf,.docx,.pptx"
                    />
                  </Button>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Hỗ trợ: PDF, DOCX, PPTX
                  </Typography>
                </Box>

                {fileName && (
                  <TextField
                    fullWidth
                    label="Tên bài giảng"
                    value={fileName.split('.')[0]}
                    onChange={(e) => setFileName(e.target.value + '.' + fileName.split('.').pop())}
                    margin="normal"
                  />
                )}

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>Bài giảng đã được tải lên thành công!</Alert>}

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  sx={{ 
                    py: 1.5,
                    borderRadius: 2,
                    '&:hover': { 
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(67, 97, 238, 0.3)'
                    }
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Tải lên và tạo câu hỏi'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Typography variant="h5" fontWeight={700} mb={2}>
            Danh sách bài giảng
          </Typography>
          
          {uploadedLectures.length === 0 ? (
            <Box sx={{ 
              textAlign: 'center', 
              p: 4, 
              bgcolor: 'background.paper',
              borderRadius: 2,
              border: '1px dashed #ccc'
            }}>
              <School fontSize="large" color="action" sx={{ mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Chưa có bài giảng nào được tải lên
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Hãy tải lên bài giảng đầu tiên để bắt đầu
              </Typography>
            </Box>
          ) : (
            <List>
              {uploadedLectures.map((lecture, index) => (
                <ListItem 
                  key={index} 
                  sx={{ 
                    bgcolor: 'background.paper', 
                    mb: 2, 
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      bgcolor: 'primary.light',
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  <Box sx={{ flex: 1, p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" fontWeight={600}>
                        {lecture.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(lecture.created_at).toLocaleDateString('vi-VN')}
                      </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                      {lecture.description || 'Bài giảng không có mô tả'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button 
                        variant="outlined" 
                        size="small"
                        startIcon={<CloudUpload />}
                        onClick={() => window.open(lecture.file_path, '_blank')}
                      >
                        Xem
                      </Button>
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={() => alert('Chức năng đang phát triển')}
                      >
                        Tạo đề thi
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

export default Lectures;
