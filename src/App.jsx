import { useState, useEffect } from 'react';
import './App.css';

// Sound effects generated dynamically using the Web Audio API
const playSynthesizedSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (type === 'correct') {
      // High-pitched cheerful double chime (C5 -> E5 -> G5)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'wrong') {
      // Gentle low buzzer/boop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'success') {
      // Big triumphant major chord arpeggio
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C4, E4, G4, C5, E5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.06, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.5);
      });
    }
  } catch (err) {
    console.warn('Audio blocked or not supported by browser:', err);
  }
};

// Words spelling list
const SPELLING_WORDS = [
  { word: "apple", clue: "A round red or green fruit that keeps the doctor away!" },
  { word: "banana", clue: "A long yellow fruit monkeys love to eat." },
  { word: "cat", clue: "A furry pet that goes meow and chases mice." },
  { word: "dog", clue: "Man's best friend that wags its tail and barks." },
  { word: "elephant", clue: "A huge grey animal with a trunk and large ears." },
  { word: "giraffe", clue: "A very tall animal with a long neck and spots." },
  { word: "house", clue: "A building where people or families live." },
  { word: "ocean", clue: "A huge body of salty water where fish swim." },
  { word: "robot", clue: "A metal machine that can follow computer programs." },
  { word: "school", clue: "A place where kids go to learn and meet friends." },
  { word: "rocket", clue: "A fast vehicle used to travel into outer space." },
  { word: "dinosaur", clue: "An ancient giant reptile that ruled the Earth long ago." },
  { word: "rainbow", clue: "A beautiful arc of colors in the sky after it rains." },
  { word: "spider", clue: "A creepy-crawly friend with eight legs that spins webs." },
  { word: "butterfly", clue: "An insect with colorful wings that flutters around flowers." }
];

const AVATARS = [
  { emoji: "🦁", name: "Leo" },
  { emoji: "🐼", name: "Penny" },
  { emoji: "🦊", name: "Foxy" },
  { emoji: "🦄", name: "Uni" },
  { emoji: "Rex", emoji: "🦖", name: "Rex" },
  { emoji: "🐙", name: "Ollie" },
  { emoji: "🐝", name: "Buzz" },
  { emoji: "🦉", name: "Ollie" }
];

// Helper to shuffle letters
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Speak a word using Browser SpeechSynthesis
const speakWord = (word) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.8; // Speak slightly slower for kids
    utterance.pitch = 1.1; // Higher friendly pitch
    window.speechSynthesis.speak(utterance);
  }
};

