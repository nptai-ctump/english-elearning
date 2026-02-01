// frontend/src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Grid, Typography, Card, CardContent, 
  Button, Divider, Alert, CircularProgress, Tooltip, Chip
} from '@mui/material';
import { 
  School, Assignment, Assessment, Person, 
  AutoStories, Message, VolumeUp, Home 
} from '@mui/icons-material';
import { api } from '../api/client';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/student/progress');
      setStats(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureClick = (feature: string) => {
    switch(feature) {
      case 'lectures':
        navigate('/lectures');
        break;
      case 'assignments':
        navigate('/assignments');
        break;
      case 'homework':
        navigate('/homework');
        break;
      case 'progress':
        navigate('/progress');
        break;
      case 'qa':
        navigate('/qa');
        break;
      case 'pronunciation':
        navigate('/pronunciation');
        break;
      default:
        navigate('/dashboard');
    }
  };

  const featureCards = [
    {
      id: 'lectures',
      title: 'Bài giảng',
      description: 'Upload và xem bài giảng (PDF, DOCX, PPTX)',
      icon: <School fontSize="large" />,
      color: '#4361ee',
      border: '1px solid #4361ee',
      hoverColor: '#3a56d4'
    },
    {
      id: 'assignments',
      title: 'Đề thi',
      description: 'Tạo đề thi tự động từ văn bản',
      icon: <Assignment fontSize="large" />,
      color: '#4cc9f0',
      border: '1px solid #4cc9f0',
      hoverColor: '#3ab7e0'
    },
    {
      id: 'homework',
      title: 'Bài tập',
      description: 'Giao bài tập với thời gian hạn chế',
      icon: <AutoStories fontSize="large" />,
      color: '#7209b7',
      border: '1px solid #7209b7',
      hoverColor: '#5a078d'
    },
    {
      id: 'progress',
      title: 'Tiến độ',
      description: 'Theo dõi tiến độ học tập',
      icon: <Assessment fontSize="large" />,
      color: '#f72585',
      border: '1px solid #f72585',
      hoverColor: '#e01a72'
    },
    {
      id: 'qa',
      title: 'Hỏi đáp',
      description: 'Trò chuyện với giáo viên',
      icon: <Message fontSize="large" />,
      color: '#4895ef',
      border: '1px solid #4895ef',
      hoverColor: '#3a7cd6'
    },
    {
      id: 'pronunciation',
      title: 'Phát âm',
      description: 'Nghe phát âm từ vựng (Text-to-Speech)',
      icon: <VolumeUp fontSize="large" />,
      color: '#4cc9f0',
      border: '1px solid #4cc9f0',
      hoverColor: '#3ab7e0'
    }
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 4 }}>
        <Container>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            📚 English E-Learning System
          </Typography>
          <Typography variant="h6" opacity={0.9}>
            Hệ thống học tiếng Anh trực tuyến
          </Typography>
        </Container>
      </Box>

      <Container sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Typography variant="h4" fontWeight={700}>
            Trang chủ
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="outlined" 
              startIcon={<Home />}
              onClick={() => navigate('/dashboard')}
              sx={{ 
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': { 
                  bgcolor: 'primary.light',
                  borderColor: 'primary.dark'
                }
              }}
            >
              Trang chủ
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => navigate('/lectures')}
            >
              Bài giảng
            </Button>
          </Box>
        </Box>

        {/* Statistics */}
        {stats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card sx={{ 
                height: '100%', 
                border: '1px solid #4361ee', 
                bgcolor: '#f8f9fa',
                '&:hover': { 
                  transform: 'translateY(-2px)',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                  borderColor: '#3a56d4'
                }
              }}>
                <CardContent>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 2 
                  }}>
                    <Typography variant="h6" color="primary" fontWeight={600}>
                      Bài giảng
                    </Typography>
                    <School color="primary" fontSize="large" />
                  </Box>
                  <Typography variant="h4" fontWeight={700} color="primary">
                    {stats.lectures?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    tài liệu đã tải lên
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card sx={{ 
                height: '100%', 
                border: '1px solid #4cc9f0', 
                bgcolor: '#f8f9fa',
                '&:hover': { 
                  transform: 'translateY(-2px)',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                  borderColor: '#3ab7e0'
                }
              }}>
                <CardContent>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 2 
                  }}>
                    <Typography variant="h6" color="info" fontWeight={600}>
                      Bài tập
                    </Typography>
                    <Assignment color="info" fontSize="large" />
                  </Box>
                  <Typography variant="h4" fontWeight={700} color="info">
                    {stats.assignments?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    bài tập đang chờ làm
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card sx={{ 
                height: '100%', 
                border: '1px solid #7209b7', 
                bgcolor: '#f8f9fa',
                '&:hover': { 
                  transform: 'translateY(-2px)',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                  borderColor: '#5a078d'
                }
              }}>
                <CardContent>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 2 
                  }}>
                    <Typography variant="h6" color="secondary" fontWeight={600}>
                      Hoàn thành
                    </Typography>
                    <Assessment color="secondary" fontSize="large" />
                  </Box>
                  <Typography variant="h4" fontWeight={700} color="secondary">
                    {stats.completed_assignments || 0}/{stats.total_assignments || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    bài tập đã hoàn thành
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card sx={{ 
                height: '100%', 
                border: '1px solid #f72585', 
                bgcolor: '#f8f9fa',
                '&:hover': { 
                  transform: 'translateY(-2px)',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                  borderColor: '#e01a72'
                }
              }}>
                <CardContent>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 2 
                  }}>
                    <Typography variant="h6" color="error" fontWeight={600}>
                      Điểm trung bình
                    </Typography>
                    <Person color="error" fontSize="large" />
                  </Box>
                  <Typography variant="h4" fontWeight={700} color="error">
                    {stats.average_score || 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    trên {stats.completed_assignments || 0} bài
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Feature Grid */}
        <Box sx={{ 
          mb: 4,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 3
        }}>
          {featureCards.map((feature, index) => (
            <Tooltip title={feature.description} key={index}>
              <Card 
                sx={{ 
                  border: feature.border,
                  bgcolor: '#f8f9fa',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': { 
                    transform: 'translateY(-5px)',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                    borderColor: feature.hoverColor
                  }
                }}
                onClick={() => handleFeatureClick(feature.id)}
              >
                <CardContent sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  textAlign: 'center',
                  p: 3
                }}>
                  <Box sx={{ 
                    width: 80, 
                    height: 80,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: `${feature.color}10`,
                    mb: 2
                  }}>
                    <Box sx={{ 
                      width: 60, 
                      height: 60,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems 'center',
                      justifyContent: 'center',
                      bgcolor: `${feature.color}20`,
                      color: feature.color
                    }}>
                      {feature.icon}
                    </Box>
                  </Box>
                  
                  <Typography variant="h6" fontWeight={700} color={feature.color} gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Tooltip>
          ))}
        </Box>

        {/* Recent Activity */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 2 
            }}>
              <Typography variant="h6" fontWeight={700}>
                Hoạt động gần đây
              </Typography>
              <Button 
                variant="text" 
                color="primary"
                onClick={() => navigate('/progress')}
              >
                Xem tất cả
              </Button>
            </Box>
            
            {stats?.recent_activity?.length === 0 ? (
              <Typography color="text.secondary" align="center" py={3}>
                Chưa có hoạt động nào
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {stats.recent_activity.map((activity: any, index: number) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'background.paper', 
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        bgcolor: 'primary.light',
                        borderColor: 'primary.main'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography fontWeight={600}>
                        {activity.assignment_title}
                      </Typography>
                      <Chip
                        label={`${activity.score}%`}
                        color={activity.score >= 70 ? 'success' : activity.score >= 50 ? 'warning' : 'error'}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Nộp lúc: {new Date(activity.finished_at).toLocaleString('vi-VN')}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>

      <Footer />
    </Box>
  );
};

export default Dashboard;