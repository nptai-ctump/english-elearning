// frontend/src/components/AudioPlayer.tsx
import React, { useState } from 'react';
import { 
  Box, IconButton, Slider, Typography, CircularProgress 
} from '@mui/material';
import { 
  PlayCircleOutline, PauseCircleOutline, VolumeUp, VolumeOff 
} from '@mui/icons-material';

interface AudioPlayerProps {
  audioUrl: string;
  word?: string;
  autoPlay?: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, word, autoPlay = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [muted, setMuted] = useState(false);

  const audioRef = React.useRef<HTMLAudioElement>(null);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
    };

    const setTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setTimeUpdate);

    if (autoPlay) {
      audio.play().catch(() => {});
    }

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setTimeUpdate);
    };
  }, [autoPlay]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      setLoading(true);
      audio.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = !muted;
      setMuted(!muted);
    }
  };

  const handleTimeChange = (_: any, newValue: number | number[]) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = newValue as number;
      setCurrentTime(newValue as number);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 2, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <IconButton onClick={togglePlay} size="large">
          {loading ? (
            <CircularProgress size={32} />
          ) : isPlaying ? (
            <PauseCircleOutline sx={{ fontSize: 40, color: 'primary.main' }} />
          ) : (
            <PlayCircleOutline sx={{ fontSize: 40, color: 'primary.main' }} />
          )}
        </IconButton>

        <Box sx={{ flex: 1 }}>
          {word && (
            <Typography variant="h6" fontWeight={600} color="primary">
              {word}
            </Typography>
          )}
          <Slider
            value={currentTime}
            max={duration}
            onChange={handleTimeChange}
            size="small"
            sx={{ 
              mt: 1,
              '& .MuiSlider-thumb': { 
                width: 12, 
                height: 12,
                '&:hover': { boxShadow: '0 0 0 8px rgba(128, 0, 128, 0.16)' }
              }
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {formatTime(currentTime)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatTime(duration)}
            </Typography>
          </Box>
        </Box>

        <IconButton onClick={toggleMute}>
          {muted ? (
            <VolumeOff color="disabled" />
          ) : (
            <VolumeUp color="primary" />
          )}
        </IconButton>
      </Box>

      <audio
        ref={audioRef}
        src={audioUrl}
        onPlay={() => {
          setIsPlaying(true);
          setLoading(false);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onError={() => {
          setLoading(false);
          console.error('Audio playback error');
        }}
      />
    </Box>
  );
};

export default AudioPlayer;