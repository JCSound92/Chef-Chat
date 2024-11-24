import React from 'react';
import { ChatHistory } from '../components/ChatHistory';
import { useStore } from '../store';

export function ChatPage() {
  const { chatHistory } = useStore();

  return (
    <div className="flex flex-col h-full">
      <ChatHistory />
    </div>
  );
}