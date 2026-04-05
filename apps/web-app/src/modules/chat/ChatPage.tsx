export default function ChatPage() {
  return (
    <div className="flex h-96 flex-col items-center justify-center text-center">
      <div className="mb-4 rounded-full bg-green-100 p-6">
        <svg viewBox="0 0 24 24" className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 6h16v10H7l-3 3z" />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold text-slate-900 mb-2">Chat</h2>
      <p className="text-slate-500 max-w-md">
        Communicate with your team members through direct messages and group chats. Start conversations here.
      </p>
    </div>
  );
}