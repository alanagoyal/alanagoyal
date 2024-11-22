import { Nav } from "./nav";
import { Sidebar } from "./sidebar";
import ChatArea from "./chat-area";
import { useState } from "react";

export default function App() {
  const [isNewChat, setIsNewChat] = useState(false);

  return (
    <main className="h-screen w-screen bg-background flex flex-col">
      <div className="flex-1 flex">
        <Sidebar>
          <Nav onNewChat={() => setIsNewChat(true)} />
        </Sidebar>
        <ChatArea isNewChat={isNewChat} setIsNewChat={setIsNewChat} />
      </div>
    </main>
  );
}
