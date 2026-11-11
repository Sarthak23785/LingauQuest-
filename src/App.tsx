import { useEffect, useMemo, useState } from "react";
import {
  Award, BookOpen, CalendarDays, Check, ChevronRight, CircleHelp, Flame,
  Globe2, GraduationCap, Home, Languages, LockKeyhole, LogIn, LogOut,
  Moon, Play, RotateCcw, Settings, Sparkles, Sun, Target, Trophy, User,
  Volume2, X, Zap, BookMarked, BarChart3
} from "lucide-react";
import { supabase, supabaseConfigured } from "./supabase";

type Question = { type: "choice" | "fill" | "order"; prompt: string; hint: string; options?: string[]; answer: string; explanation: string };
type Lesson = { id: number; title: string; subtitle: string; xp: number; questions: Question[] };

const lessons: Lesson[] = [
  { id: 1, title: "Everyday greetings", subtitle: "Say hello with confidence", xp: 20, questions: [
    { type: "choice", prompt: "How do you say “नमस्ते” in English?", hint: "A friendly greeting", options: ["Goodbye", "Hello", "Please", "Sorry"], answer: "Hello", explanation: "“Hello” is a common greeting when meeting someone." },
    { type: "choice", prompt: "Choose the meaning of “Thank you”.", hint: "Used to show gratitude", options: ["धन्यवाद", "कृपया", "माफ़ कीजिए", "शुभ रात्रि"], answer: "धन्यवाद", explanation: "“Thank you” means “धन्यवाद” in Hindi." },
    { type: "fill", prompt: "Complete the greeting: “Good ___!”", hint: "You say this in the morning.", answer: "morning", explanation: "“Good morning” is used to greet someone in the morning." },
    { type: "order", prompt: "Arrange the words into a polite sentence.", hint: "Start with “Please”.", options: ["Please", "help", "me"], answer: "Please help me", explanation: "“Please help me” is a polite way to ask for assistance." }
  ]},
  { id: 2, title: "Introduce yourself", subtitle: "Names, countries and people", xp: 25, questions: [
    { type: "choice", prompt: "“My name is Asha.” means…", hint: "Introducing your name", options: ["मेरा नाम आशा है।", "मैं ठीक हूँ।", "आप कहाँ हैं?"], answer: "मेरा नाम आशा है।", explanation: "“My name is…” is used to tell someone your name." },
    { type: "fill", prompt: "Complete: “I ___ from India.”", hint: "Use the verb “to be” with I.", answer: "am", explanation: "With “I”, use “am”: I am from India." },
    { type: "choice", prompt: "Which question asks for a person's name?", hint: "A question beginning with What", options: ["How old are you?", "What is your name?", "Where do you live?"], answer: "What is your name?", explanation: "“What is your name?” asks someone to tell you their name." }
  ]},
  { id: 3, title: "Useful daily phrases", subtitle: "Build real-world confidence", xp: 30, questions: [
    { type: "choice", prompt: "Choose the best translation for “कृपया”.", hint: "A polite word", options: ["Please", "Never", "Always", "Maybe"], answer: "Please", explanation: "“Please” makes requests more polite." },
    { type: "fill", prompt: "Complete: “How are ___?”", hint: "A question you ask another person.", answer: "you", explanation: "The natural phrase is “How are you?”" },
    { type: "choice", prompt: "What does “I don't understand” mean?", hint: "When something is not clear", options: ["मुझे समझ नहीं आया।", "मैं सहमत हूँ।", "मुझे भूख लगी है।"], answer: "मुझे समझ नहीं आया।", explanation: "Use this phrase when something is unclear." }
  ]}
];

const initialWords = [
  { word: "Hello", meaning: "नमस्ते", example: "Hello, how are you?", level: "Learning" },
  { word: "Please", meaning: "कृपया", example: "Please open the door.", level: "Learning" },
  { word: "Thank you", meaning: "धन्यवाद", example: "Thank you for your help.", level: "Learning" },
];

type View = "home" | "learn" | "vocab" | "profile" | "leaderboard";
const readStore = (key: string, fallback: any) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};

