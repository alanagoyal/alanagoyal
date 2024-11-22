import { Nav } from "./nav";
import { Sidebar } from "./sidebar";
import ChatArea from "./chat-area";

export default function App() {
  return (
    <main className="h-full bg-background">
      <div className="h-full flex">
        <div className="w-80 flex flex-col border-r">
          <Nav />
          <div className="flex">
            <Sidebar />
          </div>
        </div>
        <div className="flex w-full">
          <ChatArea />
        </div>
      </div>
    </main>
  );
}
