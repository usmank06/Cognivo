import { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, Plus, MessageSquare, Trash2, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import type { Canvas } from '../CanvasPage';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Chat {
  id: string;
  messages: Message[];
  createdAt: Date;
}

interface ChatSidebarProps {
  currentCanvas: Canvas | null;
  username: string;
  onReloadCanvas: () => void;
}

export function ChatSidebar({ currentCanvas, username, onReloadCanvas }: ChatSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [width, setWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [chats, setChats] = useState<any[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isEditingCanvas, setIsEditingCanvas] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, currentChatId]);

  // Load chats when canvas changes
  useEffect(() => {
    if (currentCanvas && currentCanvas.chats) {
      setChats(currentCanvas.chats);
      // Select the most recent chat if available
      if (currentCanvas.chats.length > 0) {
        setCurrentChatId(currentCanvas.chats[currentCanvas.chats.length - 1].id);
      } else {
        setCurrentChatId(null);
      }
    } else {
      setChats([]);
      setCurrentChatId(null);
    }
  }, [currentCanvas]);

  const getCurrentChat = () => {
    return chats.find(c => c.id === currentChatId);
  };

  const handleCreateNewChat = async () => {
    if (!currentCanvas) return;

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
      }
    } catch (error) {
      console.error('Create chat error:', error);
      toast.error('Failed to create chat');
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentCanvas || !currentChatId || isStreaming) return;
    
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
      
      console.log('📝 Sending conversation history:', conversationHistory.length, 'messages');

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
              console.log('📩 Received event:', event.type, event);
              
              switch (event.type) {
                case 'text_delta':
                  // Stream text word by word
                  assistantText += event.text;
                  setStreamingText(assistantText);
                  break;
                  
                case 'tool_start':
                  // Show "Editing canvas..." spinner
                  console.log('🔧 Tool started:', event.tool_name);
                  setIsEditingCanvas(true);
                  break;
                  
                case 'tool_finish':
                  // Hide spinner
                  setIsEditingCanvas(false);
                  break;
                  
                case 'canvas_update':
                  // Update canvas in database
                  console.log('🎨 Canvas update received, saving to database...');
                  console.log('Canvas JSON:', event.canvas);
                  console.log('Explanation:', event.explanation);
                  
                  const updateResponse = await fetch(
                    `http://localhost:3001/api/canvas/${username}/${currentCanvas.id}/script`,
                    {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ script: event.canvas }),
                    }
                  );
                  
                  if (updateResponse.ok) {
                    console.log('✅ Canvas saved to database, reloading...');
                    // Reload canvas to show changes
                    await onReloadCanvas();
                    toast.success(`Canvas updated! ${event.explanation || ''}`);
                  } else {
                    console.error('❌ Failed to save canvas to database');
                    toast.error('Failed to update canvas');
                  }
                  break;
                  
                case 'done':
                  // Stream complete
                  setIsStreaming(false);
                  setIsEditingCanvas(false);
                  
                  // Save assistant message to database
                  if (assistantText.trim()) {
                    await fetch(
                      `http://localhost:3001/api/canvas/${username}/${currentCanvas.id}/chat/${currentChatId}/message`,
                      {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ role: 'assistant', content: assistantText }),
                      }
                    );
                    
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
              e.currentTarget.style.backgroundColor = 'rgba(255, 145, 77, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {/* Drag indicator */}
            <div style={{ 
              width: '3px', 
              height: '32px', 
              backgroundColor: '#FF914D',
              borderRadius: '9999px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}></div>
          </div>
        )}

        {isExpanded && (
          <>
            <div className="p-4 border-b border-border space-y-3 flex-shrink-0">
              {chats.length > 0 && (
                <Select 
                  value={currentChatId || undefined} 
                  onValueChange={setCurrentChatId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a chat" />
                  </SelectTrigger>
                  <SelectContent>
                    {chats.map((chat, index) => (
                      <SelectItem key={chat.id} value={chat.id}>
                        Chat {index + 1} ({chat.messages.length} msgs)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleCreateNewChat}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4">
                  {currentChatId && getCurrentChat() ? (
                    <div className="space-y-4">
                      {getCurrentChat()!.messages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`
                              max-w-[80%] rounded-xl px-4 py-2 shadow-sm
                              ${message.role === 'user' 
                                ? 'bg-primary text-white' 
                                : 'bg-secondary/50 text-foreground border border-border'}
                            `}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <span className="text-xs opacity-70 mt-1 block">
                              {formatChatTime(message.timestamp)}
                            </span>
                          </div>
                        </div>
                      ))}
                      
                      {/* Streaming message */}
                      {isStreaming && streamingText && (
                        <div className="flex justify-start">
                          <div className="max-w-[80%] rounded-xl px-4 py-2 bg-secondary/50 text-foreground border border-border shadow-sm">
                            <p className="text-sm whitespace-pre-wrap">{streamingText}</p>
                            {isEditingCanvas && (
                              <div className="flex items-center gap-2 mt-2 text-xs text-primary font-medium">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Editing canvas...</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No chat selected</p>
                        <p className="text-xs mt-1">Create a new chat to get started</p>
                      </div>
                    </div>
                  )}
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
                {!currentChatId && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Create a chat first
                  </p>
                )}
                {isStreaming && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    AI is responding...
                  </p>
                )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}