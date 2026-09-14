import React from 'react';
import { Plus } from 'lucide-react';

interface AddTrackRowProps {
  onAddTrackClick: () => void;
  headerLeftWidth?: number;
}

export const AddTrackRow: React.FC<AddTrackRowProps> = ({
  onAddTrackClick,
  headerLeftWidth = 60,
}) => {
  return (
    <div
      id="add-track-row"
      className="flex h-16 w-full bg-[#0A0A0E] select-none border-b border-[#14141A]"
    >
      <div
        style={{ width: `${headerLeftWidth}px` }}
        className="flex h-full items-center justify-center border-r border-[#1C1C26] bg-[#0C0C12]"
      >
        <button
          id="btn-add-track-plus"
          type="button"
          onClick={onAddTrackClick}
          title="Add Track"
          aria-label="Add Track"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      <div
        onClick={onAddTrackClick}
        className="flex-1 h-full cursor-pointer flex items-center px-4 hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-xs text-neutral-500 font-medium">+ Add New Track...</span>
      </div>
    </div>
  );
};
