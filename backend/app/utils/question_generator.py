"""
Automatic question generator from text
- Generate vocabulary questions
- Generate fill-in-the-blank questions
- Generate multiple choice questions
"""

import re
import random
from typing import List, Dict, Optional
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
from collections import Counter

# Download NLTK data (run once)
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')

def extract_keywords(text: str, top_k: int = 20) -> List[str]:
    """Extract important keywords from text"""
    # Tokenize words
    words = word_tokenize(text.lower())
    
    # Remove stopwords and non-alphabetic words
    stop_words = set(stopwords.words('english'))
    words = [w for w in words if w.isalpha() and w not in stop_words and len(w) > 3]
    
    # Count frequency
    word_counts = Counter(words)
    
    # Get top keywords
    return [word for word, _ in word_counts.most_common(top_k)]

def generate_vocabulary_questions(text: str, num_questions: int = 5) -> List[Dict]:
    """Generate vocabulary definition questions"""
    keywords = extract_keywords(text, top_k=num_questions * 2)
    
    questions = []
    for keyword in keywords[:num_questions]:
        # Simple definition (can be improved with dictionary API)
        questions.append({
            'type': 'vocabulary',
            'prompt': f'What is the meaning of "{keyword}"?',
            'keyword': keyword,
            'difficulty': 'medium'
        })
    
    return questions

def generate_fill_blank_questions(text: str, num_questions: int = 5) -> List[Dict]:
    """Generate fill-in-the-blank questions"""
    sentences = sent_tokenize(text)
    
    # Filter sentences with enough words
    sentences = [s for s in sentences if len(word_tokenize(s)) > 8]
    
    questions = []
    selected = random.sample(sentences, min(num_questions, len(sentences)))
    
    for sentence in selected:
        words = word_tokenize(sentence)
        # Remove stopwords
        content_words = [w for w in words if w.isalpha() and len(w) > 3]
        
        if content_words:
            # Choose a random word to blank
            blank_word = random.choice(content_words)
            question_text = sentence.replace(blank_word, '_____', 1)
            
            questions.append({
                'type': 'fill_blank',
                'prompt': question_text,
                'answer': blank_word,
                'original_sentence': sentence
            })
    
    return questions

def generate_multiple_choice_questions(text: str, num_questions: int = 5) -> List[Dict]:
    """Generate multiple choice questions"""
    keywords = extract_keywords(text, top_k=num_questions * 3)
    
    questions = []
    for keyword in keywords[:num_questions]:
        # Generate wrong answers (similar words)
        wrong_answers = []
        for w in keywords:
            if w != keyword and len(w) > 3:
                wrong_answers.append(w)
                if len(wrong_answers) >= 3:
                    break
        
        # Ensure we have 3 wrong answers
        while len(wrong_answers) < 3:
            wrong_answers.append(f"distractor_{len(wrong_answers)}")
        
        # Shuffle options
        options = [keyword] + wrong_answers[:3]
        random.shuffle(options)
        
        questions.append({
            'type': 'multiple_choice',
            'prompt': f'Which word best fits the context?',
            'options': options,
            'correct': keyword,
            'difficulty': 'medium'
        })
    
    return questions

def generate_reading_comprehension(text: str, num_questions: int = 3) -> List[Dict]:
    """Generate reading comprehension questions"""
    sentences = sent_tokenize(text)
    
    questions = []
    for i in range(min(num_questions, len(sentences))):
        sentence = sentences[i]
        
        # Simple question: "What is mentioned in the text?"
        questions.append({
            'type': 'reading_comprehension',
            'prompt': 'According to the text, what is the main idea?',
            'reference_sentence': sentence[:100] + '...',
            'difficulty': 'medium'
        })
    
    return questions

def generate_all_questions(text: str, config: Dict = None) -> Dict[str, List]:
    """
    Generate all types of questions from text
    Returns dict with different question types
    """
    if config is None:
        config = {
            'vocabulary': 5,
            'fill_blank': 5,
            'multiple_choice': 5,
            'reading_comprehension': 3
        }
    
    return {
        'vocabulary': generate_vocabulary_questions(text, config['vocabulary']),
        'fill_blank': generate_fill_blank_questions(text, config['fill_blank']),
        'multiple_choice': generate_multiple_choice_questions(text, config['multiple_choice']),
        'reading_comprehension': generate_reading_comprehension(text, config['reading_comprehension'])
    }

# Test function
if __name__ == "__main__":
    print("Testing question generator...")
    
    sample_text = """
    English is a West Germanic language that was first spoken in early medieval England 
    and eventually became a global lingua franca. It is named after the Angles, one of 
    the ancient Germanic peoples that migrated to the area of Great Britain that later 
    took their name, England. Both names derive from Anglia, a peninsula on the Baltic 
    Sea. English is most closely related to Frisian and Low Saxon.
    """
    
    questions = generate_all_questions(sample_text, {
        'vocabulary': 3,
        'fill_blank': 3,
        'multiple_choice': 3,
        'reading_comprehension': 2
    })
    
    print(f"Generated {len(questions['vocabulary'])} vocabulary questions")
    print(f"Generated {len(questions['fill_blank'])} fill-in-blank questions")
    print(f"Generated {len(questions['multiple_choice'])} multiple choice questions")
    print(f"Generated {len(questions['reading_comprehension'])} reading comprehension questions")
    
    print("\nSample vocabulary question:")
    if questions['vocabulary']:
        print(questions['vocabulary'][0])
    
    print("\n✓ Question generator ready")