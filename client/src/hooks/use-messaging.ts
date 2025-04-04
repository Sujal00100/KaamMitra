import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface User {
  id: number;
  username: string;
  fullName: string;
  userType: 'worker' | 'employer';
  location: string;
  email: string;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  sentAt: string;
  readAt: string | null;
  metadata: any;
}

export interface Conversation {
  id: number;
  participant1Id: number;
  participant2Id: number;
  jobId: number | null;
  createdAt: string;
  lastMessageAt: string;
  otherParticipant: User;
  lastMessage?: Message;
  unreadCount?: number;
}

export interface ConversationDetails {
  conversation: Conversation;
  otherParticipant: User;
  messages: Message[];
}

export function useMessaging() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all conversations
  const { 
    data: conversations, 
    isLoading: isLoadingConversations,
    error: conversationsError,
    refetch: refetchConversations
  } = useQuery({
    queryKey: ['/api/conversations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/conversations');
      return response.json();
    },
  });

  // Function to get a specific conversation with messages
  const getConversation = (conversationId: number) => {
    return useQuery({
      queryKey: ['/api/conversations', conversationId],
      queryFn: async () => {
        const response = await apiRequest('GET', `/api/conversations/${conversationId}`);
        return response.json();
      },
      // Only automatically refetch every 5 seconds for active conversations
      refetchInterval: 5000,
    });
  };

  // Create a new conversation
  const createConversation = useMutation({
    mutationFn: async ({ participantId, jobId }: { participantId: number; jobId?: number | null }) => {
      const response = await apiRequest('POST', '/api/conversations', { participantId, jobId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create conversation',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    },
  });

  // Send a message
  const sendMessage = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: number; content: string }) => {
      const response = await apiRequest('POST', `/api/conversations/${conversationId}/messages`, { content });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to send message',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    },
  });

  // Mark message as read
  const markMessageAsRead = useMutation({
    mutationFn: async ({ messageId }: { messageId: number }) => {
      const response = await apiRequest('PATCH', `/api/messages/${messageId}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
  });

  // Mark all messages in a conversation as read
  const markAllMessagesAsRead = useMutation({
    mutationFn: async ({ conversationId }: { conversationId: number }) => {
      const response = await apiRequest('PATCH', `/api/conversations/${conversationId}/read`);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to mark messages as read',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    },
  });

  return {
    conversations,
    isLoadingConversations,
    conversationsError,
    refetchConversations,
    getConversation,
    createConversation,
    sendMessage,
    markMessageAsRead,
    markAllMessagesAsRead,
  };
}