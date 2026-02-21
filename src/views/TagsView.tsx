import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { Tag as TagIcon, Users, Trash2, Plus } from 'lucide-react';

export const TagsView = () => {
  const navigate = useNavigate();
  const people = useLiveQuery(() => db.people.toArray());
  const tags = useLiveQuery(() => db.tags.toArray());

  const [newTagInput, setNewTagInput] = useState('');

  const handleSearch = (query: string) => {
    // Navigera till dagboken och skicka med sökordet!
    navigate('/', { state: { search: query } });
  };

  const handleDeletePerson = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Radera denna person från hela systemet?")) await db.people.delete(id);
  };

  const handleDeleteTag = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Radera denna tagg från hela systemet?")) await db.tags.delete(id);
  };

  const handleCreateNewTag = async (type: 'person' | 'tag') => {
    if (!newTagInput.trim()) return;
    const name = newTagInput.trim();
    if (type === 'person') {
      await db.people.add({ 
        id: crypto.randomUUID(), 
        name, 
        email: '', 
        role: 'Vän/Familj',
        projectIds: []
      });
    } else {
      await db.tags.add({ 
        id: crypto.randomUUID(), 
        name, 
        projectId: 'dagbok' 
      });
    }
    setNewTagInput('');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-white p-6 pt-12 pb-6 shadow-sm sticky top-0 z-10">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Taggar & Personer</h1>
        <p className="text-gray-500 font-medium mt-1">Klicka för att se inlägg</p>
      </div>

      <div className="p-6 space-y-8">
        
        {/* SKAPA NY (Lägg till) */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-3">
            <Plus size={16} /> Lägg till ny
          </h2>
          <input 
            type="text" 
            value={newTagInput} 
            onChange={e => setNewTagInput(e.target.value)} 
            placeholder="Skriv namn eller ämne..." 
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-3"
          />
          <div className="flex gap-2">
            <button 
              onClick={() => handleCreateNewTag('person')} 
              disabled={!newTagInput.trim()} 
              className="flex-1 bg-pink-100 text-pink-700 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-pink-200 transition-colors"
            >
              Skapa Person
            </button>
            <button 
              onClick={() => handleCreateNewTag('tag')} 
              disabled={!newTagInput.trim()} 
              className="flex-1 bg-blue-100 text-blue-700 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-blue-200 transition-colors"
            >
              Skapa Tagg
            </button>
          </div>
        </div>

        {/* PERSONER */}
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
            <Users size={16} /> Nämnda Personer
          </h2>
          <div className="flex flex-wrap gap-3">
            {people?.length === 0 && <p className="text-sm text-gray-400">Inga personer har skapats ännu.</p>}
            {people?.map(p => (
              <button 
                key={p.id} 
                onClick={() => handleSearch(p.name)}
                className="bg-pink-100 text-pink-700 pl-4 pr-2 py-2 rounded-xl text-sm font-bold border border-pink-200 hover:bg-pink-200 active:scale-95 transition-all shadow-sm flex items-center gap-2"
              >
                👤 {p.name}
                <div onClick={(e) => handleDeletePerson(e, p.id)} className="p-1.5 hover:bg-pink-300 rounded-md text-pink-500 transition-colors">
                  <Trash2 size={14}/>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ÄMNEN/PLATSER */}
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
            <TagIcon size={16} /> Ämnen & Platser
          </h2>
          <div className="flex flex-wrap gap-3">
            {tags?.length === 0 && <p className="text-sm text-gray-400">Inga taggar har skapats ännu.</p>}
            {tags?.map(t => (
              <button 
                key={t.id} 
                onClick={() => handleSearch(t.name)}
                className="bg-blue-100 text-blue-700 pl-4 pr-2 py-2 rounded-xl text-sm font-bold border border-blue-200 hover:bg-blue-200 active:scale-95 transition-all shadow-sm flex items-center gap-2"
              >
                🏷️ {t.name}
                <div onClick={(e) => handleDeleteTag(e, t.id)} className="p-1.5 hover:bg-blue-300 rounded-md text-blue-500 transition-colors">
                  <Trash2 size={14}/>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
