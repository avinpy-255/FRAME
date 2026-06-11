import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Users, 
  Trash2, 
  User, 
  Loader2,
  Calendar,
  Sparkles,
  Save,
  Tag
} from 'lucide-react';

import { useCharacterStore } from '../../store/characterStore';
import { useProjectStore } from '../../store/projectStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const ROLES = [
  { value: 'protagonist', label: 'Protagonist', style: 'bg-gold/10 border-gold/30 text-gold' },
  { value: 'antagonist', label: 'Antagonist', style: 'bg-red/10 border-red/30 text-red' },
  { value: 'supporting', label: 'Supporting', style: 'bg-scene-drama/10 border-scene-drama/30 text-scene-drama' },
  { value: 'minor', label: 'Minor Role', style: 'bg-surface border-border text-text-muted' }
];

const COLORS = ['#E8C547', '#C24B2A', '#6B7FD4', '#4BA86B', '#D4742A', '#7A6B8A', '#6B8A9E', '#F2F0EB'];

export default function Characters() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { loadProject } = useProjectStore();
  const { 
    characters, 
    fetchCharacters, 
    addCharacter, 
    updateCharacter, 
    deleteCharacter,
    isLoading 
  } = useCharacterStore();

  const [selectedCharId, setSelectedCharId] = useState(null);
  const [newTrait, setNewTrait] = useState('');

  // Selected character form states
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState('');
  const [role, setRole] = useState('supporting');
  const [bio, setBio] = useState('');
  const [arc, setArc] = useState('');
  const [color, setColor] = useState('#E8C547');
  const [traits, setTraits] = useState([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadProject(slug);
    fetchCharacters(slug);
  }, [slug]);

  const activeChar = characters.find(c => c.id === selectedCharId);

  // Sync form states when selection changes
  useEffect(() => {
    if (activeChar) {
      setName(activeChar.name || '');
      setDisplayName(activeChar.displayName || '');
      setAge(activeChar.age || '');
      setRole(activeChar.role || 'supporting');
      setBio(activeChar.bio || '');
      setArc(activeChar.arc || '');
      setColor(activeChar.color || '#E8C547');
      setTraits(activeChar.traits || []);
      setNotes(activeChar.notes || '');
    } else {
      setSelectedCharId(null);
    }
  }, [selectedCharId, characters]);

  const handleCreate = async () => {
    const newChar = await addCharacter(slug);
    setSelectedCharId(newChar.id);
  };

  const handleSave = async () => {
    if (!selectedCharId) return;
    
    // Standard screenplay format forces character names to be uppercase
    const uppercaseName = name.trim().toUpperCase();

    await updateCharacter(slug, selectedCharId, {
      name: uppercaseName || 'UNTITLED',
      displayName: displayName.trim() || 'Untitled Character',
      age: age.trim(),
      role,
      bio: bio.trim(),
      arc: arc.trim(),
      color,
      traits,
      notes: notes.trim()
    });
    
    alert('Character saved!');
  };

  const handleDelete = async (id, charName) => {
    if (window.confirm(`Are you sure you want to delete character "${charName}"?`)) {
      if (selectedCharId === id) setSelectedCharId(null);
      await deleteCharacter(slug, id);
    }
  };

  const handleAddTrait = (e) => {
    e.preventDefault();
    if (!newTrait.trim()) return;
    if (!traits.includes(newTrait.trim())) {
      setTraits([...traits, newTrait.trim()]);
    }
    setNewTrait('');
  };

  const handleRemoveTrait = (traitToRemove) => {
    setTraits(traits.filter(t => t !== traitToRemove));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-void flex flex-col items-center justify-center gap-3 text-text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
        <span className="text-sm font-mono">Loading character database...</span>
      </div>
    );
  }

  const roleStyle = (r) => ROLES.find(role => role.value === r)?.style || ROLES[3].style;
  const roleLabel = (r) => ROLES.find(role => role.value === r)?.label || 'Minor Role';

  return (
    <div className="h-screen flex flex-col md:flex-row text-text pt-12 pl-0 md:pl-[48px] bg-void overflow-hidden">
      
      {/* 1. Main Directory Listing */}
      <main className="flex-1 flex flex-col min-w-0 h-full p-4 md:p-6 relative">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div>
            <h1 className="font-display font-bold text-2xl text-text tracking-wide mb-1 flex items-center gap-2">
              <Users className="w-6 h-6 text-gold" />
              <span>Speaking Cast & Profiles</span>
            </h1>
            <p className="text-xs text-text-muted">
              Define speaking roles, character colors, biography backgrounds, and narrative arcs.
            </p>
          </div>

          <Button variant="primary" size="sm" onClick={handleCreate} className="flex items-center gap-1.5 font-semibold text-xs">
            <Plus className="w-4 h-4" />
            <span>Add Character</span>
          </Button>
        </div>

        {/* Profiles grid */}
        <div className="flex-1 overflow-y-auto min-h-0 select-none">
          {characters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
              {characters.map((char) => (
                <div
                  key={char.id}
                  onClick={() => setSelectedCharId(char.id)}
                  className={`
                    bg-surface border p-4.5 rounded-lg cursor-pointer transition-all duration-200 flex flex-col justify-between min-h-[140px] relative
                    hover:border-gold/30 hover:shadow-card
                    ${selectedCharId === char.id ? 'border-gold bg-surface-raised shadow-glow-gold' : 'border-border'}
                  `}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3">
                      {/* Colored Initial Avatar */}
                      <div 
                        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-void text-sm uppercase shrink-0"
                        style={{ backgroundColor: char.color || '#E8C547' }}
                      >
                        {char.name ? char.name.charAt(0) : '?'}
                      </div>
                      <div className="truncate">
                        <h3 className="font-display font-bold text-sm text-text truncate uppercase">{char.name}</h3>
                        <span className="text-[10px] text-text-muted font-sans font-light capitalize">{char.displayName || 'Unnamed'}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(char.id, char.name);
                      }}
                      className="text-text-muted hover:text-red p-1 rounded"
                      title="Delete profile"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase ${roleStyle(char.role)}`}>
                      {roleLabel(char.role)}
                    </span>
                    {char.age && (
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-text-muted">
                        Age: {char.age}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 border border-dashed border-border rounded-xl">
              <span className="text-text-muted mb-3 text-xs italic">No character profiles registered yet.</span>
              <Button variant="secondary" size="sm" onClick={handleCreate}>Create cast profile</Button>
            </div>
          )}
        </div>
      </main>

      {/* 2. Side Panel details Editor */}
      {selectedCharId && activeChar && (
        <aside className="fixed md:relative inset-y-12 md:inset-y-0 right-0 z-30 w-full md:w-[360px] border-l border-border bg-surface flex flex-col h-[calc(100vh-48px)] md:h-full shrink-0 overflow-y-auto p-5 relative select-text shadow-lg md:shadow-none">
          <div className="flex justify-between items-center border-b border-border pb-3 mb-4 shrink-0">
            <span className="text-xs font-mono text-gold font-semibold uppercase">Profile Editor</span>
            <Button variant="ghost" size="sm" onClick={() => setSelectedCharId(null)}>Close</Button>
          </div>

          <div className="flex flex-col gap-4 flex-1 pb-16">
            
            {/* Name input */}
            <Input
              label="Screenplay ID Name (UPPERCASE)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. DETECTIVE MARS"
            />
            
            <Input
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Detective Mars"
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Age Bracket"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 35-40"
              />
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-text-muted tracking-wide uppercase">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-surface border border-border rounded-md px-3 py-1.5 text-text text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                >
                  <option value="protagonist">Protagonist</option>
                  <option value="antagonist">Antagonist</option>
                  <option value="supporting">Supporting</option>
                  <option value="minor">Minor Role</option>
                </select>
              </div>
            </div>

            {/* Highlight color presets */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-text-muted tracking-wide uppercase">Script Highlight Color</label>
              <div className="flex gap-2 flex-wrap items-center">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    type="button"
                    className={`w-6 h-6 rounded-full border border-border/80 transition-transform ${color === c ? 'scale-115 ring-2 ring-gold border-white' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Traits tag editor */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-text-muted tracking-wide uppercase flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                <span>Traits Tags</span>
              </label>
              
              <form onSubmit={handleAddTrait} className="flex gap-2 mb-1.5">
                <input
                  type="text"
                  placeholder="e.g. Skeptical"
                  value={newTrait}
                  onChange={(e) => setNewTrait(e.target.value)}
                  className="bg-surface border border-border rounded px-2.5 py-1 text-xs text-text focus:border-gold outline-none w-full"
                />
                <Button type="submit" variant="secondary" size="sm" className="px-3">Add</Button>
              </form>

              <div className="flex flex-wrap gap-1.5">
                {traits.map((t, i) => (
                  <span 
                    key={i}
                    onClick={() => handleRemoveTrait(t)}
                    className="text-[10px] font-mono px-2 py-0.5 bg-surface-raised border border-border rounded-full hover:bg-red/10 hover:text-red hover:border-red/30 cursor-pointer"
                  >
                    {t} ×
                  </span>
                ))}
              </div>
            </div>

            {/* Biography */}
            <Input
              label="Biography / World Background"
              textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Write character background summary..."
            />

            {/* Character Arc */}
            <Input
              label="Character Transformation Arc"
              textarea
              rows={3}
              value={arc}
              onChange={(e) => setArc(e.target.value)}
              placeholder="Describe how they change over the story..."
            />

            {/* General notes */}
            <Input
              label="Miscellaneous Notes"
              textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Actor preference, styling details..."
            />

          </div>

          {/* Save Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-surface shrink-0 flex justify-end">
            <Button variant="primary" size="sm" onClick={handleSave} className="flex items-center gap-1.5 px-6 font-semibold">
              <Save className="w-4 h-4" />
              <span>Save Profile</span>
            </Button>
          </div>
        </aside>
      )}

    </div>
  );
}
