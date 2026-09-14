import React from 'react';
import { ChevronLeft, Share2 } from 'lucide-react';

interface TopBarProps {
  projectName: string;
  onBackClick: () => void;
  onTitleClick: () => void;
  onShareClick: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  projectName,
  onBackClick,
  onTitleClick,
  onShareClick,
}) => {
  return (
    <header className="flex h-14 w-full items-center justify-between bg-[#0E0E10] px-3 border-b border-[#1A1A20] select-none z-20">
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <button
          id="btn-topbar-back"
          onClick={onBackClick}
          aria-label="Back to Projects"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white/90 hover:bg-white/10 active:scale-95 transition-all"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <button
          id="btn-topbar-rename-title"
          onClick={onTitleClick}
          title="Click to rename project"
          className="group flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-left hover:bg-white/5 transition-colors max-w-[calc(100%-60px)]"
        >
          <span className="truncate text-base md:text-lg font-semibold tracking-tight text-white group-hover:text-white/90">
            {projectName}
          </span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          id="btn-topbar-share"
          onClick={onShareClick}
          aria-label="Export and Share"
          title="Export / Share project"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1C1C24] text-white/90 hover:bg-[#282834] active:scale-95 transition-all shadow-sm"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
