"use client";

import { useState } from "react";
import { useSemesterStore } from "@/store/useSemesterStore";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Plus } from "lucide-react";
import { CreateSemesterDialog } from "./CreateSemesterDialog";

export function SemesterSelector() {
  const { semesters, activeSemesterId, setActiveSemesterId } = useSemesterStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const activeSemester = semesters.find(s => s.$id === activeSemesterId);

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-zinc-400">Current Semester:</span>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm hover:bg-zinc-800 transition-colors"
        >
          {activeSemester ? activeSemester.name : "Select Semester"}
          <ChevronDown className="ml-1 h-4 w-4 text-zinc-500" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px] bg-zinc-950 border-zinc-800">
          <DropdownMenuLabel>Your Semesters</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-zinc-800" />
          
          {semesters.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-zinc-500">
              No semesters yet.
            </div>
          ) : (
            semesters.map((semester) => (
              <DropdownMenuItem 
                key={semester.$id}
                onClick={() => setActiveSemesterId(semester.$id)}
                className={`cursor-pointer ${activeSemesterId === semester.$id ? 'bg-indigo-500/10 text-indigo-400' : ''}`}
              >
                {semester.name}
              </DropdownMenuItem>
            ))
          )}
          
          <DropdownMenuSeparator className="bg-zinc-800" />
          <DropdownMenuItem 
            className="cursor-pointer text-indigo-400 focus:text-indigo-300"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Semester
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateSemesterDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}
