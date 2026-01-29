import { useMessages, useSendMessage, useDeleteConversation } from "@/hooks/use-messages";
import { useAuth } from "@/hooks/use-auth";
import { useMyProfile } from "@/hooks/use-profiles";
import { Navigation } from "@/components/Navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Send, Loader2, MessageSquare, Trash2, ArrowLeft } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { Message, Profile } from "@shared/schema";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function MessagesPage() {
  const { user } = useAuth();
  const { data: myProfile } = useMyProfile();
  
  // For MVP, we fetch all messages and group them client-side
  const { data: messages, isLoading } = useMessages();
  const sendMessage = useSendMessage();
  const deleteConversation = useDeleteConversation();
  
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const myProfileId = myProfile?.id;

  // Get unique user IDs from messages
  const otherUserIds = useMemo(() => {
    if (!messages || !myProfileId) return [];
    const ids = new Set<number>();
    messages.forEach(msg => {
      const otherId = msg.senderId === myProfileId ? msg.receiverId : msg.senderId;
      if (otherId !== myProfileId) { // Exclude self
        ids.add(otherId);
      }
    });
    return Array.from(ids);
  }, [messages, myProfileId]);

  // Fetch profiles for all conversation partners
  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ['/api/profiles/batch', otherUserIds],
    queryFn: async () => {
      const results: Record<number, Profile> = {};
      for (const id of otherUserIds) {
        try {
          const res = await fetch(`/api/profiles/${id}`, { credentials: 'include' });
          if (res.ok) {
            const profile = await res.json();
            results[id] = profile;
          }
        } catch (e) {}
      }
      return results;
    },
    enabled: otherUserIds.length > 0,
  });

  // Group messages by conversation (excluding messages to self)
  const conversations = messages?.reduce((acc, msg) => {
    if (!myProfileId) return acc;
    const otherId = msg.senderId === myProfileId ? msg.receiverId : msg.senderId;
    // Skip messages to self
    if (otherId === myProfileId) return acc;
    
    const profile = profiles?.[otherId];
    if (!acc[otherId]) {
      acc[otherId] = {
        userId: otherId,
        name: profile?.username || (profilesLoading ? "Loading..." : "Unknown"),
        lastMessage: msg,
        messages: []
      };
    }
    acc[otherId].messages.push(msg);
    // Keep last message updated
    if (new Date(msg.createdAt!) > new Date(acc[otherId].lastMessage.createdAt!)) {
      acc[otherId].lastMessage = msg;
    }
    return acc;
  }, {} as Record<number, { userId: number; name: string; lastMessage: Message; messages: Message[] }>) || {};

  const conversationList = Object.values(conversations).sort(
    (a, b) => new Date(b.lastMessage.createdAt!).getTime() - new Date(a.lastMessage.createdAt!).getTime()
  );

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (!selectedUserId && conversationList.length > 0) {
      setSelectedUserId(conversationList[0].userId);
    }
  }, [conversationList.length]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selectedUserId]);

  const handleSend = () => {
    if (!inputText.trim() || !selectedUserId) return;
    const messageToSend = inputText;
    setInputText(""); // Reset immediately for better UX
    sendMessage.mutate(
      { receiverId: selectedUserId, content: messageToSend },
      { 
        onError: () => {
          setInputText(messageToSend); // Restore on error
        }
      }
    );
  };

  const activeConversation = selectedUserId ? conversations[selectedUserId] : null;

  return (
    <div className="h-screen flex flex-col bg-background">
      <Navigation />
      
      <div className="flex-1 container mx-auto p-2 sm:p-4 flex gap-2 sm:gap-6 overflow-hidden max-h-[calc(100vh-64px)]">
        
        {/* Conversation List */}
        <Card className={`w-full md:w-80 flex-col bg-card/50 backdrop-blur-sm border-border/50 ${selectedUserId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-3 sm:p-4 border-b border-border/50">
            <h2 className="font-display font-bold text-lg sm:text-xl">Messages</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
               <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>
            ) : conversationList.length === 0 ? (
               <div className="p-8 text-center text-muted-foreground text-sm">No conversations yet.</div>
            ) : (
              conversationList.map((conv) => {
                const profileImg = profiles?.[conv.userId]?.profileImageUrl;
                return (
                <div
                  key={conv.userId}
                  className={`w-full p-4 flex items-start gap-3 text-left transition-colors hover:bg-muted/50 ${selectedUserId === conv.userId ? 'bg-muted' : ''}`}
                >
                  <button
                    onClick={() => setSelectedUserId(conv.userId)}
                    className="flex items-start gap-3 flex-1 min-w-0"
                  >
                    <Avatar className="w-10 h-10 border border-border">
                      {profileImg && <AvatarImage src={profileImg} alt={conv.name} />}
                      <AvatarFallback>{conv.name[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-bold text-sm truncate">{conv.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(conv.lastMessage.createdAt!), 'MMM d')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{conv.lastMessage.content}</p>
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedUserId(conv.userId);
                      setShowDeleteDialog(true);
                    }}
                    className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    data-testid={`button-delete-conversation-${conv.userId}`}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              )})
            )}
          </div>
        </Card>

        {/* Chat Area */}
        <Card className={`flex-1 flex-col bg-card shadow-xl border-border/50 overflow-hidden ${selectedUserId ? 'flex' : 'hidden md:flex'}`}>
          {activeConversation ? (
            <>
              <div className="p-3 sm:p-4 border-b border-border/50 flex items-center gap-2 bg-muted/20">
                 <Button 
                   variant="ghost" 
                   size="icon" 
                   className="md:hidden shrink-0"
                   onClick={() => setSelectedUserId(null)}
                   data-testid="button-back-to-list"
                 >
                   <ArrowLeft size={20} />
                 </Button>
                 <div className="flex items-center gap-3">
                   <Avatar className="w-8 h-8">
                     {profiles?.[activeConversation.userId]?.profileImageUrl && (
                       <AvatarImage src={profiles[activeConversation.userId].profileImageUrl!} alt={activeConversation.name} />
                     )}
                     <AvatarFallback>{activeConversation.name[0]?.toUpperCase()}</AvatarFallback>
                   </Avatar>
                   <span className="font-bold text-sm sm:text-base">{activeConversation.name}</span>
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {activeConversation.messages
                  .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime())
                  .map((msg) => {
                    const isMe = msg.senderId === myProfileId;
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isMe ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted text-foreground rounded-bl-none'}`}>
                          {msg.content}
                        </div>
                        <span className={`text-[10px] text-muted-foreground mt-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                          {msg.createdAt && format(new Date(msg.createdAt), 'h:mm a')}
                        </span>
                      </div>
                    );
                  })}
              </div>
              
              <div className="p-4 bg-background border-t border-border/50">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex gap-2"
                >
                  <Input 
                    placeholder="Type a message..." 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex-1 rounded-full bg-secondary/50 border-transparent focus:bg-background transition-all"
                  />
                  <Button type="submit" size="icon" className="rounded-full w-10 h-10 shadow-lg" disabled={!inputText.trim() || sendMessage.isPending}>
                    <Send size={18} />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
               <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
               <p>Select a conversation to start chatting</p>
            </div>
          )}
        </Card>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this entire conversation? All messages will be permanently removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-conversation">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedUserId) {
                  deleteConversation.mutate(selectedUserId);
                  setSelectedUserId(null);
                  setShowDeleteDialog(false);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-conversation"
            >
              Delete Conversation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
