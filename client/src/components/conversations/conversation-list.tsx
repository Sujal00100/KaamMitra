import { 
  Card, 
  CardContent,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMessaging, Conversation } from '@/hooks/use-messaging';
import { useAuth } from '@/hooks/use-auth';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  onSelectConversation: (conversation: Conversation) => void;
  filter?: (conversation: Conversation) => boolean;
}

export function ConversationList({ onSelectConversation, filter }: ConversationListProps) {
  const { user } = useAuth();
  const { conversations, isLoadingConversations } = useMessaging();
  
  const filteredConversations = conversations && Array.isArray(conversations) 
    ? (filter ? conversations.filter(filter) : conversations)
    : [];

  if (isLoadingConversations) {
    return (
      <div className="space-y-3 p-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="cursor-pointer">
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-3 w-12" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!filteredConversations.length) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">No conversations match your filter</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {filteredConversations.map((conversation) => (
        <ConversationCard
          key={conversation.id}
          conversation={conversation}
          currentUserId={user?.id}
          onClick={() => onSelectConversation(conversation)}
        />
      ))}
    </div>
  );
}

interface ConversationCardProps {
  conversation: Conversation;
  currentUserId?: number;
  onClick: () => void;
}

function ConversationCard({ conversation, currentUserId, onClick }: ConversationCardProps) {
  const { otherParticipant, lastMessage } = conversation;
  
  // Determine if there are unread messages
  const hasUnreadMessages = lastMessage && 
    lastMessage.senderId !== currentUserId && 
    !lastMessage.readAt;

  // Get initials for the avatar fallback
  const initials = otherParticipant.fullName
    .split(' ')
    .map((name) => name[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
  
  // Format the last message time
  const formattedTime = lastMessage?.sentAt 
    ? formatDistanceToNow(new Date(lastMessage.sentAt), { addSuffix: true })
    : 'No messages yet';
  
  return (
    <Card 
      className={`cursor-pointer transition-colors hover:bg-muted/50 ${hasUnreadMessages ? 'border-primary/50 bg-primary/5' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="" alt={otherParticipant.fullName} />
            <AvatarFallback className={hasUnreadMessages ? 'bg-primary text-white' : 'bg-muted'}>
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className={`font-medium truncate ${hasUnreadMessages ? 'font-semibold text-foreground' : 'text-foreground/90'}`}>
                  {otherParticipant.fullName}
                </h4>
                <Badge variant={otherParticipant.userType === 'worker' ? 'secondary' : 'outline'} className="text-xs">
                  {otherParticipant.userType === 'worker' ? 'Worker' : 'Employer'}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{formattedTime}</span>
            </div>
            
            <p className={`text-sm truncate mt-1 ${hasUnreadMessages ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
              {lastMessage ? lastMessage.content : 'Start a conversation...'}
            </p>
          </div>
          
          {hasUnreadMessages && (
            <div className="ml-1 h-2.5 w-2.5 rounded-full bg-primary" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}