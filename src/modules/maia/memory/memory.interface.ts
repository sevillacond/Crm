export interface MaiaConversation {
  id: string;
  instanceId: string;
  userId: string;
  title: string;
  dealId?: string;
  contatoId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface MaiaMessage {
  id: string;
  conversationId: string;
  instanceId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: any;
  toolResults?: any;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface CreateConversationInput {
  instanceId: string;
  userId: string;
  title?: string;
  dealId?: string;
  contatoId?: string;
  metadata?: Record<string, any>;
}

export interface CreateMessageInput {
  conversationId: string;
  instanceId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: any;
  toolResults?: any;
  metadata?: Record<string, any>;
}
