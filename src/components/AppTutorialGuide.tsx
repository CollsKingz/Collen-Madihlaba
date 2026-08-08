import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  Sparkles,
  BookOpen,
  Key,
  Camera,
  ShieldCheck,
  MapPin,
  FileText,
  HelpCircle,
  Search,
  CheckCircle2,
  Layers,
  Smile,
  Coffee,
  Award,
  Video,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  ThumbsUp,
  Clock,
  Send
} from 'lucide-react';

interface Chapter {
  id: string;
  timestamp: string;
  seconds: number;
  title: string;
  description: string;
}

const TUTORIAL_CHAPTERS: Chapter[] = [
  {
    id: 'intro',
    timestamp: '00:00',
    seconds: 0,
    title: '1. App Overview & System Purpose',
    description: 'Introduction to GA-Rankuwa YMCA Employee Attendance, OTP Verification, and Field Workproof System.'
  },
  {
    id: 'otp_clockin',
    timestamp: '00:35',
    seconds: 35,
    title: '2. One-Time PIN (OTP) & Live Photo Clock In',
    description: 'How employees request dynamic OTP, verify PIN security, and take live selfie snapshots with morning fun tags.'
  },
  {
    id: 'morning_fun',
    timestamp: '01:20',
    seconds: 80,
    title: '3. Manager Morning Fun & Reaction Desk',
    description: 'How managers review live employee selfie captures, award Morning Fun MVPs, send coffee tokens, and approve shifts.'
  },
  {
    id: 'geofence',
    timestamp: '02:05',
    seconds: 125,
    title: '4. GPS Geofencing & Station Select',
    description: 'Understanding YMCA center boundary radius checks, real-time device GPS accuracy, and out-of-bounds alerts.'
  },
  {
    id: 'field_reports',
    timestamp: '02:50',
    seconds: 170,
    title: '5. Field Workproof Shift Reports (5-Photo Rule)',
    description: 'How field workers log outings, document tasks completed, and upload required 5 proof photos.'
  },
  {
    id: 'approvals',
    timestamp: '03:40',
    seconds: 220,
    title: '6. IT & Manager Privilege Approvals',
    description: 'Submitting role promotion requests, manager sign-offs, IT security reviews, and audit trails.'
  }
];

