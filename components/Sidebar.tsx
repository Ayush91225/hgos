"use client";

import { useCallStateHooks, useCall } from "@stream-io/video-react-sdk";
import {
  X,
  Send,
  Mic,
  MicOff,
  MessageSquare,
  Users,
  Wrench,
  Sparkles,
  Vote,
  Palette,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  Trash2,
  ArrowRight,
  Calculator
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWhiteboard: () => void;
  onOpenGraphs: () => void;
  messages?: Array<{ id: string; text: string; userId: string; timestamp: number }>;
  onSendMessage?: (text: string) => void;
}

interface ChatMessage {
  id: string;
  user: {
    id: string;
    name: string;
  };
  text: string;
  created_at: Date;
}

interface PollOption {
  id: string;
  text: string;
}

interface PollVote {
  oderId: string;
  odername: string;
  optionId: string;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  votes: PollVote[];
  createdBy: { id: string; name: string };
  isActive: boolean;
}

export default function Sidebar({ isOpen, onClose, onOpenWhiteboard, onOpenGraphs, messages = [], onSendMessage }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'people' | 'tools'>('chat');
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll state
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState<string[]>(['', '']);
  const [expandedPolls, setExpandedPolls] = useState<Set<string>>(new Set());

  const call = useCall();
  const { useParticipants, useLocalParticipant } = useCallStateHooks();
  const participants = useParticipants();
  const localParticipant = useLocalParticipant();

  // Subscribe to chat and poll events
  useEffect(() => {
    if (!call) return;

    const handleCustomEvent = (event: any) => {
      const eventType = event.custom?.type;

      if (eventType === 'chat') {
        const newMessage: ChatMessage = {
          id: event.custom.id || Date.now().toString(),
          user: {
            id: event.user.id,
            name: event.user.name || 'Guest',
          },
          text: event.custom.text,
          created_at: new Date(event.created_at || Date.now()),
        };
        setChatMessages(prev => [...prev, newMessage]);
      } else if (eventType === 'poll_created') {
        const newPoll: Poll = {
          id: event.custom.pollId,
          question: event.custom.question,
          options: event.custom.options,
          votes: [],
          createdBy: { id: event.user.id, name: event.user.name || 'Guest' },
          isActive: true,
        };
        setPolls(prev => [...prev, newPoll]);
      } else if (eventType === 'poll_vote') {
        setPolls(prev => prev.map(poll => {
          if (poll.id === event.custom.pollId) {
            const filteredVotes = poll.votes.filter(v => v.oderId !== event.user.id);
            return {
              ...poll,
              votes: [...filteredVotes, {
                oderId: event.user.id,
                odername: event.user.name || 'Guest',
                optionId: event.custom.optionId,
              }],
            };
          }
          return poll;
        }));
      } else if (eventType === 'poll_close') {
        setPolls(prev => prev.map(poll =>
          poll.id === event.custom.pollId
            ? { ...poll, isActive: false }
            : poll
        ));
      }
    };

    call.on('custom', handleCustomEvent);
    return () => call.off('custom', handleCustomEvent);
  }, [call]);

  // Mobile body scroll prevention
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      if (isOpen) {
        document.body.classList.add('sidebar-open');
        document.body.style.overflow = 'hidden';
      } else {
        document.body.classList.remove('sidebar-open');
        document.body.style.overflow = '';
      }
    }
    
    return () => {
      document.body.classList.remove('sidebar-open');
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    
    // Use the new onSendMessage prop if available, otherwise fall back to call
    if (onSendMessage) {
      onSendMessage(message.trim());
      setMessage('');
      return;
    }
    
    // Fallback to original implementation
    if (!call || !localParticipant) return;
    try {
      await call.sendCustomEvent({
        type: 'chat',
        id: Date.now().toString(),
        text: message.trim(),
      });
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const createPoll = async () => {
    if (!newPollQuestion.trim() || newPollOptions.filter(o => o.trim()).length < 2) return;
    if (!call || !localParticipant) return;

    const pollId = `poll-${Date.now()}`;
    const options = newPollOptions
      .filter(o => o.trim())
      .map((text, idx) => ({ id: `opt-${idx}`, text: text.trim() }));

    try {
      await call.sendCustomEvent({
        type: 'poll_created',
        pollId,
        question: newPollQuestion.trim(),
        options,
      });
      setNewPollQuestion('');
      setNewPollOptions(['', '']);
      setShowCreatePoll(false);
    } catch (error) {
      console.error('Failed to create poll:', error);
    }
  };

  const votePoll = async (pollId: string, optionId: string) => {
    if (!call || !localParticipant) return;
    try {
      await call.sendCustomEvent({
        type: 'poll_vote',
        pollId,
        optionId,
      });
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const closePoll = async (pollId: string) => {
    if (!call) return;
    try {
      await call.sendCustomEvent({
        type: 'poll_close',
        pollId,
      });
    } catch (error) {
      console.error('Failed to close poll:', error);
    }
  };

  const togglePollExpanded = (pollId: string) => {
    setExpandedPolls(prev => {
      const newSet = new Set(Array.from(prev));
      if (newSet.has(pollId)) newSet.delete(pollId);
      else newSet.add(pollId);
      return newSet;
    });
  };

  const addPollOption = () => {
    if (newPollOptions.length < 6) setNewPollOptions([...newPollOptions, '']);
  };

  const removePollOption = (index: number) => {
    if (newPollOptions.length > 2) setNewPollOptions(newPollOptions.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed inset-y-0 right-0 w-full max-w-sm border-l border-neutral-700/50 bg-neutral-900 backdrop-blur-md flex flex-col z-[70] md:relative md:w-80 md:z-40 md:bg-neutral-900/95 md:inset-y-auto">
      {/* Mobile Header */}
      <div className="md:hidden h-14 border-b border-neutral-700/30 flex items-center justify-between px-4 bg-neutral-900 shrink-0">
        <span className="text-sm font-medium text-white">Menu</span>
        <button 
          onClick={onClose} 
          className="text-neutral-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-neutral-800/50"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tab Headers */}
      <div className="flex border-b border-neutral-700/30 shrink-0 bg-neutral-900">
        <TabButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={<MessageSquare className="w-4 h-4" />} label="Chat" />
        <TabButton active={activeTab === 'people'} onClick={() => setActiveTab('people')} icon={<Users className="w-4 h-4" />} label={`${participants.length}`} />
        <TabButton active={activeTab === 'tools'} onClick={() => setActiveTab('tools')} icon={<Wrench className="w-4 h-4" />} label="Tools" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative bg-neutral-900/50">
        {/* Chat Panel */}
        {activeTab === 'chat' && (
          <div className="absolute inset-0 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Show premium messages if provided, otherwise show chat messages */}
              {(messages.length > 0 ? messages : chatMessages).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="w-10 h-10 mb-2 text-neutral-500" />
                  <p className="text-xs text-neutral-400">No messages yet</p>
                  <p className="text-[10px] text-neutral-600 mt-1">Start a conversation</p>
                </div>
              ) : (
                <>
                  {(messages.length > 0 ? messages : chatMessages).map((msg) => {
                    // Handle both message formats
                    const messageData = 'user' in msg ? {
                      id: msg.id,
                      name: msg.user.name,
                      text: msg.text,
                      time: msg.created_at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      userId: msg.user.id
                    } : {
                      id: msg.id,
                      name: participants.find(p => p.userId === msg.userId)?.name || 'Guest',
                      text: msg.text,
                      time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      userId: msg.userId
                    };
                    
                    return (
                      <ChatMessageItem
                        key={messageData.id}
                        name={messageData.name}
                        time={messageData.time}
                        message={messageData.text}
                        initials={messageData.name.substring(0, 2).toUpperCase()}
                        isOwn={messageData.userId === localParticipant?.userId}
                      />
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
            <div className="p-3 border-t border-neutral-700/30 bg-neutral-900">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full bg-neutral-800/80 border border-neutral-600/30 rounded-lg pl-3 pr-9 py-2.5 text-xs text-white focus:outline-none focus:border-neutral-500 transition-colors placeholder:text-neutral-500 touch-manipulation"
                />
                <button onClick={sendMessage} disabled={!message.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors disabled:opacity-30 p-1 rounded touch-manipulation">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* People Panel */}
        {activeTab === 'people' && (
          <div className="absolute inset-0 overflow-y-auto p-4">
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-neutral-300 mb-3">Participants ({participants.length})</h3>
              {localParticipant && (
                <div className="p-2 bg-neutral-800/50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={`https://api.dicebear.com/9.x/pixel-art-neutral/svg?seed=${localParticipant?.userId}&glassesProbability=25&mouth=happy01,happy02,happy03,happy04,happy05,happy06,happy07,happy08,happy09,happy10,happy11,happy12,happy13&mouthColor=c98276,d29985,de0f0d,e35d6a,transparent`}
                      alt="Me"
                      className="w-7 h-7 rounded-full bg-neutral-800"
                    />
                    <span className="text-xs text-white font-medium">You</span>
                  </div>
                </div>
              )}
              {participants.filter(p => p.userId !== localParticipant?.userId).map((participant) => (
                <ParticipantItem
                  key={participant.sessionId}
                  name={participant.name || 'Guest'}
                  userId={participant.userId}
                  isMuted={!participant.publishedTracks.some((track: any) => track.type === 'audio')}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tools Panel - Professional Design */}
        {activeTab === 'tools' && (
          <div className="absolute inset-0 overflow-y-auto p-4">
            <div className="space-y-4">
              <h3 className="text-xs font-medium text-neutral-300 mb-3">Meeting Tools</h3>
              {/* Tool Cards */}
              <div className="space-y-2">
                <ToolCardMinimal icon={<Sparkles className="w-4 h-4" />} title="Generate Quiz" subtitle="AI-powered" disabled />
                <ToolCardMinimal icon={<Vote className="w-4 h-4" />} title="Create Poll" subtitle="Instant results" onClick={() => setShowCreatePoll(true)} />
                <ToolCardMinimal icon={<Palette className="w-4 h-4" />} title="Whiteboard" subtitle="Collaborative" onClick={onOpenWhiteboard} />
                <ToolCardMinimal icon={<Calculator className="w-4 h-4" />} title="Graphing Calculator" subtitle="Desmos" onClick={onOpenGraphs} />
              </div>

              {/* Create Poll Modal - Minimal */}
              {showCreatePoll && (
                <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-white">New Poll</h3>
                    <button onClick={() => setShowCreatePoll(false)} className="text-neutral-500 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Ask a question..."
                    value={newPollQuestion}
                    onChange={(e) => setNewPollQuestion(e.target.value)}
                    className="w-full bg-transparent border-b border-white/10 pb-2 text-sm text-white focus:outline-none focus:border-white/30 mb-4 placeholder:text-neutral-600"
                  />

                  <div className="space-y-2 mb-4">
                    {newPollOptions.map((option, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <span className="text-neutral-600 text-xs w-4">{index + 1}.</span>
                        <input
                          type="text"
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...newPollOptions];
                            newOptions[index] = e.target.value;
                            setNewPollOptions(newOptions);
                          }}
                          className="flex-1 bg-transparent border-b border-white/5 pb-1 text-xs text-white focus:outline-none focus:border-white/20 placeholder:text-neutral-700"
                        />
                        {newPollOptions.length > 2 && (
                          <button onClick={() => removePollOption(index)} className="text-neutral-600 hover:text-red-400 p-1">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    {newPollOptions.length < 6 && (
                      <button onClick={addPollOption} className="text-xs text-neutral-500 hover:text-white flex items-center gap-1">
                        <Plus className="w-3 h-3" />
                        Add option
                      </button>
                    )}
                    <button
                      onClick={createPoll}
                      disabled={!newPollQuestion.trim() || newPollOptions.filter(o => o.trim()).length < 2}
                      className="ml-auto px-4 py-1.5 bg-white text-black text-xs font-medium rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-200 transition-colors"
                    >
                      Create
                    </button>
                  </div>
                </div>
              )}

              {/* Active Polls - Minimal */}
              {polls.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Active Polls</p>
                  {polls.map((poll) => (
                    <PollCardMinimal
                      key={poll.id}
                      poll={poll}
                      localUserId={localParticipant?.userId || ''}
                      isExpanded={expandedPolls.has(poll.id)}
                      onToggleExpand={() => togglePollExpanded(poll.id)}
                      onVote={votePoll}
                      onClose={closePoll}
                      isCreator={poll.createdBy.id === localParticipant?.userId}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

// Minimal Tool Card - Apple/Vercel inspired
function ToolCardMinimal({ icon, title, subtitle, onClick, disabled }: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full p-3 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-between text-left transition-all group ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/[0.04] hover:border-white/10'
        }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-neutral-400 group-hover:text-white transition-colors">
          {icon}
        </div>
        <div>
          <span className="block text-xs font-medium text-neutral-200">{title}</span>
          <span className="block text-[10px] text-neutral-600">{subtitle}</span>
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-neutral-700 group-hover:text-neutral-400 transition-colors" />
    </button>
  );
}

// Minimal Poll Card - Monochrome
function PollCardMinimal({ poll, localUserId, isExpanded, onToggleExpand, onVote, onClose, isCreator }: {
  poll: Poll;
  localUserId: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onVote: (pollId: string, optionId: string) => void;
  onClose: (pollId: string) => void;
  isCreator: boolean;
}) {
  const myVote = poll.votes.find(v => v.oderId === localUserId);
  const totalVotes = poll.votes.length;
  const getVotesForOption = (optionId: string) => poll.votes.filter(v => v.optionId === optionId);

  return (
    <div className={`p-3 rounded-xl border ${poll.isActive ? 'border-white/10' : 'border-white/5 opacity-60'} bg-white/[0.02]`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-medium text-white">{poll.question}</p>
          <p className="text-[10px] text-neutral-600">{poll.createdBy.name} · {totalVotes} vote{totalVotes !== 1 ? 's' : ''}</p>
        </div>
        {isCreator && poll.isActive && (
          <button onClick={() => onClose(poll.id)} className="text-[10px] text-neutral-500 hover:text-white px-2 py-0.5 border border-white/10 rounded hover:border-white/20 transition-colors">
            End
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        {poll.options.map((option) => {
          const optionVotes = getVotesForOption(option.id);
          const percentage = totalVotes > 0 ? (optionVotes.length / totalVotes) * 100 : 0;
          const isSelected = myVote?.optionId === option.id;

          return (
            <div key={option.id}>
              <button
                onClick={() => poll.isActive && onVote(poll.id, option.id)}
                disabled={!poll.isActive}
                className={`w-full p-2 rounded-lg text-left relative overflow-hidden transition-all ${isSelected ? 'border border-white/30 bg-white/10' : 'border border-white/5 hover:border-white/10 bg-white/[0.02]'
                  } ${!poll.isActive ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="absolute left-0 top-0 bottom-0 bg-white/5 transition-all" style={{ width: `${percentage}%` }} />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                    <span className="text-xs text-neutral-300">{option.text}</span>
                  </div>
                  <span className="text-[10px] text-neutral-500">{Math.round(percentage)}%</span>
                </div>
              </button>

              {isExpanded && optionVotes.length > 0 && (
                <div className="ml-4 mt-1 mb-2 pl-2 border-l border-white/5">
                  {optionVotes.map(vote => (
                    <div key={vote.oderId} className="text-[10px] text-neutral-600 py-0.5">{vote.odername}</div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {poll.votes.length > 0 && (
        <button onClick={onToggleExpand} className="mt-2 text-[10px] text-neutral-500 hover:text-neutral-300 flex items-center gap-1 transition-colors">
          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {isExpanded ? 'Hide' : 'Show'} voters
        </button>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 px-2 text-xs font-medium border-b-2 transition-all flex items-center justify-center gap-1.5 touch-manipulation min-h-[44px] ${active ? 'border-white text-white bg-neutral-800/50' : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/30'
        }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function ChatMessageItem({ name, time, message, initials, isOwn = false }: { name: string; time: string; message: string; initials: string; isOwn?: boolean; }) {
  return (
    <div className="flex gap-3">
      <img
        src={`https://api.dicebear.com/9.x/pixel-art-neutral/svg?seed=${name}&glassesProbability=25&mouth=happy01,happy02,happy03,happy04,happy05,happy06,happy07,happy08,happy09,happy10,happy11,happy12,happy13&mouthColor=c98276,d29985,de0f0d,e35d6a,transparent`}
        alt={name}
        className="w-6 h-6 rounded-lg bg-neutral-900 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className={`text-[11px] font-medium ${isOwn ? 'text-white' : 'text-neutral-400'}`}>{name}</span>
          <span className="text-[9px] text-neutral-600">{time}</span>
        </div>
        <p className="text-xs mt-0.5 text-neutral-400 break-words">{message}</p>
      </div>
    </div>
  );
}

function ParticipantItem({ name, userId, isMuted }: { name: string; userId: string; isMuted: boolean; }) {
  return (
    <div className="p-2 hover:bg-neutral-800/50 rounded-lg flex items-center justify-between transition-colors">
      <div className="flex items-center gap-2">
        <img
          src={`https://api.dicebear.com/9.x/pixel-art-neutral/svg?seed=${userId}&glassesProbability=25&mouth=happy01,happy02,happy03,happy04,happy05,happy06,happy07,happy08,happy09,happy10,happy11,happy12,happy13&mouthColor=c98276,d29985,de0f0d,e35d6a,transparent`}
          alt={name}
          className="w-7 h-7 rounded-full bg-neutral-800"
        />
        <span className="text-xs text-neutral-300">{name}</span>
      </div>
      {isMuted ? <MicOff className="w-3.5 h-3.5 text-neutral-500" /> : <Mic className="w-3.5 h-3.5 text-neutral-500" />}
    </div>
  );
}