export default function App() {
  const [view, setView] = useState<View>("home");
  const [dark, setDark] = useState(() => readStore("lq-dark", true));
  const [xp, setXp] = useState(() => readStore("lq-xp", 0));
  const [completed, setCompleted] = useState<number[]>(() => readStore("lq-completed", []));
  const [streak, setStreak] = useState(() => readStore("lq-streak", 1));
  const [words, setWords] = useState(() => readStore("lq-words", initialWords));
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [lessonDone, setLessonDone] = useState(false);
  const [notice, setNotice] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authUser, setAuthUser] = useState<any>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [vocabFilter, setVocabFilter] = useState("All");

  useEffect(() => { localStorage.setItem("lq-dark", JSON.stringify(dark)); }, [dark]);
  useEffect(() => { localStorage.setItem("lq-xp", JSON.stringify(xp)); }, [xp]);
  useEffect(() => { localStorage.setItem("lq-completed", JSON.stringify(completed)); }, [completed]);
  useEffect(() => { localStorage.setItem("lq-streak", JSON.stringify(streak)); }, [streak]);
  useEffect(() => { localStorage.setItem("lq-words", JSON.stringify(words)); }, [words]);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setAuthUser(data.session?.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setAuthUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  const totalLessons = lessons.length;
  const progress = Math.round(completed.length / totalLessons * 100);
  const level = Math.floor(xp / 100) + 1;
  const currentQuestion = activeLesson?.questions[questionIndex];
  const filteredWords = useMemo(() => words.filter((w: any) => vocabFilter === "All" || w.level === vocabFilter), [words, vocabFilter]);

  function startLesson(lesson: Lesson) {
    setActiveLesson(lesson); setQuestionIndex(0); setSelected(""); setFeedback(null);
    setMistakes(0); setLessonDone(false); setView("learn");
  }
  function checkAnswer() {
    if (!currentQuestion || !selected.trim()) return;
    const correct = currentQuestion.type === "order" ? selected.trim().replace(/\s+/g, " ").toLowerCase() === currentQuestion.answer.toLowerCase()
      : selected.trim().toLowerCase() === currentQuestion.answer.toLowerCase();
    setFeedback(correct ? "correct" : "wrong");
    if (!correct) setMistakes(m => m + 1);
  }
  function nextQuestion() {
    if (!activeLesson) return;
    if (questionIndex < activeLesson.questions.length - 1) {
      setQuestionIndex(i => i + 1); setSelected(""); setFeedback(null);
    } else {
      if (!completed.includes(activeLesson.id)) { setCompleted(c => [...c, activeLesson.id]); setXp(x => x + activeLesson.xp); }
      setStreak(s => Math.max(s, 1)); setLessonDone(true); setNotice(`Lesson complete! +${completed.includes(activeLesson.id) ? 0 : activeLesson.xp} XP earned.`);
    }
  }
  function addWord(word: any) {
    if (words.some((w: any) => w.word === word.word)) { setNotice("That word is already in your notebook."); return; }
    setWords((old: any) => [...old, word]); setNotice(`${word.word} saved to your notebook.`);
  }
  async function authAction(kind: "signin" | "signup" | "reset") {
    if (!supabase) { setNotice("Connect Supabase to enable cloud authentication. Your demo progress is saved on this device."); return; }
    setAuthBusy(true);
    try {
      if (kind === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error;
        setShowAuth(false); setNotice("Welcome back!");
      } else if (kind === "signup") {
        const { error } = await supabase.auth.signUp({ email, password }); if (error) throw error;
        setNotice("Account created. Check your email if confirmation is enabled."); setShowAuth(false);
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email); if (error) throw error;
        setNotice("Password reset instructions sent if that account exists."); setShowAuth(false);
      }
    } catch (e: any) { setNotice(e.message || "Authentication failed."); }
    finally { setAuthBusy(false); }
  }
  async function logout() { if (supabase) await supabase.auth.signOut(); setAuthUser(null); setNotice("Signed out."); }

  const nav = [
    { id: "home" as View, label: "Home", icon: Home },
    { id: "vocab" as View, label: "My words", icon: BookMarked },
    { id: "profile" as View, label: "Progress", icon: BarChart3 },
    { id: "leaderboard" as View, label: "League", icon: Trophy }
  ];

  return <div className={dark ? "app dark" : "app light"}>
    <header className="topbar">
      <button className="brand" onClick={() => setView("home")} aria-label="LinguaQuest home">
        <span className="brand-mark"><Languages size={22}/></span><span><strong>LinguaQuest</strong><small>Learn. Level up.</small></span>
      </button>
      <div className="top-actions">
        <div className="streak-pill"><Flame size={17} fill="#ff9f43" color="#ff9f43"/><b>{streak}</b><span>day streak</span></div>
        <div className="xp-pill"><Zap size={16} fill="#f7c948" color="#f7c948"/><b>{xp} XP</b></div>
        <button className="icon-btn" title={dark ? "Switch to light mode" : "Switch to dark mode"} onClick={() => setDark(!dark)}>{dark ? <Sun size={18}/> : <Moon size={18}/>}</button>
        <button className="avatar" onClick={() => authUser ? setView("profile") : setShowAuth(true)} title="Account">{authUser ? <User size={18}/> : <LogIn size={18}/>}</button>
      </div>
    </header>

    <div className="app-layout">
      <aside className="sidebar">
        <div className="course-switch"><span className="flag">🇬🇧</span><span><b>English course</b><small>For Hindi speakers</small></span><ChevronRight size={16}/></div>
        <nav>{nav.map(n => <button key={n.id} className={view === n.id ? "nav-item active" : "nav-item"} onClick={() => setView(n.id)}><n.icon size={19}/><span>{n.label}</span></button>)}</nav>
        <div className="sidebar-bottom"><div className="mascot-mini">✦</div><b>Small steps. Big progress.</b><p>Five minutes today can change your tomorrow.</p><button className="outline-btn" onClick={() => setShowAuth(true)}>{authUser ? "Account settings" : "Create free account"}</button></div>
      </aside>

      <main className="main-content">
        {notice && <div className="notice"><span>{notice}</span><button onClick={() => setNotice("")}><X size={16}/></button></div>}
        {view === "home" && <HomeView progress={progress} xp={xp} level={level} completed={completed} startLesson={startLesson} authUser={authUser} setShowAuth={setShowAuth}/>}
        {view === "learn" && activeLesson && <section className="lesson-shell">
          {!lessonDone ? <>
            <div className="lesson-top"><button className="icon-btn" onClick={() => setView("home")} title="Exit lesson"><X size={20}/></button><div className="progress-track"><span style={{width: `${((questionIndex + (feedback ? 1 : 0)) / activeLesson.questions.length) * 100}%`}}/></div><span className="question-count">{questionIndex + 1}/{activeLesson.questions.length}</span></div>
            <div className="lesson-heading"><span className="eyebrow">UNIT 1 · LESSON {activeLesson.id}</span><h1>{currentQuestion?.prompt}</h1><p>{currentQuestion?.hint}</p></div>
            {currentQuestion?.type === "fill" ? <div className="fill-wrap"><input autoFocus value={selected} onChange={e => {setSelected(e.target.value); setFeedback(null);}} onKeyDown={e => e.key === "Enter" && !feedback && checkAnswer()} placeholder="Type your answer…" disabled={!!feedback}/></div> :
              currentQuestion?.type === "order" ? <div className="word-order"><div className="answer-line">{selected || <span>Tap the words in order</span>}</div><div className="word-options">{currentQuestion.options?.map(word => <button key={word} className="word-chip" disabled={!!feedback} onClick={() => setSelected(s => s ? `${s} ${word}` : word)}>{word}</button>)}<button className="word-chip reset" onClick={() => {setSelected("");setFeedback(null)}} disabled={!!feedback}><RotateCcw size={14}/></button></div></div> :
              <div className="answer-options">{currentQuestion?.options?.map((option, i) => <button key={option} disabled={!!feedback} onClick={() => setSelected(option)} className={`answer-option ${selected === option ? "chosen" : ""} ${feedback && option === currentQuestion.answer ? "is-correct" : ""} ${feedback && selected === option && option !== currentQuestion.answer ? "is-wrong" : ""}`}><span className="option-letter">{String.fromCharCode(65+i)}</span>{option}{feedback && option === currentQuestion.answer && <Check size={18}/>}</button>)}</div>}
            {feedback && <div className={`feedback ${feedback}`}><span className="feedback-icon">{feedback === "correct" ? "✓" : "!"}</span><div><b>{feedback === "correct" ? "Excellent!" : `Not quite — answer: ${currentQuestion?.answer}`}</b><p>{currentQuestion?.explanation}</p></div><button className="save-word" onClick={() => addWord({word: currentQuestion?.answer, meaning: currentQuestion?.prompt, example: currentQuestion?.explanation, level:"Learning"})}><BookMarked size={15}/> Save</button></div>}
            <div className="lesson-footer">{!feedback ? <button className="primary-btn" disabled={!selected.trim()} onClick={checkAnswer}>Check answer <ChevronRight size={18}/></button> : <button className="primary-btn" onClick={nextQuestion}>{questionIndex === activeLesson.questions.length - 1 ? "Finish lesson" : "Continue"} <ChevronRight size={18}/></button>}</div>
          </> : <div className="completion">
            <div className="completion-art"><div className="sunburst">✦</div><div className="trophy-circle"><Trophy size={54}/></div><span className="spark spark1">✦</span><span className="spark spark2">✧</span><span className="spark spark3">✦</span></div>
            <span className="eyebrow">LESSON COMPLETE</span><h1>You're leveling up!</h1><p>You showed up and learned something new. Keep that momentum going.</p>
            <div className="result-stats"><div><Zap size={20}/><b>+{completed.includes(activeLesson.id) ? 0 : activeLesson.xp} XP</b><small>Earned</small></div><div><Target size={20}/><b>{Math.round((activeLesson.questions.length - mistakes) / activeLesson.questions.length * 100)}%</b><small>Accuracy</small></div><div><BookOpen size={20}/><b>{activeLesson.questions.length}</b><small>Questions</small></div></div>
            <button className="primary-btn" onClick={() => {setView("home");setActiveLesson(null)}}>Continue learning <ChevronRight size={18}/></button>
            {mistakes > 0 && <button className="text-btn" onClick={() => startLesson({...activeLesson, id: 100 + activeLesson.id, title: "Mistake review", questions: activeLesson.questions.filter((_, i) => i < mistakes)})}><RotateCcw size={16}/> Review practice</button>}
          </div>}
        </section>}
        {view === "vocab" && <section className="page-section"><div className="page-title"><div><span className="eyebrow">YOUR PERSONAL COLLECTION</span><h1>My vocabulary</h1><p>Keep useful words close and revisit them often.</p></div><div className="title-icon purple"><BookMarked size={25}/></div></div><div className="filter-row">{["All","Learning","Easy","Difficult"].map(f => <button key={f} className={vocabFilter===f?"filter active":"filter"} onClick={() => setVocabFilter(f)}>{f}</button>)}</div><div className="vocab-list">{filteredWords.map((w: any) => <div className="vocab-card" key={w.word}><div className="word-symbol">Aa</div><div className="word-main"><b>{w.word}</b><span>{w.meaning}</span><small>{w.example}</small></div><select aria-label={`Difficulty for ${w.word}`} value={w.level} onChange={e => setWords((old: any) => old.map((x: any) => x.word===w.word?{...x,level:e.target.value}:x))}><option>Learning</option><option>Easy</option><option>Difficult</option></select></div>)}{!filteredWords.length && <div className="empty-state"><BookOpen size={30}/><b>No words here yet</b><p>Save words from lessons and they will appear here.</p></div>}</div><button className="secondary-btn" onClick={() => setNotice("Flashcard review is ready to expand with spaced-repetition scheduling.")}><RotateCcw size={17}/> Practice flashcards</button></section>}
        {view === "profile" && <section className="page-section"><div className="page-title"><div><span className="eyebrow">YOUR JOURNEY</span><h1>Progress & profile</h1><p>Every lesson is a step forward.</p></div><div className="title-icon blue"><BarChart3 size={25}/></div></div><div className="profile-card"><div className="profile-avatar">✦</div><div><h2>{authUser?.email?.split("@")[0] || "Language explorer"}</h2><p>{authUser ? authUser.email : "Guest learner · progress saved on this device"}</p><span className="level-tag">LEVEL {level} EXPLORER</span></div><button className="outline-btn" onClick={() => authUser ? logout() : setShowAuth(true)}>{authUser ? <><LogOut size={15}/> Sign out</> : <><LogIn size={15}/> Sign in</>}</button></div><div className="stats-grid"><Stat icon={<Zap/>} label="Total XP" value={xp}/><Stat icon={<BookOpen/>} label="Lessons done" value={completed.length}/><Stat icon={<Flame/>} label="Day streak" value={streak}/><Stat icon={<GraduationCap/>} label="Words saved" value={words.length}/></div><div className="panel"><h3><CalendarDays size={19}/> Weekly activity</h3><div className="week-bars">{["M","T","W","T","F","S","S"].map((d,i)=><div key={i} className="day-col"><span className={`bar ${i < Math.min(completed.length + 1, 5) ? "filled" : ""}`} style={{height: `${22 + ((i*17+completed.length*13)%55)}px`}}/><small>{d}</small></div>)}</div><p className="muted">Keep a gentle routine. Five minutes counts.</p></div><div className="panel"><h3><Award size={19}/> Achievements</h3><div className="achievement-row"><Achievement icon="🌱" title="First steps" desc={completed.length ? "First lesson completed" : "Complete your first lesson"} unlocked={completed.length>0}/><Achievement icon="⚡" title="XP starter" desc="Earn 20 XP" unlocked={xp>=20}/><Achievement icon="📚" title="Word collector" desc="Save 3 words" unlocked={words.length>=3}/></div></div></section>}
        {view === "leaderboard" && <section className="page-section"><div className="page-title"><div><span className="eyebrow">FRIENDLY COMPETITION</span><h1>Weekly league</h1><p>Compete with your past self first.</p></div><div className="title-icon gold"><Trophy size={25}/></div></div><div className="league-banner"><div className="league-medal">🏆</div><div><h2>Explorer League</h2><p>Earn XP by completing lessons. Rankings reset weekly.</p></div></div><div className="leaderboard-list">{[{name:"Mira",xp:180,emoji:"🌟"},{name:"Aarav",xp:125,emoji:"🚀"},{name:"You",xp,emoji:"✦"},{name:"Kabir",xp:65,emoji:"🎯"},{name:"Anaya",xp:40,emoji:"🌈"}].sort((a,b)=>b.xp-a.xp).map((p,i)=><div key={p.name} className={`leader-row ${p.name==="You"?"you":""}`}><span className="rank">{i+1}</span><span className="leader-avatar">{p.emoji}</span><b>{p.name}</b>{p.name==="You"&&<span className="you-tag">YOU</span>}<span className="leader-xp"><Zap size={14}/>{p.xp} XP</span></div>)}</div><p className="muted small-note">Sample leaderboard for the demo. A real shared leaderboard needs a backend and privacy-safe ranking rules.</p></section>}
      </main>

      <aside className="right-rail">
        <div className="daily-card"><div className="card-head"><div><span className="eyebrow">DAILY QUEST</span><h3>Your goal today</h3></div><div className="title-icon orange"><Target size={21}/></div></div><div className="goal-number"><strong>{Math.min(completed.length * 5, 15)}</strong><span>/ 15 min</span></div><div className="goal-track"><span style={{width:`${Math.min(completed.length*5/15*100,100)}%`}}/></div><p>{completed.length ? "Nice work. Keep the momentum going!" : "A little practice goes a long way."}</p><button className="secondary-btn full" onClick={() => startLesson(lessons.find(l => !completed.includes(l.id)) || lessons[0])}><Play size={16} fill="currentColor"/> Start daily practice</button></div>
        <div className="challenge-card"><div className="challenge-icon">⚡</div><div><span className="eyebrow">QUICK CHALLENGE</span><h3>Earn 20 XP</h3><p>Finish one short lesson today.</p></div><div className="challenge-progress"><span style={{width: completed.length ? "100%" : "0%"}}/></div><small>{completed.length ? "Challenge complete" : "0 of 1 lessons"}</small></div>
        <div className="tip-card"><div className="tip-top"><Sparkles size={17}/><b>Language tip</b></div><p>Try saying one new English phrase aloud today. Speaking a little every day builds confidence.</p><span>Today's tiny win ✨</span></div>
        <div className="course-progress"><div className="course-progress-top"><span>Course progress</span><b>{progress}%</b></div><div className="goal-track"><span style={{width:`${progress}%`}}/></div><small>{completed.length} of {totalLessons} lessons complete</small></div>
      </aside>
    </div>

    <nav className="mobile-nav">{nav.map(n=><button key={n.id} className={view===n.id?"active":""} onClick={()=>setView(n.id)}><n.icon size={20}/><span>{n.label}</span></button>)}</nav>

    {showAuth && <div className="modal-backdrop" onClick={() => setShowAuth(false)}><div className="auth-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowAuth(false)}><X size={18}/></button><div className="auth-logo"><Languages size={24}/></div><h2>Join LinguaQuest</h2><p>Save your journey and keep learning across devices.</p>{!supabaseConfigured && <div className="demo-note"><CircleHelp size={16}/> Demo mode is active. Add Supabase keys to enable accounts.</div>}<label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters"/></label><button className="primary-btn full" disabled={authBusy || !email} onClick={() => authAction("signin")}>{authBusy?"Please wait…":"Sign in"}</button><button className="secondary-btn full" disabled={authBusy || !email || password.length<6} onClick={() => authAction("signup")}>Create account</button><button className="text-btn" onClick={() => authAction("reset")}>Forgot password?</button><div className="secure-note"><LockKeyhole size={13}/> Your learning journey belongs to you.</div></div></div>}
  </div>;
}

