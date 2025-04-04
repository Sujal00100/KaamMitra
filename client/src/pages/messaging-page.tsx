import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useMessaging, Conversation } from '@/hooks/use-messaging';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { NewConversationDialog } from '@/components/conversations/new-conversation-dialog';
import { ConversationList } from '@/components/conversations/conversation-list';
import { ConversationView } from '@/components/conversations/conversation-view';
import { MessageCircle, Plus, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';

export default function MessagingPage() {
  const { user } = useAuth();
  const { conversations, isLoadingConversations, error, refetchConversations } = useMessaging();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [location] = useLocation();
  const [newConversationOpen, setNewConversationOpen] = useState(false);

  // Extract conversationId from URL if present (/messaging/123)
  const conversationIdFromUrl = location.startsWith('/messaging/') 
    ? parseInt(location.split('/messaging/')[1]) 
    : null;

  // Use the conversation ID from URL if available, otherwise use the selected conversation
  const currentConversationId = conversationIdFromUrl || selectedConversation;

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation.id);
  };

  const handleBack = () => {
    setSelectedConversation(null);
  };

  const handleConversationCreated = (conversationId: number) => {
    refetchConversations();
    setSelectedConversation(conversationId);
    setNewConversationOpen(false);
  };

  if (!user) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please log in to access the messaging feature.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:py-8">
      <Card className="shadow-lg border-none">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Messages</CardTitle>
              <CardDescription className="text-white/80">
                Communicate directly with employers and workers
              </CardDescription>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              className="gap-2"
              onClick={() => setNewConversationOpen(true)}
            >
              <Plus size={16} />
              <span>New Message</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <Alert variant="destructive" className="m-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : 'Failed to load messages'}
              </AlertDescription>
            </Alert>
          ) : currentConversationId ? (
            <ConversationView 
              conversationId={currentConversationId} 
              onBack={handleBack} 
            />
          ) : (
            <div className="min-h-[400px]">
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mx-auto px-4 py-2">
                  <TabsTrigger value="all">All Messages</TabsTrigger>
                  <TabsTrigger value={user.userType === 'worker' ? 'employer' : 'worker'}>
                    {user.userType === 'worker' ? 'Employers' : 'Workers'}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="space-y-1">
                  {isLoadingConversations ? (
                    <div className="flex items-center justify-center h-48">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : conversations && conversations.length > 0 ? (
                    <ConversationList onSelectConversation={handleSelectConversation} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-center p-4">
                      <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="font-semibold text-lg">No messages yet</h3>
                      <p className="text-muted-foreground mt-1">
                        Start a conversation to connect with employers and workers
                      </p>
                      <Button
                        variant="default"
                        className="mt-4"
                        onClick={() => setNewConversationOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        New Conversation
                      </Button>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value={user.userType === 'worker' ? 'employer' : 'worker'}>
                  {isLoadingConversations ? (
                    <div className="flex items-center justify-center h-48">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : conversations && conversations.length > 0 ? (
                    <ConversationList
                      onSelectConversation={handleSelectConversation}
                      filter={conversation => 
                        conversation.otherParticipant.userType === 
                        (user.userType === 'worker' ? 'employer' : 'worker')
                      }
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-center p-4">
                      <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="font-semibold text-lg">
                        No messages with {user.userType === 'worker' ? 'employers' : 'workers'}
                      </h3>
                      <p className="text-muted-foreground mt-1">
                        Start a conversation to connect with {user.userType === 'worker' ? 'potential employers' : 'skilled workers'}
                      </p>
                      <Button
                        variant="default"
                        className="mt-4"
                        onClick={() => setNewConversationOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        New Conversation
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-muted/30 flex items-center justify-between p-4">
          <p className="text-sm text-muted-foreground">
            All messages are private between you and the recipient
          </p>
          <Button variant="outline" size="sm" onClick={() => refetchConversations()}>
            Refresh
          </Button>
        </CardFooter>
      </Card>

      <NewConversationDialog
        open={newConversationOpen}
        onOpenChange={setNewConversationOpen}
        userType={user.userType === 'worker' ? 'employer' : 'worker'}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  );
}