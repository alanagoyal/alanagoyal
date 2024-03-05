/**
 * v0 by Vercel.
 * @see https://v0.dev/t/LnxRCcq
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import { Button } from "@/components/ui/button";
import { ChevronRight, Folder, StickyNote, Trash } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export default function Notepad() {
  return (
    <div className="flex h-screen w-full bg-yellow-100">
      <div className="flex flex-col w-72 border-r border-yellow-200 bg-yellow-50 dark:bg-yellow-900">
        <div className="flex items-center h-16 px-6 border-b border-yellow-200 bg-yellow-50 dark:bg-yellow-900">
          <h1 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">
            Notes
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="py-4 space-y-2">
            <Tabs defaultValue="notes">
              <TabsList className="w-full bg-yellow-50">
                <TabsTrigger value="notes" className="w-full">
                  <div className="flex justify-start items-center w-full text-yellow-900 dark:text-yellow-100">
                    <Folder className="ml-2 h-5 w-5 text-yellow-500 dark:text-yellow-300" />
                    <span className="ml-2 flex-1">All Notes</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="trash" className="w-full">
                  <div className="flex justify-start items-center w-full">
                    <Trash className="h-5 w-5 text-yellow-500 dark:text-yellow-300" />
                    <span className="ml-2 flex-1">Trash</span>
                  </div>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="notes" className="w-full py-2">
                <Tabs defaultValue="1">
                  <TabsList className="flex flex-col items-center justify-between bg-yellow-200 dark:bg-yellow-800">
                    <TabsTrigger value="1" className="w-full">
                      <div className="flex text-yellow-900">
                        Note 1
                        <ChevronRight className="h-5 w-5 text-yellow-500" />
                      </div>
                    </TabsTrigger>
                    <TabsTrigger value="2" className="w-full">
                      <div className="flex text-yellow-900">
                        Note 2
                        <ChevronRight className="h-5 w-5 text-yellow-500" />
                      </div>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </TabsContent>
              <TabsContent value="trash" className="w-full px-2 py-2">
                Change your password here.
              </TabsContent>
            </Tabs>
          </div>
          <div className="border-t bg-yellow-50 border-yellow-200 dark:border-yellow-800" />
        </div>
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center h-16 px-6 border-b border-yellow-200 bg-yellow-50 dark:bg-yellow-900">
          <h2 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">
            Alana&apos;s Notes
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <Textarea className="text-sm bg-yellow-100 text-yellow-900 border-yellow-100">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat.
          </Textarea>
        </div>
      </div>
    </div>
  );
}
