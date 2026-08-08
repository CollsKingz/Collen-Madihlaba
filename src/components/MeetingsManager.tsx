import React, { useState, useEffect, useRef } from 'react';
import {
  MeetingSession,
  MeetingMinutes,
  MeetingParticipant,
  MeetingActionItem,
  Employee,
  UserRole,
} from '../types';
import {
  getMeetings,
  saveMeetings,
  addMeeting,
  updateMeeting,
  deleteMeeting,
  saveMeetingMinutes,
  sendMeetingMinutesToManagersAndStaff,
  getEmployees,
} from '../utils/storage';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  Hand,
  MessageSquare,
  FileText,
  Send,
  Users,
  Plus,
  Calendar,
  Clock,
  Shield,
  CheckCircle2,
  AlertCircle,
  X,
  Play,
  Square,
  Smile,
  Sparkles,
  Download,
  Share2,
  Radio,
  Award,
  ChevronRight,
  Edit3,
  Trash2,
  BarChart3,
  Building,
} from 'lucide-react';

interface MeetingsManagerProps {
  currentUser?: Employee;
  userRole?: UserRole;
  onOpenBackupModal?: () => void;
}

export const MeetingsManager: React.FC<MeetingsManagerProps> = ({
  currentUser,
  userRole = 'manager',
  onOpenBackupModal,
}) => {
  const [meetings, setMeetings] = useState<MeetingSession[]>(getMeetings());
  const [activeTab, setActiveTab] = useState<'all' | 'board' | 'live' | 'minutes' | 'board_oversight'>('all');
  const [activeMeeting, setActiveMeeting] = useState<MeetingSession | null>(null);
  
  // Video Call State
  const [isLiveCallOpen, setIsLiveCallOpen] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [reactions, setReactions] = useState<{ id: string; emoji: string; name: string }[]>([]);
  const [chatMessages, setChatMessages] = useState<{ id: string; sender: string; text: string; time: string }[]>([
    { id: '1', sender: 'Collen Madihlaba', text: 'Welcome everyone to the meeting!', time: '10:01 AM' },
    { id: '2', sender: 'Adv. Tebogo Molefe', text: 'Good morning. Board minutes review is ready.', time: '10:02 AM' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [showMinutesDrawer, setShowMinutesDrawer] = useState(false);

  // New Meeting Form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMeetingTitle, setNewMeetingTitle] = useState('');
  const [newMeetingCategory, setNewMeetingCategory] = useState<'Board Meeting' | 'Executive Committee' | 'Staff Briefing' | 'IT & Operations' | 'General'>('Staff Briefing');
  const [newMeetingTime, setNewMeetingTime] = useState('');

  // Minutes Editor State
  const [editingMinutes, setEditingMinutes] = useState<MeetingMinutes | null>(null);
  const [minutesTargetMeetingId, setMinutesTargetMeetingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Local webcam stream reference
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setMeetings(getMeetings());
    };
    window.addEventListener('geofence_meetings_update', handleUpdate);
    window.addEventListener('geofence_storage_update', handleUpdate);
    return () => {
      window.removeEventListener('geofence_meetings_update', handleUpdate);
      window.removeEventListener('geofence_storage_update', handleUpdate);
    };
  }, []);

  // Recording timer
  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Webcam stream start/stop for video call
  useEffect(() => {
    if (isLiveCallOpen && isVideoOn) {
      navigator.mediaDevices
        ?.getUserMedia({ video: true, audio: false })
        .then((stream) => {
          setCameraStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(() => {
          console.warn('Camera access denied or unavailable.');
        });
    } else {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
      }
    }
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isLiveCallOpen, isVideoOn]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleStartCall = (meeting: MeetingSession) => {
    setActiveMeeting(meeting);
    setIsLiveCallOpen(true);
    if (meeting.minutes) {
      setEditingMinutes(meeting.minutes);
    } else {
      setEditingMinutes({
        id: `min-${Date.now()}`,
        meetingId: meeting.id,
        meetingTitle: meeting.title,
        preparedBy: currentUser?.name || 'Admin',
        preparedById: currentUser?.id || 'emp-admin',
        date: new Date().toISOString().split('T')[0],
        attendees: meeting.participants.map((p) => p.name),
        agendaItems: ['1. System operations update', '2. Geofence attendance audit', '3. Action plan'],
        discussionSummary: '',
        actionItems: [],
        boardResolutions: meeting.category === 'Board Meeting' ? ['Resolution 2026/01: System compliance approved'] : [],
      });
    }
  };

  const handleEndCall = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsLiveCallOpen(false);
    setActiveMeeting(null);
    setIsRecording(false);
    showToast('Video call ended successfully.');
  };

  const handleSendReaction = (emoji: string) => {
    const newReaction = {
      id: Math.random().toString(),
      emoji,
      name: currentUser?.name || 'Participant',
    };
    setReactions((prev) => [...prev, newReaction]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 2500);
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: currentUser?.name || 'You',
        text: chatInput.trim(),
        time: timeStr,
      },
    ]);
    setChatInput('');
  };

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeetingTitle.trim()) return;
    const allEmployees = getEmployees();
    const defaultParticipants: MeetingParticipant[] = [
      {
        id: currentUser?.id || 'emp-host',
        name: currentUser?.name || 'Meeting Host',
        role: currentUser?.role || 'manager',
        isVideoOn: true,
        isAudioOn: true,
        isHandRaised: false,
      },
      ...allEmployees.slice(0, 3).map((emp) => ({
        id: emp.id,
        name: emp.name,
        role: emp.role,
        avatar: emp.avatar,
        isVideoOn: true,
        isAudioOn: false,
        isHandRaised: false,
      })),
    ];

    const meeting: MeetingSession = {
      id: `meet-${Date.now()}`,
      title: newMeetingTitle.trim(),
      category: newMeetingCategory,
      scheduledTime: newMeetingTime ? new Date(newMeetingTime).toISOString() : new Date().toISOString(),
      durationMinutes: 60,
      status: 'scheduled',
      hostId: currentUser?.id || 'emp-host',
      hostName: currentUser?.name || 'Meeting Host',
      meetingLink: `https://garankuwaymca.org.za/meet/${Date.now()}`,
      participants: defaultParticipants,
      createdAt: new Date().toISOString(),
    };

    addMeeting(meeting);
    setMeetings(getMeetings());
    setShowCreateModal(false);
    setNewMeetingTitle('');
    showToast(`Meeting "${meeting.title}" scheduled successfully!`);
  };

  const handleSaveMinutes = () => {
    if (!editingMinutes || !minutesTargetMeetingId) return;
    saveMeetingMinutes(minutesTargetMeetingId, editingMinutes);
    setMeetings(getMeetings());
    showToast('Meeting minutes saved to archive.');
  };

  const handleSendMinutesToAll = (meetingId: string, minutes: MeetingMinutes) => {
    const success = sendMeetingMinutesToManagersAndStaff(meetingId, minutes);
    if (success) {
      setMeetings(getMeetings());
      showToast('🚀 Minutes successfully sent & distributed to all Managers, Board Members, and Staff!');
    }
  };

  const formatRecordingTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredMeetings = meetings.filter((m) => {
    if (activeTab === 'board') return m.category === 'Board Meeting';
    if (activeTab === 'live') return m.status === 'live';
    if (activeTab === 'minutes') return Boolean(m.minutes);
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-2xl flex items-center space-x-2 animate-bounce">
          <Sparkles className="w-5 h-5" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Ga-Rankuwa YMCA Operations
              </span>
              {(userRole === 'board_member' || userRole === 'super_admin') && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                  <Shield className="w-3 h-3 inline" />
                  <span>Board Oversight Access</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
              <Video className="w-7 h-7 text-indigo-400" />
              <span>Meetings & HD Video Conferencing</span>
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1 max-w-2xl">
              Virtual Zoom-like conference suite with screen sharing, live minutes editor, real-time board oversight, and automated minutes distribution to managers and staff.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs md:text-sm flex items-center space-x-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Meeting</span>
            </button>

            {onOpenBackupModal && (
              <button
                onClick={onOpenBackupModal}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center space-x-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Backup & Reports Archive</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            All Sessions ({meetings.length})
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'live'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
            <span>Live Now ({meetings.filter((m) => m.status === 'live').length})</span>
          </button>
          <button
            onClick={() => setActiveTab('board')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'board'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-300" />
            <span>Board Assemblies</span>
          </button>
          <button
            onClick={() => setActiveTab('minutes')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'minutes'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-300" />
            <span>Minutes Archive</span>
          </button>
          <button
            onClick={() => setActiveTab('board_oversight')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'board_oversight'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-purple-300" />
            <span>Board Oversight Monitor</span>
          </button>
        </div>
      </div>

      {/* Main Content Areas */}
      {activeTab === 'board_oversight' ? (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Shield className="w-6 h-6 text-purple-400" />
                  <span>YMCA Board Executive Oversight Dashboard</span>
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  Real-time executive monitoring of center attendance compliance, field work proof submissions, and board resolutions.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Board Monitor Active
              </span>
            </div>

            {/* Board Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-xs font-medium">Center Compliance Rate</div>
                <div className="text-2xl font-black text-emerald-400 mt-1">98.4%</div>
                <div className="text-[11px] text-slate-500 mt-1">Zone 1 & Zone 4 Complexes</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-xs font-medium">Field Work Reports Audit</div>
                <div className="text-2xl font-black text-indigo-400 mt-1">100% Verified</div>
                <div className="text-[11px] text-slate-500 mt-1">Min 5 proof photos per outing</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-xs font-medium">Board Resolutions Passed</div>
                <div className="text-2xl font-black text-amber-400 mt-1">12 Resolutions</div>
                <div className="text-[11px] text-slate-500 mt-1">Governance & IT Biometrics</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-xs font-medium">Elevated Privilege Audits</div>
                <div className="text-2xl font-black text-purple-400 mt-1">0 Security Alerts</div>
                <div className="text-[11px] text-slate-500 mt-1">Manager & Admin access synced</div>
              </div>
            </div>

            {/* Board Resolutions & Minutes Table */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Official Board Meeting Minutes & Distributed Resolutions
              </h3>
              <div className="divide-y divide-slate-800 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                {meetings
                  .filter((m) => m.minutes)
                  .map((m) => (
                    <div key={m.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-900/50">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                            {m.category}
                          </span>
                          <span className="text-xs text-slate-400">{m.minutes?.date}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-white mt-1">{m.title}</h4>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{m.minutes?.discussionSummary}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {m.minutes?.sentAt ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Sent to Managers</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSendMinutesToAll(m.id, m.minutes!)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                          >
                            Send Minutes Now
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Meeting Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMeetings.map((meeting) => (
            <div
              key={meeting.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                meeting.status === 'live'
                  ? 'bg-slate-900 border-emerald-500/50 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      meeting.category === 'Board Meeting'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : meeting.category === 'Staff Briefing'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {meeting.category}
                  </span>

                  {meeting.status === 'live' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Live Conference Now</span>
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-white line-clamp-1">{meeting.title}</h3>
                  <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(meeting.scheduledTime).toLocaleDateString()}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(meeting.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  </div>
                </div>

                {/* Host & Participants Preview */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="text-slate-400">
                    Host: <span className="text-slate-200 font-medium">{meeting.hostName}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-slate-400">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{meeting.participants.length} Participants</span>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => handleStartCall(meeting)}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    meeting.status === 'live'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>{meeting.status === 'live' ? 'Join Live HD Room' : 'Start Video Call'}</span>
                </button>

                {meeting.minutes && (
                  <button
                    onClick={() => {
                      setEditingMinutes(meeting.minutes!);
                      setMinutesTargetMeetingId(meeting.id);
                      setShowMinutesDrawer(true);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1 border border-slate-700 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Minutes</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive HD Video Call Modal Room */}
      {isLiveCallOpen && activeMeeting && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
          {/* Top Bar */}
          <div className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <div>
                <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>{activeMeeting.title}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300">
                    HD Encrypted Video Room
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">Host: {activeMeeting.hostName}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {isRecording && (
                <div className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-mono font-bold flex items-center space-x-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>REC {formatRecordingTime(recordingSeconds)}</span>
                </div>
              )}

              <button
                onClick={() => setShowMinutesDrawer(!showMinutesDrawer)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/50 text-xs font-semibold flex items-center space-x-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Live Minutes Notepad</span>
              </button>

              <button
                onClick={handleEndCall}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-red-600/30"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>End Call</span>
              </button>
            </div>
          </div>

          {/* Main Video Grid & Sidebar */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Reactions Floating Container */}
            <div className="absolute top-6 left-6 z-30 space-y-2 pointer-events-none">
              {reactions.map((r) => (
                <div key={r.id} className="px-3 py-1.5 rounded-full bg-slate-900/90 border border-indigo-500/40 text-white text-sm font-bold flex items-center space-x-2 animate-bounce">
                  <span>{r.emoji}</span>
                  <span className="text-xs text-indigo-300">{r.name}</span>
                </div>
              ))}
            </div>

            {/* Video Streams Canvas */}
            <div className="flex-1 bg-slate-950 p-6 overflow-y-auto flex flex-col justify-center">
              {/* Screen Sharing View */}
              {isScreenSharing ? (
                <div className="w-full h-full max-h-[70vh] bg-slate-900 rounded-2xl border-2 border-indigo-500/50 p-6 flex flex-col items-center justify-center relative shadow-2xl">
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center space-x-1">
                    <Monitor className="w-3.5 h-3.5" />
                    <span>{currentUser?.name || 'You'} is Sharing Screen</span>
                  </div>
                  <div className="text-center space-y-3">
                    <Building className="w-16 h-16 text-indigo-400 mx-auto animate-pulse" />
                    <h3 className="text-xl font-extrabold text-white">Ga-Rankuwa YMCA Operations Deck</h3>
                    <p className="text-xs text-slate-400 max-w-md">
                      Displaying live geofence attendance analytics, field work outing verification, and board oversight metrics.
                    </p>
                  </div>
                </div>
              ) : (
                /* Participant Tiles Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-6xl mx-auto">
                  {/* Current User Tile */}
                  <div className="relative aspect-video rounded-2xl bg-slate-900 border-2 border-emerald-500/50 overflow-hidden shadow-xl flex items-center justify-center group">
                    {isVideoOn ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center space-y-2">
                        <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                          {currentUser?.name?.charAt(0) || 'U'}
                        </div>
                        <span className="text-xs text-slate-400">Camera Off</span>
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-white text-xs font-semibold flex items-center space-x-1.5">
                      <span>{currentUser?.name || 'You'} (Host)</span>
                      {!isAudioOn && <MicOff className="w-3 h-3 text-red-400" />}
                    </div>
                    {isHandRaised && (
                      <div className="absolute top-3 right-3 p-1.5 rounded-full bg-amber-500 text-slate-950 font-bold animate-bounce">
                        <Hand className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Simulated Participants */}
                  {activeMeeting.participants.slice(1).map((participant) => (
                    <div key={participant.id} className="relative aspect-video rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl flex items-center justify-center">
                      <img
                        src={participant.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'}
                        alt={participant.name}
                        className="w-full h-full object-cover opacity-90"
                      />
                      <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-white text-xs font-semibold flex items-center space-x-1.5">
                        <span>{participant.name}</span>
                        {!participant.isAudioOn && <MicOff className="w-3 h-3 text-red-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chat Sidebar */}
            <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
              <div className="p-4 border-b border-slate-800 font-bold text-xs text-slate-200 uppercase tracking-wider flex items-center justify-between">
                <span>In-Meeting Chat & Transcript</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px]">Live</span>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-indigo-400">{msg.sender}</span>
                      <span className="text-slate-500">{msg.time}</span>
                    </div>
                    <p className="text-xs text-slate-200">{msg.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button type="submit" className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>

          {/* Bottom Controls Bar */}
          <div className="h-20 bg-slate-900 border-t border-slate-800 px-6 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsAudioOn(!isAudioOn)}
                className={`p-3 rounded-xl font-bold text-xs flex items-center space-x-1.5 ${
                  isAudioOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-red-600 text-white'
                }`}
              >
                {isAudioOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                <span>{isAudioOn ? 'Mute' : 'Unmuted'}</span>
              </button>

              <button
                onClick={() => setIsVideoOn(!isVideoOn)}
                className={`p-3 rounded-xl font-bold text-xs flex items-center space-x-1.5 ${
                  isVideoOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-red-600 text-white'
                }`}
              >
                {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                <span>{isVideoOn ? 'Stop Cam' : 'Start Cam'}</span>
              </button>
            </div>

            {/* Center Controls */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsScreenSharing(!isScreenSharing)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                  isScreenSharing
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>{isScreenSharing ? 'Stop Share' : 'Share Screen'}</span>
              </button>

              <button
                onClick={() => setIsHandRaised(!isHandRaised)}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer ${
                  isHandRaised ? 'bg-amber-500 text-slate-950 font-extrabold' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <Hand className="w-4 h-4" />
                <span>{isHandRaised ? 'Hand Raised' : 'Raise Hand'}</span>
              </button>

              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer ${
                  isRecording ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <Radio className="w-4 h-4 text-red-400" />
                <span>{isRecording ? 'Recording...' : 'Record Call'}</span>
              </button>

              {/* Emoji Reactions Dropdown */}
              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {['👏', '👍', '🎉', '❤️'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleSendReaction(emoji)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-sm cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Meeting ID: {activeMeeting.id}
            </div>
          </div>
        </div>
      )}

      {/* Minutes Editor Drawer */}
      {showMinutesDrawer && editingMinutes && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-slate-900 border-l border-slate-800 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <span>Minutes of Meeting (MOM)</span>
                </h3>
                <p className="text-xs text-slate-400">Edit agenda, notes, and send to Managers & Staff</p>
              </div>
              <button onClick={() => setShowMinutesDrawer(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Meeting Title</label>
                <input
                  type="text"
                  value={editingMinutes.meetingTitle}
                  onChange={(e) => setEditingMinutes({ ...editingMinutes, meetingTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Prepared By</label>
                <input
                  type="text"
                  value={editingMinutes.preparedBy}
                  onChange={(e) => setEditingMinutes({ ...editingMinutes, preparedBy: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Key Discussion Points & Summary</label>
                <textarea
                  rows={4}
                  value={editingMinutes.discussionSummary}
                  onChange={(e) => setEditingMinutes({ ...editingMinutes, discussionSummary: e.target.value })}
                  placeholder="Summarize discussion points, decisions made, and board resolutions..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
            <button
              onClick={() => {
                if (minutesTargetMeetingId) {
                  handleSendMinutesToAll(minutesTargetMeetingId, editingMinutes);
                } else {
                  handleSaveMinutes();
                }
              }}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Send & Distribute Minutes to Managers & Staff</span>
            </button>
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                <span>Schedule New Meeting Session</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Meeting Subject / Title *</label>
                <input
                  type="text"
                  required
                  value={newMeetingTitle}
                  onChange={(e) => setNewMeetingTitle(e.target.value)}
                  placeholder="e.g. Zone 1 Operations & Staff Audit"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Assembly Category *</label>
                <select
                  value={newMeetingCategory}
                  onChange={(e) => setNewMeetingCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="Staff Briefing">Staff Briefing</option>
                  <option value="Board Meeting">Board Meeting</option>
                  <option value="Executive Committee">Executive Committee</option>
                  <option value="IT & Operations">IT & Operations</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  value={newMeetingTime}
                  onChange={(e) => setNewMeetingTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  Confirm & Schedule Meeting
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