function App() {
  // --- PROFILE / USER SYSTEM ---
  const [profileName, setProfileName] = useState(() => localStorage.getItem('quest_kid_name') || '');
  const [profileAvatar, setProfileAvatar] = useState(() => localStorage.getItem('quest_kid_avatar') || '🦁');
  const [stars, setStars] = useState(() => parseInt(localStorage.getItem('quest_kid_stars')) || 0);
  const [streak, setStreak] = useState(() => parseInt(localStorage.getItem('quest_kid_streak')) || 1);
  const [badges, setBadges] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('quest_kid_badges')) || [];
    } catch {
      return [];
    }
  });

  const [hasProfile, setHasProfile] = useState(() => !!localStorage.getItem('quest_kid_name'));
  const [tempName, setTempName] = useState('');
  const [tempAvatar, setTempAvatar] = useState('🦁');

  // --- SCREEN ROUTING ---
  // 'profile-select' | 'dashboard' | 'spelling' | 'math'
  const [screen, setScreen] = useState(hasProfile ? 'dashboard' : 'profile-select');

  // --- CONFETTI ANIMATION STATE ---
  const [showConfetti, setShowConfetti] = useState(false);

  // --- GAME MODALS / FEEDBACK ---
  const [activeModal, setActiveModal] = useState(null); // 'spelling-win' | 'math-win' | 'new-badge'
  const [newBadgeEarned, setNewBadgeEarned] = useState(null);

  // --- SPELLING GAME STATE ---
  const [spellingRoundWords, setSpellingRoundWords] = useState([]);
  const [spellingWordIndex, setSpellingWordIndex] = useState(0);
  const [scrambledLetters, setScrambledLetters] = useState([]);
  const [assembledIndices, setAssembledIndices] = useState([]); // indices of scrambled letters used
  const [spellingCheckResult, setSpellingCheckResult] = useState(null); // 'correct' | 'wrong' | null
  const [showSpellingHint, setShowSpellingHint] = useState(false);

  // --- MATH GAME STATE ---
  const [mathFactor, setMathFactor] = useState(null); // specific table number (e.g. 5) or 'mixed'
  const [mathQuestions, setMathQuestions] = useState([]);
  const [mathQuestionIndex, setMathQuestionIndex] = useState(0);
  const [mathSelectedAnswer, setMathSelectedAnswer] = useState(null);
  const [mathCheckResult, setMathCheckResult] = useState(null); // 'correct' | 'wrong' | null

  // Sync profile details to localStorage
  useEffect(() => {
    if (profileName) {
      localStorage.setItem('quest_kid_name', profileName);
      localStorage.setItem('quest_kid_avatar', profileAvatar);
      localStorage.setItem('quest_kid_stars', stars.toString());
      localStorage.setItem('quest_kid_streak', streak.toString());
      localStorage.setItem('quest_kid_badges', JSON.stringify(badges));
    }
  }, [profileName, profileAvatar, stars, streak, badges]);

  // Canvas-based Confetti celebration effect
  useEffect(() => {
    if (!showConfetti) return;
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#c084fc', '#38bdf8', '#4ade80', '#fbbf24', '#fb7185', '#a855f7', '#6366f1'];
    const particles = Array.from({ length: 100 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 10 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedX: Math.random() * 5 - 2.5,
      speedY: Math.random() * 4 + 4,
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 6 - 3
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;
      
      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.y / 25) * 0.6;
        p.rotation += p.rotationSpeed;

        if (p.y < canvas.height) {
          active = true;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        
        // Draw cute little circles and stars
        ctx.beginPath();
        if (Math.random() > 0.5) {
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        } else {
          ctx.rect(-p.size / 2, -p.size / 2, p.size, p.size);
        }
        ctx.fill();
        ctx.restore();
      });

      if (active) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setShowConfetti(false);
      }
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [showConfetti]);

  // Create Profile handler
  const handleCreateProfile = (e) => {
    e.preventDefault();
    const nameToUse = tempName.trim() || 'Hero Kid';
    setProfileName(nameToUse);
    setProfileAvatar(tempAvatar);
    setStars(0);
    setStreak(1);
    setBadges([]);
    setHasProfile(true);
    setScreen('dashboard');
  };

  // Log Out / Reset Profile
  const handleResetProfile = () => {
    if (window.confirm("Do you want to reset your profile and statistics?")) {
      localStorage.clear();
      setProfileName('');
      setProfileAvatar('🦁');
      setStars(0);
      setStreak(1);
      setBadges([]);
      setHasProfile(false);
      setScreen('profile-select');
    }
  };

  // --- SPELLING ENGINE FUNCTIONS ---
  const startSpellingQuest = () => {
    // Select 5 random words
    const shuffled = shuffleArray(SPELLING_WORDS).slice(0, 5);
    setSpellingRoundWords(shuffled);
    setSpellingWordIndex(0);
    setSpellingCheckResult(null);
    setShowSpellingHint(false);
    setupWord(shuffled[0].word);
    setScreen('spelling');
  };

  const setupWord = (word) => {
    const scrambled = shuffleArray(word.split("")).map((char, index) => ({
      char,
      index, // Unique identifier to handle repeated characters
    }));
    setScrambledLetters(scrambled);
    setAssembledIndices([]);
    setSpellingCheckResult(null);
    setShowSpellingHint(false);
    // Automatically speak the word
    setTimeout(() => speakWord(word), 200);
  };

  const selectLetter = (scrambledItem) => {
    if (assembledIndices.includes(scrambledItem.index)) {
      // Remove from assembly
      setAssembledIndices(assembledIndices.filter(idx => idx !== scrambledItem.index));
    } else {
      // Add to assembly
      setAssembledIndices([...assembledIndices, scrambledItem.index]);
    }
    setSpellingCheckResult(null);
  };

  const clearAssembled = () => {
    setAssembledIndices([]);
    setSpellingCheckResult(null);
  };

  const checkSpelling = () => {
    const currentWordObj = spellingRoundWords[spellingWordIndex];
    const userSpelling = assembledIndices.map(idx => scrambledLetters.find(item => item.index === idx).char).join("");

    if (userSpelling.toLowerCase() === currentWordObj.word.toLowerCase()) {
      setSpellingCheckResult('correct');
      playSynthesizedSound('correct');
      setStars(prev => prev + 10);
      
      // Move to next word after a short delay
      setTimeout(() => {
        if (spellingWordIndex < spellingRoundWords.length - 1) {
          const nextIndex = spellingWordIndex + 1;
          setSpellingWordIndex(nextIndex);
          setupWord(spellingRoundWords[nextIndex].word);
        } else {
          // Finished the round!
          setShowConfetti(true);
          playSynthesizedSound('success');
          checkBadgesUnlocked('spelling');
          setActiveModal('spelling-win');
        }
      }, 1500);
    } else {
      setSpellingCheckResult('wrong');
      playSynthesizedSound('wrong');
    }
  };

  // --- MATH ENGINE FUNCTIONS ---
  const startMathQuest = (factor) => {
    setMathFactor(factor);
    // Generate 5 random multiplication questions
    const roundQuestions = [];
    for (let i = 0; i < 5; i++) {
      const f1 = factor === 'mixed' ? Math.floor(Math.random() * 11) + 2 : factor; // Mixed is 2-12, or specific factor
      const f2 = Math.floor(Math.random() * 11) + 2; // 2 to 12
      const answer = f1 * f2;
      
      // Generate multiple choice options (one correct, three incorrect)
      const options = new Set([answer]);
      while (options.size < 4) {
        // Generate values close to the correct answer
        const dev = Math.floor(Math.random() * 15) - 7;
        const alternative = Math.max(0, answer + dev);
        if (alternative !== answer) {
          options.add(alternative);
        }
      }

      roundQuestions.push({
        num1: f1,
        num2: f2,
        answer: answer,
        options: shuffleArray(Array.from(options))
      });
    }

    setMathQuestions(roundQuestions);
    setMathQuestionIndex(0);
    setMathSelectedAnswer(null);
    setMathCheckResult(null);
    setScreen('math');
  };

  const handleSelectMathOption = (option) => {
    if (mathCheckResult !== null) return; // Wait for next question
    setMathSelectedAnswer(option);
    
    const correctAns = mathQuestions[mathQuestionIndex].answer;
    if (option === correctAns) {
      setMathCheckResult('correct');
      playSynthesizedSound('correct');
      setStars(prev => prev + 10);

      setTimeout(() => {
        if (mathQuestionIndex < mathQuestions.length - 1) {
          setMathQuestionIndex(prev => prev + 1);
          setMathSelectedAnswer(null);
          setMathCheckResult(null);
        } else {
          // Completed round!
          setShowConfetti(true);
          playSynthesizedSound('success');
          checkBadgesUnlocked('math');
          setActiveModal('math-win');
        }
      }, 1500);
    } else {
      setMathCheckResult('wrong');
      playSynthesizedSound('wrong');
      // Let the child choose again
      setTimeout(() => {
        setMathCheckResult(null);
        setMathSelectedAnswer(null);
      }, 1200);
    }
  };

  // --- REWARDS & BADGES UNLOCK ---
  const checkBadgesUnlocked = (gameType) => {
    const newBadges = [...badges];
    let badgeEarnedName = null;

    if (gameType === 'spelling' && !badges.includes('Spelling Wizard')) {
      newBadges.push('Spelling Wizard');
      badgeEarnedName = 'Spelling Wizard';
    } else if (gameType === 'math' && !badges.includes('Times Table Titan')) {
      newBadges.push('Times Table Titan');
      badgeEarnedName = 'Times Table Titan';
    }

    if (stars >= 100 && !badges.includes('Centurion Star')) {
      newBadges.push('Centurion Star');
      badgeEarnedName = 'Centurion Star';
    }

    if (badgeEarnedName) {
      setBadges(newBadges);
      setNewBadgeEarned(badgeEarnedName);
    }
  };

  const getBadgeIcon = (name) => {
    switch (name) {
      case 'Spelling Wizard': return '🧙‍♂️';
      case 'Times Table Titan': return '⚡';
      case 'Centurion Star': return '👑';
      default: return '🏆';
    }
  };

  return (
    <div className="App">
      {/* Dynamic Confetti Layer */}
      {showConfetti && <canvas id="confetti-canvas" className="confetti-canvas"></canvas>}

      {/* HEADER SECTION (HIDDEN ON PROFILE CREATION) */}
      {screen !== 'profile-select' && (
        <header className="dashboard-header glass-panel pop-in">
          <div className="logo-area">
            <span className="logo-emoji">✨</span>
            <div>
              <h1>Learning Quest</h1>
              <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.8 }}>
                Fun with Spelling & Timetables!
              </p>
            </div>
          </div>

          <div className="stats-container">
            <div className="stat-chip">
              <span className="stat-icon">{profileAvatar}</span>
              <span>{profileName}</span>
            </div>
            <div className="stat-chip" title="Total Stars Earned">
              <span className="stat-icon">⭐</span>
              <span>{stars}</span>
            </div>
            <div className="stat-chip" title="Current Daily Streak">
              <span className="stat-icon">🔥</span>
              <span>{streak} days</span>
            </div>
            <button onClick={handleResetProfile} className="btn-clear" style={{ padding: '8px 16px', borderRadius: '50px', fontSize: '0.9rem' }}>
              Reset Profile
            </button>
          </div>
        </header>
      )}

      {/* SCREEN 1: PROFILE CREATION */}
      {screen === 'profile-select' && (
        <main className="profile-selection glass-panel pop-in">
          <h2 style={{ fontSize: '2.2rem', marginBottom: '8px', color: '#a855f7' }}>Welcome, Explorer! 🚀</h2>
          <p style={{ color: 'var(--text-muted)' }}>Choose your avatar and enter your name to start your learning quest!</p>
          
          <form onSubmit={handleCreateProfile}>
            <div className="avatar-grid">
              {AVATARS.map((av, index) => (
                <div
                  key={index}
                  className={`avatar-card ${tempAvatar === av.emoji ? 'selected' : ''}`}
                  onClick={() => setTempAvatar(av.emoji)}
                >
                  <span className="avatar-emoji">{av.emoji}</span>
                  <span className="avatar-name">{av.name}</span>
                </div>
              ))}
            </div>

            <div className="name-input-group">
              <input
                type="text"
                className="name-input"
                placeholder="What is your name?"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                maxLength={12}
                required
              />
              <button type="submit" className="btn-primary">
                Let's Go!
              </button>
            </div>
          </form>
        </main>
      )}

      {/* SCREEN 2: MAIN DASHBOARD */}
      {screen === 'dashboard' && (
        <main className="pop-in">
          {newBadgeEarned && (
            <div className="badge-reward pop-in" style={{ width: '100%', maxWidth: '350px', margin: '0 auto 24px' }}>
              <span className="badge-reward-icon">{getBadgeIcon(newBadgeEarned)}</span>
              <span className="badge-reward-title">New Badge Earned!</span>
              <p style={{ fontSize: '1.2rem', fontWeight: 600, margin: '4px 0 0' }}>{newBadgeEarned}</p>
              <button 
                onClick={() => setNewBadgeEarned(null)} 
                className="btn-primary" 
                style={{ marginTop: '12px', padding: '6px 12px', fontSize: '0.9rem' }}
              >
                Awesome!
              </button>
            </div>
          )}

          <div className="mode-grid">
            {/* SPELLING QUEST CARD */}
            <div className="glass-panel mode-card bounce-hover">
              <span className="mode-icon">📖</span>
              <h2>Spelling Quest</h2>
              <p>Listen to words and arrange letters to spell them correctly! Earn stars for every word you get right.</p>
              <button className="btn-primary btn-spelling" onClick={startSpellingQuest}>
                Play Spelling Quest
              </button>
            </div>

            {/* TIMETABLES ARENA CARD */}
            <div className="glass-panel mode-card bounce-hover">
              <span className="mode-icon">🧮</span>
              <h2>Timetables Arena</h2>
              <p>Master your multiplication tables. Practice specific sets or take on the mixed challenge arena!</p>
              <button className="btn-primary btn-math" onClick={() => setScreen('math-selection')}>
                Play Timetables
              </button>
            </div>
          </div>

          {/* Badges Section */}
          {badges.length > 0 && (
            <div className="glass-panel" style={{ marginTop: '32px', textAlign: 'center' }}>
              <h3>My Trophy Case 🏆</h3>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', marginTop: '16px' }}>
                {badges.map((b, i) => (
                  <div key={i} className="stat-chip" style={{ padding: '12px 24px', background: '#fef08a', border: '2px solid #eab308' }}>
                    <span style={{ fontSize: '1.5rem' }}>{getBadgeIcon(b)}</span>
                    <span style={{ color: '#854d0e', fontWeight: 700 }}>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      )}

      {/* SCREEN 3: TIMETABLE SELECTOR */}
      {screen === 'math-selection' && (
        <main className="game-container glass-panel pop-in">
          <button className="back-button" onClick={() => setScreen('dashboard')}>
            ◀ Back to Dashboard
          </button>
          
          <div className="timetable-selection">
            <h2>Select a Times Table to Practice</h2>
            <p style={{ color: 'var(--text-muted)' }}>Choose one table to practice or challenge yourself with the Mixed Challenge!</p>
            
            <div className="table-selector-grid">
              {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                <button
                  key={num}
                  className="table-selector-btn"
                  onClick={() => startMathQuest(num)}
                >
                  {num}×
                </button>
              ))}
              <button
                className="table-selector-btn mixed"
                onClick={() => startMathQuest('mixed')}
              >
                Mixed Challenge ⚡
              </button>
            </div>
          </div>
        </main>
      )}

      {/* SCREEN 4: SPELLING QUEST GAME */}
      {screen === 'spelling' && (
        <main className="game-container glass-panel pop-in">
          <button className="back-button" onClick={() => setScreen('dashboard')}>
            ◀ Exit Game
          </button>

          {/* Quest Progress */}
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(spellingWordIndex / spellingRoundWords.length) * 100}%` }}
              ></div>
            </div>
            <div className="progress-text">
              {spellingWordIndex + 1} / {spellingRoundWords.length}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '24px' }}>Spell the Word!</h2>
            
            {/* Audio Button */}
            <button 
              className="speaker-button"
              onClick={() => speakWord(spellingRoundWords[spellingWordIndex].word)}
              title="Hear the word again"
            >
              🔊
            </button>

            {/* Hint Display */}
            <div className="clue-box">
              <strong>Clue:</strong> {spellingRoundWords[spellingWordIndex].clue}
            </div>

            {/* Letter Slots (Current Guess) */}
            <div className="letters-assemble-container">
              <div className="letter-slots">
                {spellingRoundWords[spellingWordIndex].word.split("").map((_, i) => {
                  const letterItem = scrambledLetters.find(item => item.index === assembledIndices[i]);
                  return (
                    <div 
                      key={i} 
                      className={`letter-bubble ${letterItem ? 'active' : 'empty-slot'}`}
                      onClick={letterItem ? () => selectLetter(letterItem) : undefined}
                    >
                      {letterItem ? letterItem.char.toUpperCase() : ""}
                    </div>
                  );
                })}
              </div>

              {/* Scrambled Choices */}
              <div className="scrambled-letters">
                {scrambledLetters.map((item) => {
                  const isUsed = assembledIndices.includes(item.index);
                  return (
                    <div
                      key={item.index}
                      className={`letter-bubble scrambled-letter ${isUsed ? 'used' : ''}`}
                      onClick={() => !isUsed && selectLetter(item)}
                    >
                      {item.char.toUpperCase()}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Control Keys */}
            <div className="controls">
              <button className="btn-clear" onClick={clearAssembled}>
                Clear All 🧹
              </button>
              <button 
                className="btn-check" 
                onClick={checkSpelling}
                disabled={assembledIndices.length !== spellingRoundWords[spellingWordIndex].word.length}
                style={{ opacity: assembledIndices.length === spellingRoundWords[spellingWordIndex].word.length ? 1 : 0.6 }}
              >
                Check Answer ✅
              </button>
            </div>

            {/* Quick Result Feedback */}
            {spellingCheckResult === 'correct' && (
              <div className="feedback-box correct pop-in">
                🎉 Correct! Awesome spelling!
              </div>
            )}
            {spellingCheckResult === 'wrong' && (
              <div className="feedback-box incorrect shake-animation">
                ❌ Not quite. Let's try again!
              </div>
            )}
          </div>
        </main>
      )}

      {/* SCREEN 5: TIMETABLES GAME */}
      {screen === 'math' && (
        <main className="game-container glass-panel pop-in">
          <button className="back-button" onClick={() => setScreen('math-selection')}>
            ◀ Exit Arena
          </button>

          {/* Quest Progress */}
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(mathQuestionIndex / mathQuestions.length) * 100}%` }}
              ></div>
            </div>
            <div className="progress-text">
              {mathQuestionIndex + 1} / {mathQuestions.length}
            </div>
          </div>

          <div className="math-card">
            <h2>Solve the Multiplication!</h2>
            
            <div className="math-expression">
              {mathQuestions[mathQuestionIndex].num1} × {mathQuestions[mathQuestionIndex].num2}
            </div>

            <div className="math-options-grid">
              {mathQuestions[mathQuestionIndex].options.map((opt) => {
                let btnClass = "";
                if (mathSelectedAnswer === opt) {
                  btnClass = mathCheckResult === 'correct' ? 'correct' : 'incorrect';
                }
                return (
                  <button
                    key={opt}
                    className={`math-option-btn ${btnClass}`}
                    onClick={() => handleSelectMathOption(opt)}
                    disabled={mathCheckResult !== null}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Quick Result Feedback */}
            {mathCheckResult === 'correct' && (
              <div className="feedback-box correct pop-in">
                🎉 Correct! Nice calculation!
              </div>
            )}
            {mathCheckResult === 'wrong' && (
              <div className="feedback-box incorrect shake-animation">
                ❌ Whoops! Try another number.
              </div>
            )}
          </div>
        </main>
      )}

      {/* CELEBRATION MODAL: SPELLING ROUND COMPLETE */}
      {activeModal === 'spelling-win' && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel pop-in">
            <span className="modal-emoji">🎉</span>
            <h2>Spelling Quest Complete!</h2>
            <p>You did an incredible job spelling all the words!</p>
            <div className="modal-stars">
              ⭐ +50 Stars!
            </div>
            <button 
              className="btn-primary" 
              onClick={() => {
                setActiveModal(null);
                setScreen('dashboard');
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* CELEBRATION MODAL: MATH ROUND COMPLETE */}
      {activeModal === 'math-win' && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel pop-in">
            <span className="modal-emoji">🚀</span>
            <h2>Arena Challenge Cleared!</h2>
            <p>You've successfully solved all the timetables questions!</p>
            <div className="modal-stars">
              ⭐ +50 Stars!
            </div>
            <button 
              className="btn-primary" 
              onClick={() => {
                setActiveModal(null);
                setScreen('dashboard');
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
