import React, { useState } from 'react';
import { ChevronLeft, Download, Mic, FilePlus, Minus, Plus } from 'lucide-react';
import { SourceOption, Project, TrackPalette } from '../types';

interface CreateProjectScreenProps {
  onBack: () => void;
  onCreateProject: (
    project: Project,
    sourceOption: SourceOption,
    importedFile?: File
  ) => void;
}

export const CreateProjectScreen: React.FC<CreateProjectScreenProps> = ({
  onBack,
  onCreateProject,
}) => {
  const [projectName, setProjectName] = useState('My Project');
  const [selectedSource, setSelectedSource] = useState<SourceOption>('BLANK_PROJECT');
  const [bpm, setBpm] = useState(120);
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [sampleRate, setSampleRate] = useState('44.1kHz');
  const [bitDepth, setBitDepth] = useState('24-bit');
  const [nameError, setNameError] = useState('');
  const [importedFile, setImportedFile] = useState<File | null>(null);

  const handleCreate = () => {
    if (!projectName.trim()) {
      setNameError('Project name cannot be empty');
      return;
    }

    const newProject: Project = {
      id: 'project_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      name: projectName.trim(),
      bpm,
      timeSignature,
      sampleRate,
      bitDepth,
      lastModified: Date.now(),
      tracks: [
        {
          id: 'track_1',
          name: 'Track 1',
          color: TrackPalette[0],
          isMuted: false,
          isSolo: false,
          clips: [],
        },
      ],
    };

    onCreateProject(newProject, selectedSource, importedFile || undefined);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImportedFile(file);
      setSelectedSource('IMPORT_AUDIO');
      if (projectName === 'My Project') {
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        setProjectName(cleanName);
      }
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#0A0A0E] text-white select-none overflow-y-auto">
      {/* Top Bar */}
      <header className="sticky top-0 z-10 flex h-14 w-full items-center gap-3 border-b border-[#181822] bg-[#0E0E14]/90 px-4 backdrop-blur-md">
        <button
          id="btn-create-back"
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10 active:scale-95 transition-all"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold text-white">New Project</h1>
      </header>

      {/* Main Form */}
      <main className="flex-1 max-w-xl mx-auto w-full px-4 sm:px-6 py-6 pb-24 space-y-6">
        {/* Project Name Input */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-2">
            Project Name
          </label>
          <input
            id="input-project-name"
            type="text"
            value={projectName}
            onChange={(e) => {
              setProjectName(e.target.value);
              if (nameError) setNameError('');
            }}
            placeholder="e.g. Neon Sunset"
            className={`w-full rounded-xl bg-[#12131A] border px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none transition-colors ${
              nameError ? 'border-rose-500 focus:border-rose-400' : 'border-[#242533] focus:border-white'
            }`}
          />
          {nameError && <p className="text-xs text-rose-400 mt-1.5">{nameError}</p>}
        </div>

        {/* Source Options */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-2">
            Starting Source
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Import Audio */}
            <label
              htmlFor="audio-file-input"
              className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center cursor-pointer transition-all ${
                selectedSource === 'IMPORT_AUDIO'
                  ? 'border-white bg-[#1C1E2A] text-white ring-1 ring-white'
                  : 'border-[#20212E] bg-[#12131A] text-neutral-400 hover:border-[#323348] hover:text-neutral-200'
              }`}
            >
              <input
                id="audio-file-input"
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Download className="h-6 w-6 mb-2 text-blue-400" />
              <span className="text-xs font-semibold">Import Audio</span>
              <span className="text-[10.5px] text-neutral-500 mt-1">
                {importedFile ? importedFile.name.substring(0, 16) + '...' : 'Load audio file'}
              </span>
            </label>

            {/* Record Manually */}
            <button
              type="button"
              id="btn-source-record"
              onClick={() => setSelectedSource('RECORD_MANUALLY')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                selectedSource === 'RECORD_MANUALLY'
                  ? 'border-white bg-[#1C1E2A] text-white ring-1 ring-white'
                  : 'border-[#20212E] bg-[#12131A] text-neutral-400 hover:border-[#323348] hover:text-neutral-200'
              }`}
            >
              <Mic className="h-6 w-6 mb-2 text-rose-400" />
              <span className="text-xs font-semibold">Record Manually</span>
              <span className="text-[10.5px] text-neutral-500 mt-1">Arm microphone</span>
            </button>

            {/* Blank Project */}
            <button
              type="button"
              id="btn-source-blank"
              onClick={() => setSelectedSource('BLANK_PROJECT')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                selectedSource === 'BLANK_PROJECT'
                  ? 'border-white bg-[#1C1E2A] text-white ring-1 ring-white'
                  : 'border-[#20212E] bg-[#12131A] text-neutral-400 hover:border-[#323348] hover:text-neutral-200'
              }`}
            >
              <FilePlus className="h-6 w-6 mb-2 text-emerald-400" />
              <span className="text-xs font-semibold">Blank Project</span>
              <span className="text-[10.5px] text-neutral-500 mt-1">Empty canvas</span>
            </button>
          </div>
        </div>

        {/* Tempo (BPM) Stepper */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-2">
            Tempo (BPM)
          </label>
          <div className="flex items-center justify-between rounded-xl bg-[#12131A] border border-[#20212E] p-2">
            <button
              type="button"
              id="btn-bpm-minus"
              onClick={() => setBpm((prev) => Math.max(40, prev - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-300 hover:bg-white/10 active:scale-95"
            >
              <Minus className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold font-mono tracking-tight text-white">{bpm}</span>
              <span className="text-[11px] font-medium text-neutral-500 uppercase">Beats Per Minute</span>
            </div>

            <button
              type="button"
              id="btn-bpm-plus"
              onClick={() => setBpm((prev) => Math.min(300, prev + 1))}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-300 hover:bg-white/10 active:scale-95"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Time Signature Dropdown */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-2">
            Time Signature
          </label>
          <div className="grid grid-cols-4 gap-2">
            {['4/4', '3/4', '6/8', '2/4'].map((sig) => (
              <button
                key={sig}
                type="button"
                id={`btn-timesig-${sig.replace('/', '-')}`}
                onClick={() => setTimeSignature(sig)}
                className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  timeSignature === sig
                    ? 'border-white bg-[#1C1E2A] text-white ring-1 ring-white'
                    : 'border-[#20212E] bg-[#12131A] text-neutral-400 hover:border-[#323348]'
                }`}
              >
                {sig}
              </button>
            ))}
          </div>
        </div>

        {/* Audio Quality (Sample Rate & Bit Depth) */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-2">
            Audio Quality
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-neutral-500 block mb-1">Sample Rate</span>
              <select
                id="select-sample-rate"
                value={sampleRate}
                onChange={(e) => setSampleRate(e.target.value)}
                className="w-full rounded-xl bg-[#12131A] border border-[#20212E] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-white transition-colors"
              >
                <option value="44.1kHz">44.1 kHz (CD Standard)</option>
                <option value="48kHz">48.0 kHz (Studio)</option>
                <option value="96kHz">96.0 kHz (Hi-Res)</option>
              </select>
            </div>

            <div>
              <span className="text-[11px] text-neutral-500 block mb-1">Bit Depth</span>
              <select
                id="select-bit-depth"
                value={bitDepth}
                onChange={(e) => setBitDepth(e.target.value)}
                className="w-full rounded-xl bg-[#12131A] border border-[#20212E] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-white transition-colors"
              >
                <option value="16-bit">16-bit</option>
                <option value="24-bit">24-bit (Studio)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Create CTA Button */}
        <div className="pt-4">
          <button
            id="btn-create-project-submit"
            type="button"
            onClick={handleCreate}
            className="w-full py-3.5 rounded-xl bg-white text-black font-bold text-sm hover:bg-neutral-200 active:scale-[0.99] transition-all shadow-xl"
          >
            Create Project
          </button>
        </div>
      </main>
    </div>
  );
};
