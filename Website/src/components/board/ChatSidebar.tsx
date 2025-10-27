import { useState, useEffect } from 'react';
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');

  // Load chats when canvas changes
  useEffect(() => {
    if (currentCanvas && currentCanvas.chats) {
      setChats(currentCanvas.chats);
      // Select the most recent chat
      if (currentCanvas.chats.length > 0) {
        setCurrentChatId(currentCanvas.chats[currentCanvas.chats.length - 1].id);
      } else {
        setCurrentChatId(null);
      }
    } else {
      setChats([]);
      setCurrentChatId(null);
    }
  }, [currentCanvas?.id]);

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
    
    try {
      // Add user message
      const response = await fetch(
        `http://localhost:3001/api/canvas/${username}/${currentCanvas.id}/chat/${currentChatId}/message`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'user', content: inputValue }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Update local state
        const updatedChats = chats.map(chat => {
          if (chat.id === currentChatId) {
            return {
              ...chat,
              messages: [...chat.messages, {
                role: 'user' as const,
                content: inputValue,
                timestamp: new Date(),
              }],
            };
          }
          return chat;
        });
        setChats(updatedChats);
        setInputValue('');

        // TODO: Here you would call your AI/chat API
        // For now, just add a placeholder response
        // In the future, this is where chat would analyze and modify the canvas
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
          flex flex-col
        `}
      >
        <div className="h-full flex flex-col">
          {isExpanded ? (
            <>
              <div className="p-4 border-b border-border space-y-3">
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
              
              <ScrollArea className="flex-1 p-4">
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
              </ScrollArea>

              <div className="p-4 border-t border-border">
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
      </div>
    </>
  );
}
