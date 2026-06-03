import ChatPage from "@/modules/chat/ChatPage";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default function Page() {
  return <ChatPage />;
}
