import React from 'react';
import { ChatHistory } from '../components/ChatHistory';

export function ChatPage() {
  return (
    <div className="flex flex-col h-full">
      <ChatHistory />
    </div>
  );
}