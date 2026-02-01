// frontend/src/pages/Pronunciation.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Card, CardContent, 
  Button, TextField, Alert, CircularProgress, List, ListItem, Grid
} from '@mui/material';
import { VolumeUp, Mic, Speaker } from '@mui/icons-material';
import { api } from '../api/client';
import AudioPlayer from '../components/AudioPlayer';
import Footer from '../components/Footer';

const Pronunciation: React.FC = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [vocabulary, setVocabulary] = useState<any[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedWordAudio, setSelectedWordAudio] = useState<string | null>(null);
  const [selectedDefinition, setSelectedDefinition] = useState<string | null>(null);
  const [selectedDefinitionAudio, setSelectedDefinitionAudio] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingText, setRecordingText] = useState('');
  const [selectedLecture, setSelectedLecture] = useState<string | null>(null);

  useEffect(() => {
    loadVocabulary();
  }, []);

  const loadVocabulary = async () => {
    try {
      // Lấy danh sách từ vựng từ bài giảng
      const lecturesResponse = await api.get('/lectures');
      if (lecturesResponse.data.length > 0) {
        setSelectedLecture(lecturesResponse.data[0].id);
        
        // Lấy từ vựng từ bài giảng đầu tiên
        const vocabularyResponse = await api.get(`/lectures/${lecturesResponse.data[0].id}/vocabulary`);
        setVocabulary(vocabularyResponse.data.vocabulary);
      }
    } catch (err) {
      console.error('Error loading vocabulary:', err);
    }
  };

  const handleTextToSpeech = async () => {
    if (!text.trim()) {
      setError('Vui lòng nhập văn bản');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/text-to-speech', { text });
      const audioUrl = response.data.audio_url;
      
      // Tạo URL đầy đủ
      const fullAudioUrl = audioUrl.startsWith('http') ? audioUrl : `http://localhost:8000${audioUrl}`;
      
      // Tạo audio element và phát
      const audio = new Audio(fullAudioUrl);
      audio.play().catch(e => console.error('Audio play error:', e));
      
      // Tự động chuyển về trang chủ sau 5 giây
      setTimeout(() => {
        window.history.back();
      }, 5000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Lỗi chuyển văn bản thành giọng nói. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleWordClick = (word: string, audioUrl: string, definition: string) => {
    setSelectedWord(word);
    setSelectedWordAudio(audioUrl);
    setSelectedDefinition(definition);
    
    // Tự động phát audio
    const audio = new Audio(audioUrl);
    audio.play().catch(e => console.error('Audio play error:', e));
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingText('');
    
    // Mô phỏng ghi âm
    setTimeout(() => {
      setRecordingText('This is a test sentence for pronunciation practice.');
      setIsRecording(false);
    }, 3000);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 4 }}>
        <Container>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            🎧 Phát âm
          </Typography>
          <Typography variant="h6" opacity={0.9}>
            Luyện phát âm và nghe từ vựng
          </Typography>
        </Container>
      </Box>

      <Container sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* Left Column - Text to Speech */}
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              border: '1px solid #4cc9f0', 
              bgcolor: '#f8f9fa',
              '&:hover': { 
                boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                borderColor: '#3ab7e0'
              }
            }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Chuyển văn bản thành giọng nói
                </Typography>
                
                <TextField
                  fullWidth
                  label="Nhập văn bản"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  margin="normal"
                  multiline
                  rows={4}
                  placeholder="Nhập văn bản cần chuyển thành giọng nói..."
                />
                
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                
                <Button
                  variant="contained"
                  color="info"
                  disabled={loading}
                  onClick={handleTextToSpeech}
                  sx={{ 
                    py: 1.5,
                    borderRadius: 2,
                    '&:hover': { 
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(76, 201, 240, 0.3)'
                    }
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Chuyển thành giọng nói'}
                </Button>
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                  Ví dụ: "English is a West Germanic language that was first spoken in early medieval England"
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column - Vocabulary Practice */}
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              border: '1px solid #4895ef', 
              bgcolor: '#f8f9fa',
              '&:hover': { 
                boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                borderColor: '#3a7cd6'
              }
            }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  Luyện phát âm từ vựng
                </Typography>
                
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Chọn từ vựng để luyện phát âm
                </Typography>
                
                {vocabulary.length === 0 ? (
                  <Box sx={{ 
                    textAlign: 'center', 
                    p: 2, 
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    border: '1px dashed #ccc'
                  }}>
                    <VolumeUp fontSize="large" color="action" sx={{ mb: 1 }} />
                    <Typography variant="body1" color="text.secondary">
                      Chưa có từ vựng
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Hãy tải bài giảng trước để có từ vựng
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      p: 2,
                      bgcolor: 'background.paper',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider'
                    }}>
                      <VolumeUp color="primary" sx={{ fontSize: 32 }} />
                      <Box>
                        {selectedWord ? (
                          <Typography variant="h6" fontWeight={600}>
                            {selectedWord}
                          </Typography>
                        ) : (
                          <Typography variant="h6" fontWeight={600}>
                            Chọn từ vựng
                          </Typography>
                        )}
                        
                        {selectedDefinition && (
                          <Typography variant="body1" color="text.secondary">
                            {selectedDefinition}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    
                    {selectedWordAudio && (
                      <AudioPlayer 
                        audioUrl={selectedWordAudio} 
                        word={selectedWord || ''}
                        autoPlay={true}
                      />
                    )}
                    
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                      gap: 1,
                      mt: 2
                    }}>
                      {vocabulary.map((item, index) => (
                        <Button
                          key={index}
                          variant="outlined"
                          color="primary"
                          onClick={() => handleWordClick(item.word, item.audio_url, item.definition)}
                          sx={{ 
                            borderRadius: 2,
                            py: 1,
                            '&:hover': {
                              bgcolor: 'primary.light',
                              borderColor: 'primary.dark'
                            }
                          }}
                        >
                          {item.word}
                        </Button>
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Recording Section */}
        <Box sx={{ mt: 4 }}>
          <Card sx={{ 
            border: '1px solid #f72585', 
            bgcolor: '#f8f9fa',
            '&:hover': { 
              boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
              borderColor: '#e01a72'
            }
          }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Ghi âm và so sánh
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                mb: 2
              }}>
                <TextField
                  fullWidth
                  label="Nhập văn bản cần ghi âm"
                  value={recordingText}
                  onChange={(e) => setRecordingText(e.target.value)}
                  disabled={isRecording}
                  multiline
                  rows={3}
                />
                
                {isRecording ? (
                  <Button 
                    variant="contained" 
                    color="error"
                    onClick={handleStopRecording}
                    sx={{ 
                      py: 1.5,
                      px: 3,
                      borderRadius: 2,
                      '&:hover': { 
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(247, 37, 133, 0.3)'
                      }
                    }}
                  >
                    Dừng ghi
                  </Button>
                ) : (
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={handleStartRecording}
                    disabled={loading}
                    sx={{ 
                      py: 1.5,
                      px: 3,
                      borderRadius: 2,
                      '&:hover': { 
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(67, 97, 238, 0.3)'
                      }
                    }}
                  >
                    Ghi âm
                  </Button>
                )}
              </Box>
              
              {recordingText && (
                <Box sx={{ 
                  p: 2,
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  mt: 2
                }}>
                  <Typography variant="h6" fontWeight={600} mb={1}>
                    Văn bản ghi âm:
                  </Typography>
                  <Typography variant="body1">
                    {recordingText}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default Pronunciation;