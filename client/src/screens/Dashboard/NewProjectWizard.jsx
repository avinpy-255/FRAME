import React, { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useProjectStore } from '../../store/projectStore';
import { useNavigate } from 'react-router-dom';

const GENRES = ['Drama', 'Thriller', 'Comedy', 'Sci-Fi', 'Horror', 'Action', 'Romance', 'Fantasy'];
const FORMATS = [
  { value: 'short-film', label: 'Short Film' },
  { value: 'feature', label: 'Feature Film' },
  { value: 'series', label: 'Series Episode' },
  { value: 'documentary', label: 'Documentary' },
];
const COLOR_PRESETS = ['#E8C547', '#C24B2A', '#6B7FD4', '#4BA86B', '#D4742A', '#7A6B8A', '#6B8A9E'];

export default function NewProjectWizard({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { createProject } = useProjectStore();
  const [step, setStep] = useState(1);

  // Form states
  const [title, setTitle] = useState('');
  const [format, setFormat] = useState('short-film');
  const [logline, setLogline] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [actStructure, setActStructure] = useState('three-act');
  const [color, setColor] = useState('#E8C547');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setTitle('');
    setFormat('short-film');
    setLogline('');
    setSelectedGenres([]);
    setActStructure('three-act');
    setColor('#E8C547');
    setStep(1);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleGenre = (genre) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleNext = () => {
    if (step === 1 && !title.trim()) {
      setError('Title is required');
      return;
    }
    setError('');
    setStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const project = await createProject({
        title,
        format,
        logline,
        genre: selectedGenres,
        actStructure,
        color
      });
      handleClose();
      navigate(`/project/${project.slug}/story`);
    } catch (err) {
      setError(err.message || 'Failed to create project');
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Project Wizard">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {error && (
          <div className="p-3 bg-red/10 border border-red/20 rounded-md text-red text-sm font-medium">
            {error}
          </div>
        )}

        {/* STEP 1: Title & Format */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <Input
              label="Project Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. My Short Film"
              autoFocus
              required
            />
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-text-muted tracking-wide uppercase">Format</span>
              <div className="grid grid-cols-2 gap-3">
                {FORMATS.map((f) => (
                  <div
                    key={f.value}
                    onClick={() => setFormat(f.value)}
                    className={`
                      border rounded-lg p-3 text-center cursor-pointer transition-all duration-200 select-none
                      ${format === f.value 
                        ? 'border-gold bg-gold/10 text-gold shadow-glow-gold' 
                        : 'border-border hover:border-text-muted text-text-muted'}
                    `}
                  >
                    <span className="text-sm font-medium">{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Logline & Genre */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <Input
              label="Logline / One-sentence pitch"
              textarea
              rows={2}
              value={logline}
              onChange={(e) => setLogline(e.target.value)}
              placeholder="e.g. A down-on-his-luck detective discovers a phone that predicts crime..."
            />
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-text-muted tracking-wide uppercase">Genre Tags</span>
              <div className="flex flex-wrap gap-2">
                {GENRES.map((g) => {
                  const isSelected = selectedGenres.includes(g);
                  return (
                    <button
                      type="button"
                      key={g}
                      onClick={() => toggleGenre(g)}
                      className={`
                        px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border
                        ${isSelected 
                          ? 'bg-gold/15 border-gold text-gold shadow-glow-gold' 
                          : 'bg-surface border-border text-text-muted hover:border-text-muted hover:text-text'}
                      `}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Act Structure & Visual Accent */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-text-muted tracking-wide uppercase">Act Structure</span>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-text-muted hover:text-text cursor-pointer">
                  <input
                    type="radio"
                    name="actStructure"
                    value="three-act"
                    checked={actStructure === 'three-act'}
                    onChange={() => setActStructure('three-act')}
                    className="accent-gold"
                  />
                  <span>Three-Act Structure</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-text-muted hover:text-text cursor-pointer">
                  <input
                    type="radio"
                    name="actStructure"
                    value="five-act"
                    checked={actStructure === 'five-act'}
                    onChange={() => setActStructure('five-act')}
                    className="accent-gold"
                  />
                  <span>Five-Act Structure</span>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-text-muted tracking-wide uppercase">Accent Color</span>
              <div className="flex gap-3 items-center">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`
                      w-8 h-8 rounded-full border-2 transition-all duration-200 active:scale-95
                      ${color === c ? 'border-text scale-110 shadow-lg' : 'border-transparent'}
                    `}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between items-center border-t border-border pt-4 mt-2">
          {step > 1 ? (
            <Button variant="ghost" onClick={handlePrev}>
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button variant="primary" onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