export const AppTutorialGuide: React.FC = () => {
  // Video Player state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const duration = 270; // 4 minutes 30 seconds tutorial video
  const [volume, setVolume] = useState<number>(0.9);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showSubtitles, setShowSubtitles] = useState<boolean>(true);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'video' | 'guide' | 'faq'>('video');

  // FAQ state
  const [faqSearch, setFaqSearch] = useState<string>('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>('otp_expiry');

  // Video playback loop simulator
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1 * playbackRate;
        });
      }, 1000 / playbackRate);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackRate]);

  // Sync active chapter based on time
  useEffect(() => {
    const currentChapter = TUTORIAL_CHAPTERS.reduce((acc, ch, idx) => {
      if (currentTime >= ch.seconds) return idx;
      return acc;
    }, 0);
    setActiveChapterIndex(currentChapter);
  }, [currentTime]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
  };

  const jumpToChapter = (chapter: Chapter) => {
    setCurrentTime(chapter.seconds);
    setIsPlaying(true);
  };

  const currentChapterObj = TUTORIAL_CHAPTERS[activeChapterIndex];

  // FAQ Items
  const faqList = [
    {
      id: 'otp_expiry',
      question: 'How does One-Time PIN (OTP) clock-in work?',
      answer: 'Instead of complex facial recognition passwords, click "Generate New OTP" on the clock-in screen. A temporary 6-digit PIN (e.g. 849-201) valid for 10 minutes is generated. Enter the PIN, snap a quick live selfie photo with a morning mood pose tag, and click submit!'
    },
    {
      id: 'morning_fun_desk',
      question: 'What is the "Morning Fun Decision Desk" for managers?',
      answer: 'Managers can review employee morning selfies in the Manager Dashboard or Summary Reports. As a fun team culture booster, managers can award a "Morning Fun MVP" badge, send a virtual coffee token, or feature employee photos on the YMCA Wall of Fame.'
    },
    {
      id: 'geofence_out_of_bounds',
      question: 'What happens if I clock in outside the YMCA geofence?',
      answer: 'The system flags the record as "Flagged Geofence". You can still submit your attendance with notes (e.g. "On official field assignment"), which prompts your department manager for review.'
    },
    {
      id: 'field_report_5_photos',
      question: 'Why does the Field Shift Report require 5 proof photos?',
      answer: 'To ensure complete field transparency for outings, trips, and community work. Field employees must attach a minimum of 5 proof photos showing arrival, tasks performed, site destination, and team activity.'
    },
    {
      id: 'role_privileges',
      question: 'How do I request Manager or IT Admin access?',
      answer: 'Navigate to the "Approvals Workflow" tab, click "Request Role Upgrade", select your target role (e.g., Manager or IT Admin), provide your justification, and submit. Your manager and IT admin will receive instant approval tasks.'
    }
  ];

  const filteredFaqs = faqList.filter(f => 
    f.question.toLowerCase().includes(faqSearch.toLowerCase()) || 
    f.answer.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Video className="w-3.5 h-3.5" />
              <span>Official Video Walkthrough & User Guide</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              GA-Rankuwa YMCA App Tutorial & Guide
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl">
              Learn how to use One-Time PIN (OTP) clock-ins, capture live morning selfies, submit 5-photo field workproof reports, and navigate the manager review desk.
            </p>
          </div>

          {/* Tab Switch Buttons */}
          <div className="flex bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 shrink-0">
            <button
              onClick={() => setActiveTab('video')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'video'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Video Walkthrough</span>
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'guide'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Step-by-Step Guide</span>
            </button>
            <button
              onClick={() => setActiveTab('faq')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'faq'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>FAQ & Support</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: VIDEO TUTORIAL MODE */}
      {activeTab === 'video' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Simulated Interactive Video Screen (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative rounded-3xl overflow-hidden border-2 border-indigo-500/30 bg-slate-950 shadow-2xl">
              {/* Video Display Stage Canvas */}
              <div className="relative aspect-video bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
                {/* Background visual waves */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15)_0,transparent_70%)] pointer-events-none" />

                {/* Animated Simulated Screen Content corresponding to current chapter */}
                <div className="relative z-10 max-w-md w-full space-y-4 bg-slate-900/90 border border-slate-800/90 backdrop-blur-md p-6 rounded-3xl shadow-2xl text-left animate-in fade-in duration-300">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      <span className="font-extrabold text-xs text-indigo-300 uppercase tracking-wider">
                        TUTORIAL SIMULATION MODE
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  {/* Chapter-specific animated mockup */}
                  {activeChapterIndex === 0 && (
                    <div className="space-y-3">
                      <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center space-x-3">
                        <Sparkles className="w-8 h-8 text-indigo-400 shrink-0" />
                        <div>
                          <h4 className="font-extrabold text-sm text-white">GA-Rankuwa YMCA Portal</h4>
                          <p className="text-xs text-slate-300">Geofence GPS • OTP PIN Security • Field Workproof Reports</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Welcome to the official video guide! This application ensures employee attendance, geofence compliance, and field outing proof.
                      </p>
                    </div>
                  )}

                  {activeChapterIndex === 1 && (
                    <div className="space-y-3">
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center space-x-3">
                        <Key className="w-8 h-8 text-emerald-400 shrink-0" />
                        <div>
                          <h4 className="font-extrabold text-sm text-white">OTP + Morning Fun Selfie</h4>
                          <p className="text-xs text-slate-300">Generated OTP: <strong className="font-mono text-emerald-400">849 201</strong></p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                        <Smile className="w-4 h-4 text-amber-400" />
                        <span className="text-slate-300">Morning Tag: <strong>☕ Coffee Morning Smile</strong></span>
                      </div>
                    </div>
                  )}

                  {activeChapterIndex === 2 && (
                    <div className="space-y-3">
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center space-x-3">
                        <Award className="w-8 h-8 text-amber-400 shrink-0" />
                        <div>
                          <h4 className="font-extrabold text-sm text-white">Manager Reaction Desk</h4>
                          <p className="text-xs text-slate-300">Award Morning Fun MVP & Virtual Coffee</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className="px-2.5 py-1 bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-lg text-[10px] font-bold">
                          🌟 Award MVP
                        </span>
                        <span className="px-2.5 py-1 bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-bold">
                          ☕ Coffee Token
                        </span>
                      </div>
                    </div>
                  )}

                  {activeChapterIndex === 3 && (
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center space-x-3">
                        <MapPin className="w-8 h-8 text-blue-400 shrink-0" />
                        <div>
                          <h4 className="font-extrabold text-sm text-white">GPS Geofencing</h4>
                          <p className="text-xs text-slate-300">GA-Rankuwa Main Center (Radius: 250m)</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400">
                        GPS distance automatically verifies employee physical presence inside center bounds.
                      </p>
                    </div>
                  )}

                  {activeChapterIndex === 4 && (
                    <div className="space-y-3">
                      <div className="p-3 bg-pink-500/10 border border-pink-500/20 rounded-2xl flex items-center space-x-3">
                        <Camera className="w-8 h-8 text-pink-400 shrink-0" />
                        <div>
                          <h4 className="font-extrabold text-sm text-white">5-Photo Field Reports</h4>
                          <p className="text-xs text-slate-300">Workproof for trips & community field projects</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5 pt-1">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <div key={num} className="h-10 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                            #{num}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeChapterIndex === 5 && (
                    <div className="space-y-3">
                      <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center space-x-3">
                        <ShieldCheck className="w-8 h-8 text-purple-400 shrink-0" />
                        <div>
                          <h4 className="font-extrabold text-sm text-white">Privilege Approvals</h4>
                          <p className="text-xs text-slate-300">Manager & IT Security Workflows</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400">
                        Request manager/admin role upgrades with full audit history tracking.
                      </p>
                    </div>
                  )}

                  {/* Subtitle / Caption Overlay */}
                  {showSubtitles && (
                    <div className="bg-slate-950/90 p-2.5 rounded-xl border border-indigo-500/30 text-indigo-200 text-xs text-center font-medium">
                      "{currentChapterObj.description}"
                    </div>
                  )}
                </div>

                {/* Big Play Overlay Button when paused */}
                {!isPlaying && (
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white flex items-center justify-center shadow-2xl transition-all hover:scale-110 cursor-pointer border-2 border-white/20"
                  >
                    <Play className="w-10 h-10 translate-x-0.5" />
                  </button>
                )}
              </div>

              {/* Video Scrubber & Playback Controls Bar */}
              <div className="bg-slate-900 border-t border-slate-800 p-4 space-y-3">
                {/* Timeline Scrubber */}
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-xs text-slate-400 shrink-0">
                    {formatTime(currentTime)}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max={duration}
                    step="1"
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <span className="font-mono text-xs text-slate-400 shrink-0">
                    {formatTime(duration)}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-md"
                      title={isPlaying ? 'Pause Tutorial' : 'Play Tutorial'}
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 translate-x-0.5" />}
                    </button>
                    <button
                      onClick={() => {
                        setCurrentTime(0);
                        setIsPlaying(true);
                      }}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                      title="Replay from Beginning"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <div className="h-6 w-px bg-slate-800 mx-1" />

                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => setShowSubtitles(!showSubtitles)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        showSubtitles
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          : 'bg-slate-800 text-slate-500 border-slate-700'
                      }`}
                    >
                      CC
                    </button>
                  </div>

                  {/* Playback Speed Switcher */}
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-slate-400 hidden sm:inline">Speed:</span>
                    {[1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => setPlaybackRate(rate)}
                        className={`px-2 py-1 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                          playbackRate === rate
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chapters Sidebar List (1 col) */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Video Chapters ({TUTORIAL_CHAPTERS.length})</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {activeChapterIndex + 1}/{TUTORIAL_CHAPTERS.length}
                </span>
              </div>

              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {TUTORIAL_CHAPTERS.map((ch, idx) => {
                  const isActive = idx === activeChapterIndex;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => jumpToChapter(ch)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                        isActive
                          ? 'bg-indigo-600/15 border-indigo-500/50 text-white shadow-lg shadow-indigo-500/10'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                          isActive ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {ch.timestamp}
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 animate-pulse">
                            NOW PLAYING
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-xs text-white leading-tight">{ch.title}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{ch.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: STEP-BY-STEP USER GUIDE */}
      {activeTab === 'guide' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Guide Card 1: OTP Clock In */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 hover:border-indigo-500/40 transition-all shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Key className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-white">1. One-Time PIN (OTP) Clock-In</h3>
              <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                <li>Select your name from the staff dropdown list.</li>
                <li>Enter your profile password to unlock attendance.</li>
                <li>Click <strong>"Generate New OTP"</strong> to issue a 6-digit PIN.</li>
                <li>Input the OTP or click <strong>"Use Generated OTP"</strong>.</li>
                <li>Snap a live webcam selfie photo.</li>
                <li>Select a fun morning mood tag (e.g. ☕ Coffee Smile).</li>
                <li>Click <strong>"Submit Clock-In"</strong> to log attendance.</li>
              </ol>
            </div>

            {/* Guide Card 2: Morning Fun Decision Desk */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 hover:border-amber-500/40 transition-all shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Coffee className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-white">2. Morning Fun Decision Desk</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Managers review live selfie photos in the Manager Dashboard and Summary Reports. For morning culture and fun:
              </p>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li><strong>🌟 Award Morning Fun MVP</strong> badge for positive energy.</li>
                <li><strong>☕ Send Virtual Coffee Token</strong> to kickstart the day.</li>
                <li><strong>📸 Feature on YMCA Wall of Fame</strong> for top team spirit.</li>
                <li><strong>💬 Send Cheerful Shoutout</strong> to employee inbox.</li>
              </ul>
            </div>

            {/* Guide Card 3: Field Workproof Reports */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 hover:border-pink-500/40 transition-all shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-white">3. 5-Photo Field Workproof</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                When conducting community trips or field outings:
              </p>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li>Go to <strong>Shift Proof Reports</strong> tab.</li>
                <li>Select report type: <em>Field Trip Outing</em> or <em>Regular Shift</em>.</li>
                <li>Enter destination address and shift summary.</li>
                <li>Attach at least <strong>5 proof photos</strong> capturing arrival, activities, and team work.</li>
                <li>Submit report for manager review.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: FAQ & SUPPORT ASSISTANT */}
      {activeTab === 'faq' && (
        <div className="space-y-6">
          {/* FAQ Search Bar */}
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search help topics, OTP questions, geofencing guidelines..."
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="space-y-3">
            {filteredFaqs.map((faq) => {
              const isExpanded = expandedFaq === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all shadow-lg"
                >
                  <button
                    onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                    className="w-full text-left p-4 md:p-5 flex items-center justify-between font-bold text-sm text-white hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>{faq.question}</span>
                    </span>
                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                  {isExpanded && (
                    <div className="p-4 md:p-5 pt-0 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 bg-slate-950/40">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
