'use client';
import { useState, useEffect, useRef } from 'react';

const ASL_ALPHA = {};
'abcdefghijklmnopqrstuvwxyz'.split('').forEach(l => {
  ASL_ALPHA[l] = `https://www.lifeprint.com/asl101/fingerspelling/abc-gifs/${l}.gif`;
});

function getSignUrl(char) {
  const c = char.toLowerCase();
  return ASL_ALPHA[c] || null;
}

export default function SignDisplay({ text, active = true }) {
  const [words,         setWords]         = useState([]);
  const [wordIndex,     setWordIndex]     = useState(0);
  const [letterIndex,   setLetterIndex]   = useState(0);
  const [currentWord,   setCurrentWord]   = useState('');
  const [currentLetter, setCurrentLetter] = useState('');
  const [currentImg,    setCurrentImg]    = useState('');
  const [allDone,       setAllDone]       = useState(false);
  const [progress,      setProgress]      = useState([]);
  const timerRef = useRef(null);

  // Reset and start whenever text changes
  useEffect(() => {
    if (!text || !active) return;
    clearTimeout(timerRef.current);
    const w = text.trim().split(/\s+/).filter(Boolean);
    setWords(w);
    setWordIndex(0);
    setLetterIndex(0);
    setAllDone(false);
    setCurrentWord('');
    setCurrentLetter('');
    setCurrentImg('');
    setProgress([]);
  }, [text, active]);

  // Word changed
  useEffect(() => {
    if (!words.length) return;
    if (wordIndex >= words.length) { setAllDone(true); return; }
    const word = words[wordIndex];
    setCurrentWord(word);
    setLetterIndex(0);
    setCurrentLetter('');
    setCurrentImg('');
  }, [words, wordIndex]);

  // Letter changed
  useEffect(() => {
    if (!currentWord) return;
    const clean   = currentWord.toLowerCase().replace(/[^a-z]/g, '');
    const letters = clean.split('');
    if (!letters.length) {
      timerRef.current = setTimeout(() => setWordIndex(i => i + 1), 300);
      return;
    }
    if (letterIndex >= letters.length) {
      setProgress(prev => [...prev, currentWord.toUpperCase()]);
      timerRef.current = setTimeout(() => setWordIndex(i => i + 1), 800);
      return;
    }
    const letter = letters[letterIndex];
    setCurrentLetter(letter.toUpperCase());
    setCurrentImg(getSignUrl(letter) || '');
    timerRef.current = setTimeout(() => setLetterIndex(i => i + 1), 650);
    return () => clearTimeout(timerRef.current);
  }, [currentWord, letterIndex]);

  if (!text || !active) return null;

  const clean = currentWord ? currentWord.toLowerCase().replace(/[^a-z]/g, '') : '';

  return (
    <div style={{
      background: '#080D1A', border: '1px solid #1E2D4A',
      borderRadius: 16, padding: 20, marginTop: 12,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#06D6A0', textTransform: 'uppercase', letterSpacing: '.1em' }}>
          ASL Translation
        </div>
        <div style={{ fontSize: 11, color: allDone ? '#475569' : '#06D6A0' }}>
          {allDone ? 'Done' : 'Signing...'}
        </div>
      </div>

      {/* Full sentence progress */}
      <div style={{
        fontSize: 13, color: '#475569', marginBottom: 16,
        padding: '8px 12px', background: '#0A1628',
        borderRadius: 8, lineHeight: 1.8, letterSpacing: '.02em',
      }}>
        {words.map((w, i) => (
          <span key={i} style={{
            marginRight: 8,
            color: i < wordIndex ? '#06D6A0' : i === wordIndex ? '#F8FAFC' : '#334155',
            fontWeight: i === wordIndex ? 700 : 400,
            fontSize: i === wordIndex ? 15 : 13,
            transition: 'all .2s',
          }}>
            {w}
          </span>
        ))}
      </div>

      {/* Current sign */}
      {!allDone && currentWord && (
        <div style={{
          background: '#101828', borderRadius: 14, padding: 20,
          textAlign: 'center', border: '1px solid #1E2D4A',
        }}>
          <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 10 }}>
            Now signing
          </div>

          <div style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 22, fontWeight: 700, color: '#F8FAFC',
            marginBottom: 16, letterSpacing: '.08em',
          }}>
            {currentWord.toUpperCase()}
          </div>

          {/* ASL hand image */}
          {currentImg ? (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{
                width: 140, height: 140, borderRadius: 14,
                background: '#fff', overflow: 'hidden',
                border: '3px solid #06D6A0',
                boxShadow: '0 0 24px rgba(6,214,160,.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <img
                  src={currentImg}
                  alt={`ASL sign for letter ${currentLetter}`}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
            </div>
          ) : (
            <div style={{
              width: 140, height: 140, borderRadius: 14,
              background: '#0A1628', border: '3px solid #1E2D4A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', color: '#334155', fontSize: 13,
            }}>
              Space
            </div>
          )}

          {/* Current letter */}
          <div style={{
            fontSize: 38, fontWeight: 700, color: '#06D6A0',
            fontFamily: 'Space Grotesk, sans-serif', marginBottom: 14,
          }}>
            {currentLetter}
          </div>

          {/* Letter progress dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
            {clean.split('').map((l, i) => (
              <div key={i} style={{
                width: 28, height: 28, borderRadius: 6,
                background: i < letterIndex ? 'rgba(6,214,160,.2)' : '#0A1628',
                border: `1px solid ${i < letterIndex ? 'rgba(6,214,160,.5)' : '#1E2D4A'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                color: i < letterIndex ? '#06D6A0' : '#334155',
                transition: 'all .2s',
              }}>
                {l.toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed words */}
      {progress.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {progress.map((w, i) => (
            <span key={i} style={{
              background: 'rgba(6,214,160,.1)',
              border: '1px solid rgba(6,214,160,.25)',
              color: '#06D6A0', padding: '3px 10px',
              borderRadius: 100, fontSize: 12, fontWeight: 600,
            }}>
              {w}
            </span>
          ))}
        </div>
      )}

      {/* All done */}
      {allDone && words.length > 0 && (
        <div style={{
          marginTop: 12, padding: '12px 16px',
          background: 'rgba(6,214,160,.07)',
          border: '1px solid rgba(6,214,160,.2)',
          borderRadius: 10, fontSize: 13, color: '#06D6A0', textAlign: 'center',
        }}>
          Signed: {text}
        </div>
      )}
    </div>
  );
}