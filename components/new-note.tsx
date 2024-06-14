"use client"

import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function NewNote() {
  return <Link href="/new">
    <PlusCircle className="w-4 h-4" />
  </Link>;
}
