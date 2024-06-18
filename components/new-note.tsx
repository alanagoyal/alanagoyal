"use client"

import { useEffect } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Icons } from './icons';

export default function NewNote() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'a' && event.metaKey && event.shiftKey) {
        router.push('/new');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router]);

  return <Link href="/new">
    <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>
        <Icons.new />
      </TooltipTrigger>
      <TooltipContent className="bg-[#1e1e1e] text-muted-foreground border-none">
        Click or press ⌘+⇧+A to create a new note
      </TooltipContent>
    </Tooltip>
    </TooltipProvider>
  </Link>;
}
