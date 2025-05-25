import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface MessageButtonProps {
  horseId: number;
  ownerId: number;
  customerId: number;
  horseName: string;
  className?: string;
}

export function MessageButton({ 
  horseId, 
  ownerId, 
  customerId, 
  horseName, 
  className 
}: MessageButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const startConversationMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/conversations', {
        method: 'POST',
        body: {
          customer_id: customerId,
          owner_id: ownerId,
          horse_id: horseId,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      toast({
        title: "Conversation started",
        description: `You can now message about ${horseName}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleClick = () => {
    startConversationMutation.mutate();
  };

  return (
    <Button
      onClick={handleClick}
      disabled={startConversationMutation.isPending}
      className={className}
      size="sm"
    >
      <MessageSquare className="h-4 w-4 mr-2" />
      {startConversationMutation.isPending ? 'Starting...' : 'Message Owner'}
    </Button>
  );
}