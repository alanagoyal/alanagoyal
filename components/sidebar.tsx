import SidebarContent from "./sidebar-content";
import SidebarHeader from "./sidebar-header";

export default function Sidebar({notes}: {notes: any[] | null}) {
    if (!notes) {
        return null
    }
    
    return (
        <aside className="w-[300px] border-r border-gray-700 p-5">
          <SidebarHeader />
          <SidebarContent notes={notes}/>
        </aside>
    )
}

