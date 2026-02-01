# backend/app/utils/tts.py
"""
Text-to-Speech utilities
- Convert text to audio
- Generate pronunciation for vocabulary
"""

import os
from gtts import gTTS
from typing import Optional
import hashlib

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
AUDIO_DIR = os.path.join(UPLOAD_DIR, "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

def text_to_speech(text: str, lang: str = 'en', slow: bool = False) -> Optional[str]:
    """
    Convert text to speech and save as MP3 file
    
    Args:
        text: Text to convert
        lang: Language code ('en' for English, 'vi' for Vietnamese)
        slow: Speak slowly if True
        
    Returns:
        Path to audio file or None if error
    """
    try:
        # Generate unique filename based on text content
        text_hash = hashlib.md5(text.encode()).hexdigest()[:16]
        filename = f"tts_{lang}_{text_hash}.mp3"
        filepath = os.path.join(AUDIO_DIR, filename)
        
        # Skip if file already exists
        if os.path.exists(filepath):
            return filepath
        
        # Generate speech
        tts = gTTS(text=text, lang=lang, slow=slow)
        tts.save(filepath)
        
        return filepath
        
    except Exception as e:
        print(f"Error generating TTS: {e}")
        return None

def generate_vocabulary_audio(word: str, definition: str = "") -> dict:
    """
    Generate audio for vocabulary word and definition
    
    Returns:
        dict with paths to word audio and definition audio
    """
    word_audio = text_to_speech(word, lang='en')
    
    definition_audio = None
    if definition:
        definition_audio = text_to_speech(definition, lang='vi')
    
    return {
        'word': word,
        'word_audio': word_audio,
        'definition': definition,
        'definition_audio': definition_audio
    }

def get_audio_url(filepath: str) -> str:
    """Get public URL for audio file"""
    if not filepath:
        return ""
    
    # Convert absolute path to relative path
    if filepath.startswith(UPLOAD_DIR):
        return filepath.replace(UPLOAD_DIR, '/uploads')
    
    return filepath

# Test function
if __name__ == "__main__":
    print("Testing TTS...")
    
    # Test English
    result = text_to_speech("Hello, how are you?", lang='en')
    print(f"English TTS: {result}")
    
    # Test Vietnamese
    result = text_to_speech("Xin chào, bạn khỏe không?", lang='vi')
    print(f"Vietnamese TTS: {result}")
    
    print("✓ TTS ready")