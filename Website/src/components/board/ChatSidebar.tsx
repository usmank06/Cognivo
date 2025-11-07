import { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, Plus, MessageSquare, Trash2, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import type { Canvas } from '../CanvasPage';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Chat {
  id: string;
  title?: string;
  messages: Message[];
  createdAt: Date;
}

interface ChatSidebarProps {
  currentCanvas: Canvas | null;
  username: string;
  onReloadCanvas: () => void;
}

export function ChatSidebar({ currentCanvas, username, onReloadCanvas }: ChatSidebarProps) {
  // Load saved state from localStorage
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('chatSidebar-expanded');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem('chatSidebar-width');
    return saved !== null ? parseInt(saved) : 320;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [chats, setChats] = useState<any[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isEditingCanvas, setIsEditingCanvas] = useState(false);
  const [canvasEditEvents, setCanvasEditEvents] = useState<Array<{ duration: number; timestamp: Date; messageIndex: number }>>([]);
  const [isCreatingInitialChat, setIsCreatingInitialChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const canvasEditStartTime = useRef<number | null>(null);

  // Save expanded state to localStorage
  useEffect(() => {
    localStorage.setItem('chatSidebar-expanded', JSON.stringify(isExpanded));
  }, [isExpanded]);

  // Save width to localStorage
  useEffect(() => {
    localStorage.setItem('chatSidebar-width', width.toString());
  }, [width]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth >= 200 && newWidth <= 600) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Auto-scroll to bottom when messages change or when editing canvas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, currentChatId, isEditingCanvas, canvasEditEvents]);

  // Load chats when canvas changes
  useEffect(() => {
    const initializeChats = async () => {
      if (currentCanvas) {
        const chatArray = currentCanvas.chats || [];
        
        // If no chats exist AND we're not already creating one, create one immediately
        if (chatArray.length === 0 && !isCreatingInitialChat) {
          setIsCreatingInitialChat(true);
          try {
            const response = await fetch(
              `http://localhost:3001/api/canvas/${username}/${currentCanvas.id}/chat`,
              { method: 'POST' }
            );
            const data = await response.json();
            
            if (data.success) {
              const newChat: Chat = {
                id: data.chatId,
                messages: [],
                createdAt: new Date(),
              };
              setChats([newChat]);
              setCurrentChatId(data.chatId);
              
              // Reload canvas to update the UI (this will cause this effect to run again but with chats present)
              onReloadCanvas();
            } else {
              setIsCreatingInitialChat(false);
            }
          } catch (error) {
            setIsCreatingInitialChat(false);
          }
        } else if (chatArray.length > 0) {
          // Normal case: chats exist, just load them
          setIsCreatingInitialChat(false); // Reset flag
          setChats(chatArray);
          
          // Set current chat ID - prefer the last one or keep current if valid
          const lastChatId = chatArray[chatArray.length - 1].id;
          const currentIsValid = chatArray.some(c => c.id === currentChatId);
          
          if (!currentIsValid) {
            setCurrentChatId(lastChatId);
          }
        }
      } else {
        setChats([]);
        setCurrentChatId(null);
        setIsCreatingInitialChat(false);
      }
    };
    
    initializeChats();
    // IMPORTANT: Removed onReloadCanvas from dependencies to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCanvas?.id, username]);

  // Load canvas edit events from localStorage when chat changes
  useEffect(() => {
    if (currentCanvas && currentChatId) {
      const key = `canvas-edits-${currentCanvas.id}-${currentChatId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCanvasEditEvents(parsed.map((e: any) => ({
            ...e,
            timestamp: new Date(e.timestamp)
          })));
        } catch (e) {
          console.error('Failed to load canvas edit events:', e);
          setCanvasEditEvents([]);
        }
      } else {
        setCanvasEditEvents([]);
      }
    }
  }, [currentCanvas?.id, currentChatId]);

  // Save canvas edit events to localStorage whenever they change
  useEffect(() => {
    if (currentCanvas && currentChatId && canvasEditEvents.length > 0) {
      const key = `canvas-edits-${currentCanvas.id}-${currentChatId}`;
      localStorage.setItem(key, JSON.stringify(canvasEditEvents));
    }
  }, [canvasEditEvents, currentCanvas?.id, currentChatId]);

  const getCurrentChat = () => {
    return chats.find(c => c.id === currentChatId);
  };

  const handleCreateNewChat = async () => {
    if (!currentCanvas) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3001/api/canvas/${username}/${currentCanvas.id}/chat`,
        { method: 'POST' }
      );

      const data = await response.json();

      if (data.success) {
        const newChat: Chat = {
          id: data.chatId,
          messages: [],
          createdAt: new Date(),
        };
        setChats([...chats, newChat]);
        setCurrentChatId(data.chatId);
        toast.success('New chat created!');
        
        // Reload canvas to ensure sync
        onReloadCanvas();
      }
    } catch (error) {
      console.error('[Chat] Failed to create:', error);
      toast.error('Failed to create chat');
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentCanvas || !currentChatId || isStreaming) {
      return;
    }
    
    const userMessage = inputValue;
    setInputValue('');
    setIsStreaming(true);
    setStreamingText('');
    setIsEditingCanvas(false);
    
    try {
      // Add user message to database
      const userMsgResponse = await fetch(
        `http://localhost:3001/api/canvas/${username}/${currentCanvas.id}/chat/${currentChatId}/message`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'user', content: userMessage }),
        }
      );

      if (!userMsgResponse.ok) {
        throw new Error('Failed to save user message');
      }

      // Update local state with user message
      setChats(prevChats => prevChats.map(chat => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: [...chat.messages, {
              role: 'user' as const,
              content: userMessage,
              timestamp: new Date(),
            }],
          };
        }
        return chat;
      }));

      // Build conversation history
      const currentChat = chats.find(c => c.id === currentChatId);
      const conversationHistory = currentChat?.messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })) || [];
      
      // Add the new user message
      conversationHistory.push({ role: 'user', content: userMessage });

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      // Stream AI response
      const response = await fetch('http://localhost:3001/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory,
          canvasId: currentCanvas.id,
          username: username,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      // Read stream line by line
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantText = '';
      let messageSegments: Array<{ type: 'text' | 'edit', content: string, timestamp?: Date }> = [];
      let currentSegmentText = '';
      let hasUsedTool = false;
      let toolExplanation = ''; // Store explanation from canvas_update event

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (!line.trim()) continue;
            
            try {
              const event = JSON.parse(line);
              
              switch (event.type) {
                case 'text_delta':
                  // Stream text word by word
                  currentSegmentText += event.text;
                  assistantText += event.text;
                  setStreamingText(currentSegmentText); // Show only current segment, not accumulated
                  break;
                  
                case 'tool_start':
                  // Show "Editing canvas..." spinner
                  
                  // Save any text accumulated BEFORE tool use as a message segment
                  if (currentSegmentText.trim()) {
                    messageSegments.push({ 
                      type: 'text', 
                      content: currentSegmentText.trim(),
                      timestamp: new Date()
                    });
                    
                    // Save this pre-edit message to database immediately
                    await fetch(
                      `http://localhost:3001/api/canvas/${username}/${currentCanvas.id}/chat/${currentChatId}/message`,
                      {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ role: 'assistant', content: currentSegmentText.trim() }),
                      }
                    );
                    
                    // Update local state to show the pre-edit message
                    setChats(prevChats => prevChats.map(chat => {
                      if (chat.id === currentChatId) {
                        return {
                          ...chat,
                          messages: [...chat.messages, {
                            role: 'assistant' as const,
                            content: currentSegmentText.trim(),
                            timestamp: new Date(),
                          }],
                        };
                      }
                      return chat;
                    }));
                    
                    currentSegmentText = '';
                    setStreamingText(''); // Clear streaming text to prepare for next segment
                  }
                  
                  hasUsedTool = true;
                  setIsEditingCanvas(true);
                  canvasEditStartTime.current = Date.now();
                  break;
                  
                case 'tool_finish':
                  // Hide spinner
                  setIsEditingCanvas(false);
                  break;
                  
                case 'canvas_update':
                  // Update canvas in database
                  
                  // Store the explanation to use as fallback message
                  if (event.explanation) {
                    toolExplanation = event.explanation;
                  }
                  
                  const updateResponse = await fetch(
                    `http://localhost:3001/api/canvas/${username}/${currentCanvas.id}/script`,
                    {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ script: event.canvas }),
                    }
                  );
                  
                  if (updateResponse.ok) {
                    // Calculate duration
                    const duration = canvasEditStartTime.current 
                      ? Math.round((Date.now() - canvasEditStartTime.current) / 1000) 
                      : 0;
                    
                    // Store duration temporarily to be used when assistant message is added
                    canvasEditStartTime.current = duration as any; // Store as duration instead of start time
                    
                    // Reload canvas to show changes
                    await onReloadCanvas();
                    
                    toast.success('Canvas updated');
                  } else {
                    console.error('[Chat] Canvas save failed');
                    toast.error('Failed to update canvas');
                  }
                  
                  setIsEditingCanvas(false);
                  break;
                  
                case 'done':
                  // Stream complete
                  setIsStreaming(false);
                  setIsEditingCanvas(false);
                  
                  // Save any remaining text after tool use as final message segment
                  if (currentSegmentText.trim()) {
                    console.log('💬 Saving post-edit message segment:', currentSegmentText.substring(0, 50) + '...');
                    messageSegments.push({ 
                      type: 'text', 
                      content: currentSegmentText.trim(),
                      timestamp: new Date()
                    });
                  }
                  // If no post-edit text but we have a tool explanation, use that
                  else if (hasUsedTool && !currentSegmentText.trim() && toolExplanation.trim()) {
                    console.log('💬 Using tool explanation as post-edit message:', toolExplanation.substring(0, 50) + '...');
                    currentSegmentText = toolExplanation;
                    messageSegments.push({ 
                      type: 'text', 
                      content: toolExplanation.trim(),
                      timestamp: new Date()
                    });
                  }
                  
                  // Save post-edit message to database (if any text after tool use)
                  if (hasUsedTool && currentSegmentText.trim()) {
                    await fetch(
                      `http://localhost:3001/api/canvas/${username}/${currentCanvas.id}/chat/${currentChatId}/message`,
                      {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ role: 'assistant', content: currentSegmentText.trim() }),
                      }
                    );
                    
                    // Update local state
                    setChats(prevChats => prevChats.map(chat => {
                      if (chat.id === currentChatId) {
                        return {
                          ...chat,
                          messages: [...chat.messages, {
                            role: 'assistant' as const,
                            content: currentSegmentText.trim(),
                            timestamp: new Date(),
                          }],
                        };
                      }
                      return chat;
                    }));
                    
                    // Add canvas edit event tracking after the post-edit message
                    if (typeof canvasEditStartTime.current === 'number' && canvasEditStartTime.current > 0) {
                      setTimeout(() => {
                        setChats(currentChats => {
                          const currentChat = currentChats.find(c => c.id === currentChatId);
                          // The edit event should appear BEFORE the post-edit message
                          // So we use messages.length - 1 (the pre-edit message index + 1)
                          const messageIndex = currentChat ? currentChat.messages.length - 1 : 0;
                          
                          setCanvasEditEvents(prev => [...prev, {
                            duration: canvasEditStartTime.current as number,
                            timestamp: new Date(),
                            messageIndex,
                          }]);
                          
                          return currentChats;
                        });
                        
                        canvasEditStartTime.current = null;
                      }, 100);
                    }
                  }
                  // If tool was used but no post-edit message, still track the edit event
                  else if (hasUsedTool) {
                    if (typeof canvasEditStartTime.current === 'number' && canvasEditStartTime.current > 0) {
                      setTimeout(() => {
                        setChats(currentChats => {
                          const currentChat = currentChats.find(c => c.id === currentChatId);
                          const messageIndex = currentChat ? currentChat.messages.length : 0;
                          
                          setCanvasEditEvents(prev => [...prev, {
                            duration: canvasEditStartTime.current as number,
                            timestamp: new Date(),
                            messageIndex,
                          }]);
                          
                          return currentChats;
                        });
                        
                        canvasEditStartTime.current = null;
                      }, 100);
                    }
                  }
                  // If no tool was used, save all text as one message
                  else if (!hasUsedTool && assistantText.trim()) {
                    await fetch(
                      `http://localhost:3001/api/canvas/${username}/${currentCanvas.id}/chat/${currentChatId}/message`,
                      {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ role: 'assistant', content: assistantText }),
                      }
                    );
                    
                    // Check if chat needs a title (only user + assistant message, no title yet)
                    // Note: Check before updating state. For a new chat, messages.length will be 0 in state
                    // but we just saved the user message, so this will be the first assistant response
                    const currentChat = chats.find(c => c.id === currentChatId);
                    const needsTitle = currentChat && currentChat.messages.length === 0 && !currentChat.title;
                    
                    // Update local state
                    setChats(prevChats => prevChats.map(chat => {
                      if (chat.id === currentChatId) {
                        return {
                          ...chat,
                          messages: [...chat.messages, {
                            role: 'assistant' as const,
                            content: assistantText,
                            timestamp: new Date(),
                          }],
                        };
                      }
                      return chat;
                    }));
                    
                    // Generate title if this chat doesn't have one yet and this is the first response
                    if (needsTitle) {
                      // This was the first user message, generate a title
                      console.log('🎯 Generating title for first message:', userMessage);
                      try {
                        const titleResponse = await fetch('http://localhost:8000/api/chat/generate-title', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ user_message: userMessage }),
                        });
                        
                        if (titleResponse.ok) {
                          const { title } = await titleResponse.json();
                          console.log('✅ Generated title:', title);
                          
                          // Update title in database
                          await fetch(
                            `http://localhost:3001/api/canvas/${username}/${currentCanvas.id}/chat/${currentChatId}/title`,
                            {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ title }),
                            }
                          );
                          
                          // Update local state
                          setChats(prevChats => prevChats.map(chat => {
                            if (chat.id === currentChatId) {
                              return { ...chat, title };
                            }
                            return chat;
                          }));
                          
                          console.log('💾 Title saved and updated in UI');
                        } else {
                          console.error('❌ Title generation failed:', await titleResponse.text());
                        }
                      } catch (error) {
                        console.error('❌ Failed to generate title:', error);
                      }
                    } else {
                      const currentChatForLog = chats.find(c => c.id === currentChatId);
                      console.log('⏭️ Skipping title generation:', {
                        messageCount: currentChatForLog?.messages.length,
                        hasTitle: !!currentChatForLog?.title,
                        title: currentChatForLog?.title
                      });
                    }
                  }
                  
                  setStreamingText('');
                  break;
                  
                case 'error':
                  console.error('Stream error:', event.error);
                  toast.error(`AI Error: ${event.error}`);
                  setIsStreaming(false);
                  setIsEditingCanvas(false);
                  setStreamingText('');
                  break;
              }
            } catch (e) {
              console.error('Error parsing event:', e, line);
            }
          }
        }
      }
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Stream aborted');
      } else {
        console.error('Send message error:', error);
        toast.error('Failed to get AI response');
      }
      setIsStreaming(false);
      setIsEditingCanvas(false);
      setStreamingText('');
    }
  };

  const formatChatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (!currentCanvas) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-16 bg-background border border-r-0 border-border rounded-l-lg flex items-center justify-center hover:bg-secondary/50 transition-colors shadow-sm z-20"
          disabled
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="w-0 bg-background border-r border-border flex items-center justify-center relative"></div>
      </div>
    );
  }

  return (
    <div 
      className="relative h-full" 
      style={{ 
        width: isExpanded ? `${width}px` : '0px', 
        transition: isResizing ? 'none' : 'width 0.3s ease-in-out'
      }}
    >
      {/* Collapse/Expand Tab - always visible on canvas side */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute top-1/2 -translate-y-1/2 w-6 h-16 bg-background border border-r-0 border-border rounded-l-lg flex items-center justify-center hover:bg-secondary/50 transition-colors shadow-sm"
        style={{
          left: isExpanded ? `${width}px` : '0px',
          transition: isResizing ? 'none' : 'left 0.3s ease-in-out',
          zIndex: 30
        }}
      >
        {isExpanded ? (
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      <div 
        ref={sidebarRef}
        className="bg-background border-r border-border shadow-sm flex flex-col h-full relative"
        style={{ 
          width: '100%',
          overflow: 'hidden'
        }}
      >
        {/* Resize handle */}
        {isExpanded && (
          <div
            className="absolute right-0 top-1/2 w-4 z-50 flex items-center justify-center"
            style={{ 
              userSelect: 'none', 
              cursor: 'col-resize', 
              backgroundColor: 'transparent',
              height: '48px',
              transform: 'translateY(-50%)',
              borderRadius: '6px'
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsResizing(true);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary)';
              e.currentTarget.style.opacity = '0.08';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.opacity = '1';
            }}
          >
            {/* Drag indicator */}
            <div style={{ 
              width: '3px', 
              height: '32px', 
              backgroundColor: 'var(--primary)',
              borderRadius: '9999px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}></div>
          </div>
        )}

        {isExpanded && (
          <>
            <div className="p-4 border-b border-border flex-shrink-0">
              <div className="flex gap-2">
                <Select 
                  value={currentChatId || undefined} 
                  onValueChange={setCurrentChatId}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a chat" />
                  </SelectTrigger>
                  <SelectContent style={{ maxWidth: `${width - 40}px` }}>
                    {chats.map((chat, index) => (
                      <SelectItem key={chat.id} value={chat.id}>
                        <div className="truncate whitespace-nowrap overflow-hidden w-full">
                          {chat.title || `Chat ${index + 1}`}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  className="flex-shrink-0 h-10 w-10 p-0"
                  onClick={handleCreateNewChat}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4">
                  {currentChatId && getCurrentChat() ? (
                    <div className="space-y-4">
                      {getCurrentChat()!.messages.length === 0 && !isStreaming && (
                        <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 240px)' }}>
                          <div className="text-center text-muted-foreground">
                            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">Send a message to get started</p>
                          </div>
                        </div>
                      )}
                      {getCurrentChat()!.messages.map((message: Message, index: number) => (
                        <div key={index}>
                          {/* Regular message */}
                          <div
                            className={`flex ${
                              message.role === 'user' 
                                ? 'justify-end' 
                                : 'justify-start'
                            }`}
                          >
                            <div
                              className={`
                                max-w-[80%] rounded-xl px-4 py-2 shadow-sm
                                ${message.role === 'user' 
                                  ? 'bg-primary text-white' 
                                  : 'bg-secondary/50 text-foreground border border-border'}
                              `}
                            >
                              <div className="text-sm">
                                <ReactMarkdown
                                  components={{
                                    p: ({ children }) => <p className="text-sm whitespace-pre-wrap my-1 first:mt-0 last:mb-0">{children}</p>,
                                    ul: ({ children }) => <ul className="text-sm list-disc ml-4 my-1 space-y-0.5">{children}</ul>,
                                    ol: ({ children }) => <ol className="text-sm list-decimal ml-4 my-1 space-y-0.5">{children}</ol>,
                                    li: ({ children }) => <li className="text-sm">{children}</li>,
                                    strong: ({ children }) => <strong className="text-sm font-semibold">{children}</strong>,
                                    em: ({ children }) => <em className="text-sm italic">{children}</em>,
                                    code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                              {/* <span className="text-xs opacity-70 mt-1 block">
                                {formatChatTime(message.timestamp)}
                              </span> */}
                            </div>
                          </div>
                          
                          {/* Canvas edit event after this message (if any) */}
                          {canvasEditEvents
                            .filter(event => event.messageIndex === index + 1)
                            .map((event, eventIdx) => (
                              <div key={`edit-${eventIdx}`} className="flex justify-center" style={{ marginTop: '24px' }}>
                                <div style={{ width: '85%', paddingTop: '16px', paddingBottom: '16px' }} className="rounded-lg px-4 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 shadow-sm">
                                  <div className="flex items-center justify-center gap-3">
                                    <div className="text-center">
                                      <p className="text-sm font-medium text-primary">Canvas edited</p>
                                      <p className="text-xs text-muted-foreground mt-0.5">Completed in {event.duration}s</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      ))}
                      
                      {/* Active canvas editing indicator - shows first */}
                      {isEditingCanvas && (
                        <div className="flex justify-center" style={{ marginTop: '24px' }}>
                          <div style={{ width: '85%', paddingTop: '16px', paddingBottom: '16px' }} className="rounded-lg px-4 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 shadow-sm animate-pulse">
                            <div className="flex items-center justify-center gap-3">
                              <div className="relative">
                                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                                <div className="absolute inset-0 h-5 w-5 rounded-full bg-primary/20 animate-ping" />
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-medium text-primary">Editing canvas</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Applying changes...</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Streaming message or loading indicator - shows after editing canvas */}
                      {isStreaming && (
                        <div className="flex justify-start">
                          <div className="max-w-[80%] rounded-xl px-4 py-2 bg-secondary/50 text-foreground border border-border shadow-sm">
                            {streamingText ? (
                              <div className="text-sm">
                                <ReactMarkdown
                                  components={{
                                    p: ({ children }) => <p className="text-sm whitespace-pre-wrap my-1 first:mt-0 last:mb-0">{children}</p>,
                                    ul: ({ children }) => <ul className="text-sm list-disc ml-4 my-1 space-y-0.5">{children}</ul>,
                                    ol: ({ children }) => <ol className="text-sm list-decimal ml-4 my-1 space-y-0.5">{children}</ol>,
                                    li: ({ children }) => <li className="text-sm">{children}</li>,
                                    strong: ({ children }) => <strong className="text-sm font-semibold">{children}</strong>,
                                    em: ({ children }) => <em className="text-sm italic">{children}</em>,
                                    code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                                  }}
                                >
                                  {streamingText}
                                </ReactMarkdown>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center py-2">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div ref={messagesEndRef} />
                    </div>
                  ) : null}
                </div>
              </ScrollArea>
            </div>

            <div className="p-4 border-t border-border flex-shrink-0">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    disabled={!currentChatId || isStreaming}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!currentChatId || !inputValue.trim() || isStreaming}
                  >
                    {isStreaming ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Send'
                    )}
                  </Button>
                </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}