function HomeView({ progress, xp, level, completed, startLesson, authUser, setShowAuth }: any) {
  const next = lessons.find((l: Lesson) => !completed.includes(l.id)) || lessons[0];
  return <section className="home-view">
    <div className="welcome-row"><div><span className="eyebrow">THURSDAY, OCTOBER 15</span><h1>Ready for your next <span>level?</span></h1><p>Every new word opens a new door.</p></div><div className="welcome-illustration"><div className="orbit orbit1"/><div className="orbit orbit2"/><div className="planet">✦</div><span className="float-word word1">hello!</span><span className="float-word word2">नमस्ते</span><span className="float-word word3">¡hola!</span></div></div>
    <div className="hero-card"><div className="hero-copy"><span className="hero-tag"><Sparkles size={13}/> YOUR LEARNING PATH</span><h2>{completed.length === lessons.length ? "Amazing work, explorer!" : next.title}</h2><p>{completed.length === lessons.length ? "You've finished all demo lessons. Revisit any lesson to keep practicing." : next.subtitle + ". One small lesson at a time."}</p><button className="primary-btn" onClick={() => startLesson(next)}><Play size={16} fill="currentColor"/> {completed.length===lessons.length?"Practice again":"Continue lesson"} <ChevronRight size={17}/></button><div className="hero-meta"><span><Zap size={14}/> +{next.xp} XP</span><span><CircleHelp size={14}/> {next.questions.length} questions</span><span><LockKeyhole size={14}/> Beginner</span></div></div><div className="hero-art"><div className="book-stack"><div className="book book3"/><div className="book book2"/><div className="book book1"><Globe2 size={39}/></div><div className="star-spark">✦</div></div><div className="art-caption">YOUR NEXT CHAPTER</div></div></div>
    <div className="section-heading"><div><span className="eyebrow">YOUR PATH</span><h2>Learning journey</h2></div><span className="progress-label">{completed.length}/{lessons.length} completed</span></div>
    <div className="journey-list">{lessons.map((lesson: Lesson, i: number) => {const done=completed.includes(lesson.id);const locked=i>0&&!completed.includes(lessons[i-1].id);return <div className={`journey-row ${done?"done":""}`} key={lesson.id}><div className={`lesson-node ${done?"node-done":locked?"node-locked":"node-open"}`}>{done?<Check size={21}/>:locked?<LockKeyhole size={18}/>:<BookOpen size={21}/>}</div><div className="journey-copy"><div className="journey-meta">LESSON {String(i+1).padStart(2,"0")} · {done?"COMPLETED":locked?"UP NEXT":"READY TO LEARN"}</div><h3>{lesson.title}</h3><p>{lesson.subtitle}</p></div><div className="journey-right"><span><Zap size={14}/>{lesson.xp} XP</span><button disabled={locked} onClick={()=>startLesson(lesson)} className={done?"replay-btn":"round-play"} title={done?"Replay lesson":"Start lesson"}>{done?<RotateCcw size={17}/>:<Play size={17} fill="currentColor"/>}</button></div></div>})}</div>
    <div className="bottom-promo"><div className="promo-icon"><Award size={24}/></div><div><b>Make progress your superpower</b><p>Sign in to prepare for cloud-synced learning.</p></div><button className="outline-btn" onClick={()=>setShowAuth(true)}>{authUser?"View account":"Get started"} <ChevronRight size={15}/></button></div>
  </section>;
}
function Stat({icon,label,value}:any){return <div className="stat-card"><span className="stat-icon">{icon}</span><strong>{value}</strong><small>{label}</small></div>}
function Achievement({icon,title,desc,unlocked}:any){return <div className={`achievement ${unlocked?"unlocked":""}`}><span>{icon}</span><div><b>{title}</b><small>{desc}</small></div>{unlocked&&<Check size={16}/>}</div>}
