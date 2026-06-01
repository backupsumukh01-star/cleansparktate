import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

export default function MessageList({
  messages,
  userId,
  onOpenActions,
  onReact,
}) {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const getReplyMessage = (replyToId) => {
    if (!replyToId) return null;
    return messages.find((m) => m.id === replyToId);
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto scroll-touch px-3 py-2 pb-4"
      style={{
        backgroundImage:
          'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23182229\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
      }}
    >
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isOwn={msg.senderId === userId}
          userId={userId}
          replyMessage={getReplyMessage(msg.replyTo)}
          onOpenActions={onOpenActions}
          onReact={onReact}
        />
      ))}
      <div ref={bottomRef} className="h-2" />
    </div>
  );
}
