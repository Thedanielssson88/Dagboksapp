import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getOrCreateDayForDate, addEntry } from '../services/db';
import { Mic, Calendar, ChevronRight, Search, X, PenLine } from 'lucide-react';
import { clsx } from 'clsx';
import type { Day } from '../types';
import type { Entry } from '../types';

export const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState((location.state as { search?: string } | null)?.search || '');
  const [isWriting, setIsWriting] = useState(false);
  const [textInput, setTextInput] = useState('');

  useEffect(() => {
    const s = (location.state as { search?: string } | null)?.search;
    if (s != null) setSearchQuery(s);
  }, [location.pathname, location.state]);

  const days = useLiveQuery(() => db.days.orderBy('date').reverse().toArray());
  const entries = useLiveQuery(() => db.entries.toArray());
  const people = useLiveQuery(() => db.people.toArray());
  const tags = useLiveQuery(() => db.tags.toArray());

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const extractSnippet = (text: string, query: string) => {
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text.substring(0, 80) + '...';

    const start = Math.max(0, index - 30);
    const end = Math.min(text.length, index + query.length + 30);
    return (start > 0 ? '...' : '') + text.substring(start, end) + (end < text.length ? '...' : '');
  };

  const getPreviewAndMatch = (day: Day): { isMatch: boolean; preview: string } => {
    if (!searchQuery.trim()) {
      return {
        isMatch: true,
        preview: day.summary ? day.summary.substring(0, 80) + (day.summary.length > 80 ? '...' : '') : 'Inspelningar finns, ej sammanfattad.'
      };
    }

    const q = searchQuery.toLowerCase().trim();

    if (day.summary?.toLowerCase().includes(q)) {
      return { isMatch: true, preview: extractSnippet(day.summary, q) };
    }

    if (day.learnings?.some((l: string) => l.toLowerCase().includes(q))) {
      const match = day.learnings.find((l: string) => l.toLowerCase().includes(q));
      return { isMatch: true, preview: `Lärdom: ${extractSnippet(match ?? '', q)}` };
    }

    const dayEntries = (entries as Entry[] | undefined)?.filter(e => e.dayId === day.id) ?? [];
    for (const entry of dayEntries) {
      if (entry.transcription?.toLowerCase().includes(q)) {
        return { isMatch: true, preview: `🎤 "${extractSnippet(entry.transcription, q)}"` };
      }
    }

    const linkedTags = tags?.filter(t => day.tagIds?.includes(t.id)) ?? [];
    if (linkedTags.some(t => t.name.toLowerCase().includes(q))) {
      return { isMatch: true, preview: `🏷️ Taggad med: ${linkedTags.find(t => t.name.toLowerCase().includes(q))?.name}` };
    }

    const linkedPeople = people?.filter(p => day.personIds?.includes(p.id)) ?? [];
    if (linkedPeople.some(p => p.name.toLowerCase().includes(q))) {
      return { isMatch: true, preview: `👤 Nämnde: ${linkedPeople.find(p => p.name.toLowerCase().includes(q))?.name}` };
    }

    return { isMatch: false, preview: '' };
  };

  const filteredDays = days?.map(day => ({
    ...day,
    searchData: getPreviewAndMatch(day)
  })).filter(day => day.searchData.isMatch);

  const isDataLoading = days === undefined || entries === undefined;

  const handleSaveTextEntry = async () => {
    if (!textInput.trim()) {
      setIsWriting(false);
      return;
    }
    const todayString = new Date().toISOString().split('T')[0];
    const day = await getOrCreateDayForDate(todayString);
    await addEntry({
      dayId: day.id,
      createdAt: new Date().toISOString(),
      isTranscribed: true,
      transcription: textInput.trim()
    });
    setTextInput('');
    setIsWriting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* HEADER & SÖKFÄLT */}
      <div className="bg-white p-6 pt-12 pb-4 shadow-sm sticky top-0 z-20">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Min Dagbok</h1>

        <div className="mt-4 relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="text-gray-400" size={18} />
          </div>
          <input
            type="text"
            placeholder="Sök i dagboken (badhus, Alicia...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 text-gray-800 placeholder-gray-500 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* DAGAR-LISTAN */}
      <div className="p-4 space-y-3">
        {isDataLoading ? (
          <div className="text-center text-gray-400 mt-10 animate-pulse">Laddar dagbok...</div>
        ) : filteredDays?.length === 0 ? (
          <div className="text-center mt-20">
            <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="text-blue-400" size={32} />
            </div>
            {searchQuery ? (
              <p className="text-gray-500 font-medium">Hittade inget som matchade &quot;{searchQuery}&quot;.</p>
            ) : (
              <>
                <p className="text-gray-500 font-medium">Din dagbok är tom.</p>
                <p className="text-sm text-gray-400 mt-2">Skapa ditt första inlägg nedan!</p>
              </>
            )}
          </div>
        ) : (
          filteredDays?.map(day => (
            <button
              key={day.id}
              onClick={() => navigate(`/day/${day.id}`)}
              className="w-full bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-start hover:shadow-md transition-all active:scale-[0.98] text-left"
            >
              <div className="w-full flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center text-xl", day.mood ? "bg-indigo-50" : "bg-gray-50")}>
                    {day.mood || '📝'}
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg capitalize">{formatDate(day.date)}</h3>
                </div>
                <ChevronRight className="text-gray-300" size={20} />
              </div>

              <p className="text-sm text-gray-500 font-medium leading-relaxed w-full pl-0">
                {day.searchData.preview}
              </p>
            </button>
          ))
        )}
      </div>

      {/* TEXT-INMATNINGS-MODAL */}
      {isWriting && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">Skriv ett inlägg</h3>
              <button onClick={() => setIsWriting(false)} className="text-gray-400 p-1"><X size={20} /></button>
            </div>
            <textarea
              autoFocus
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="Vad tänker du på?"
              className="w-full h-32 bg-gray-50 rounded-xl p-3 text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 border border-gray-100"
            />
            <div className="mt-4 flex gap-2">
              <button onClick={() => setIsWriting(false)} className="flex-1 py-3 font-bold text-gray-500 bg-gray-100 rounded-xl">Avbryt</button>
              <button onClick={handleSaveTextEntry} className="flex-1 py-3 font-bold text-white bg-indigo-600 rounded-xl">Spara inlägg</button>
            </div>
          </div>
        </div>
      )}

      {/* FLYTANDE KNAPPAR (Text ovanför Mic) */}
      <div className="fixed bottom-24 right-6 flex flex-col gap-3 z-40 items-center">
        <button
          onClick={() => setIsWriting(true)}
          className="w-12 h-12 bg-indigo-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-600 active:scale-90 transition-transform"
        >
          <PenLine size={20} fill="currentColor" />
        </button>
        <button
          onClick={() => navigate('/record')}
          className="w-16 h-16 bg-red-500 text-white rounded-full shadow-xl shadow-red-500/30 flex items-center justify-center hover:bg-red-600 active:scale-90 transition-transform"
        >
          <Mic size={28} fill="currentColor" />
        </button>
      </div>
    </div>
  );
};
