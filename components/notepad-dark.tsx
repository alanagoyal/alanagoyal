/**
 * v0 by Vercel.
 * @see https://v0.dev/t/RGOPJWMx88U
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Star } from "lucide-react"
import { Textarea } from "./ui/textarea"
import { Input } from "./ui/input"

export default function Component() {
  return (
    <div className="bg-[#1e1e1e] text-white min-h-screen">
      <div className="flex">
        <aside className="w-64 border-r border-gray-700 p-5">
          <div className="flex items-center justify-between mb-10">
            <h1 className="text-lg font-bold">Pinned</h1>
            <Star className="text-yellow-500" />
          </div>
          <ul>
            <li className="flex items-center justify-between mb-4">
              <span>9/16/23</span>
              <Badge variant="secondary">priority</Badge>
            </li>
            <li className="mb-4">Today</li>
            <li className="mb-4">
              <h2 className="font-bold">alana's notepad</h2>
              <p>5:35 PM hi, welcome...</p>
            </li>
            <li className="mb-4">
              <h2 className="font-bold">AI account takeov...</h2>
              <p>11:19 AM portmanteau</p>
            </li>
            <li className="mb-4">
              <h2 className="font-bold">AI account takeov...</h2>
              <span>11:15 AM 1/5</span>
            </li>
            <li className="mb-4">Yesterday</li>
            <li className="mb-4">
              <h2 className="font-bold">priorities</h2>
              <p>Yesterday what are t...</p>
            </li>
            <li className="mb-4">Previous 7 Days</li>
            <li className="mb-4">
              <h2 className="font-bold">background-color...</h2>
              <p>Friday background-i...</p>
            </li>
            <li className="mb-4">
              <h2 className="font-bold">office todos</h2>
              <p>Wednesday chargers</p>
            </li>
            <li className="mb-4">Previous 30 Days</li>
            <li className="mb-4">
              <h2 className="font-bold">friday</h2>
              <p>2/23/24 print logo</p>
            </li>
            <li className="mb-4">
              <h2 className="font-bold">doctors</h2>
              <p>2/21/24 knee (John...)</p>
            </li>
            <li className="mb-4">
              <h2 className="font-bold">public</h2>
              <p>2/19/24 door does n...</p>
            </li>
            <li className="mb-4">
              <h2 className="font-bold">closing campaign</h2>
              <p>2/18/24 zoom</p>
            </li>
          </ul>
        </aside>
        <main className="flex-1 p-5">
          <div className="bg-[#1e1e1e] pb-4 mb-4">
            <Input placeholder="Alana's notes"/>
            <p className="text-gray-400">March 4, 2024 at 5:35 PM</p>
          </div>
          <Textarea className="bg-[#1e1e1e]">hi, welcome to my website/notepad</Textarea>
        </main>
      </div>
    </div>
  )
}
