import { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, Plus, MessageSquare, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import type { Canvas } from '../BoardPage';

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
  const [chats, setChats] = useState<any[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    if (!inputValue.trim() || !currentCanvas || !currentChatId) return;
    
    const userMessage = inputValue;
    setInputValue('');
    
    try {
      // Add user message
      const response = await fetch(
        `http://localhost:3001/api/canvas/${username}/${currentCanvas.id}/chat/${currentChatId}/message`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'user', content: userMessage }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Update local state with user message
        const updatedChats = chats.map(chat => {
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
        });
        setChats(updatedChats);

        // Dummy AI response
        setTimeout(async () => {
          const dummyResponses = [
            "I understand. Let me help you with that.",
            "That's a great idea! I can assist with modifying the canvas.",
            "I've noted that. Would you like me to make changes to the canvas?",
            "Interesting! I can help visualize that data.",
            "Got it! I'm here to help with your canvas.",
            "I can help you create charts and visualizations for that.",
            "That sounds like a useful addition to your canvas!",
          ];
          const randomResponse = dummyResponses[Math.floor(Math.random() * dummyResponses.length)];
          
          // Send assistant message to database
          await fetch(
            `http://localhost:3001/api/canvas/${username}/${currentCanvas.id}/chat/${currentChatId}/message`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ role: 'assistant', content: randomResponse }),
            }
          );
          
          // Update local state with assistant message
          setChats(prevChats => prevChats.map(chat => {
            if (chat.id === currentChatId) {
              return {
                ...chat,
                messages: [...chat.messages, {
                  role: 'assistant' as const,
                  content: randomResponse,
                  timestamp: new Date(),
                }],
              };
            }
            return chat;
          }));
        }, 500); // Half second delay to simulate thinking
      }
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
    }
  };

  const formatChatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (!currentCanvas) {
    return (
      <div className="w-12 bg-card border-r border-border flex items-center justify-center">
        <Button
          variant="ghost"
          size="sm"
          className="h-12 w-12 p-0"
          disabled
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div 
        className={`
          bg-card border-r border-border transition-all duration-300 ease-in-out
          ${isExpanded ? 'w-80' : 'w-12'}
          flex flex-col h-full
        `}
      >
        {isExpanded ? (
          <>
            <div className="p-4 border-b border-border space-y-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Chat</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              
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
                              max-w-[80%] rounded-lg px-4 py-2
                              ${message.role === 'user' 
                                ? 'bg-primary text-white' 
                                : 'bg-muted text-foreground'}
                            `}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <span className="text-xs opacity-70 mt-1 block">
                              {formatChatTime(message.timestamp)}
                            </span>
                          </div>
                        </div>
                      ))}
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
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={!currentChatId}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!currentChatId || !inputValue.trim()}
                  >
                    Send
                  </Button>
                </div>
                {!currentChatId && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Create a chat first
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(true)}
                className="h-12 w-12 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
      </div>
    </>
  );
}
