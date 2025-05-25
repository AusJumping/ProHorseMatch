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
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customerId,
          owner_id: ownerId,
          horse_id: horseId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }
      
      return response.json();
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