// frontend/src/components/Footer.tsx
import React from 'react';
import { Box, Container, Typography, Divider, Grid, Link } from '@mui/material';
import { Email, Phone, LocationOn, Facebook, Twitter, Instagram } from '@mui/icons-material';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'primary.main',
        color: 'white',
        mt: 'auto',
        py: { xs: 3, md: 4 },
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Logo & Info */}
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                📚 English E-Learning
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, lineHeight: 1.6 }}>
                Hệ thống học tiếng Anh trực tuyến<br />
                Chất lượng - Hiệu quả - Hiện đại
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Link href="#" color="inherit" sx={{ '&:hover': { color: 'secondary.main' } }}>
                <Facebook />
              </Link>
              <Link href="#" color="inherit" sx={{ '&:hover': { color: 'secondary.main' } }}>
                <Twitter />
              </Link>
              <Link href="#" color="inherit" sx={{ '&:hover': { color: 'secondary.main' } }}>
                <Instagram />
              </Link>
            </Box>
          </Grid>

          {/* Contact Info */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Email fontSize="small" />
              📞 Liên hệ
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
              <Email fontSize="small" sx={{ mr: 1, mt: 0.5 }} />
              <Typography variant="body2">nthung@ctump.edu.vn</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <LocationOn fontSize="small" sx={{ mr: 1, mt: 0.5 }} />
              <Typography variant="body2">Bộ môn Ngoại ngữ, Khoa Khoa học cơ bản</Typography>
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              🚀 Liên kết nhanh
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/lectures" color="inherit" variant="body2" sx={{ '&:hover': { color: 'secondary.main' } }}>
                • Bài giảng
              </Link>
              <Link href="/assignments" color="inherit" variant="body2" sx={{ '&:hover': { color: 'secondary.main' } }}>
                • Bài tập
              </Link>
              <Link href="/qa" color="inherit" variant="body2" sx={{ '&:hover': { color: 'secondary.main' } }}>
                • Hỏi đáp
              </Link>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, bgcolor: 'rgba(255,255,255,0.2)' }} />

        {/* Copyright */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
            © {new Date().getFullYear()} English E-Learning System. All rights reserved.
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block', 
              opacity: 0.7,
              bgcolor: 'rgba(0,0,0,0.2)',
              px: 2,
              py: 0.5,
              borderRadius: 1,
              maxWidth: '600px',
              mx: 'auto'
            }}
          >
            Thiết kế bởi nthung@ctump.edu.vn, Bộ môn Ngoại ngữ, Khoa Khoa học cơ bản
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;