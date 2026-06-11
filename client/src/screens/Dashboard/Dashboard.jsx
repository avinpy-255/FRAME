import React, { useEffect, useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import ProjectCard from './ProjectCard';
import NewProjectWizard from './NewProjectWizard';
import Button from '../../components/ui/Button';
import { Plus, Search, Loader2, Sparkles } from 'lucide-react';

export default function Dashboard() {
  const { projects, fetchProjects, deleteProject, isLoading, error } = useProjectStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDelete = async (slug, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This action is permanent.`)) {
      try {
        await deleteProject(slug);
      } catch (err) {
        alert('Failed to delete project: ' + err.message);
      }
    }
  };

  const handleLoadSample = async () => {
    setLoadingSample(true);
    try {
      const res = await fetch('/api/settings/sample', { method: 'POST' });
      if (res.ok) {
        await fetchProjects();
      } else {
        const data = await res.json();
        alert('Failed to load sample project: ' + data.error);
      }
    } catch (err) {
      alert('Failed to connect to server: ' + err.message);
    } finally {
      setLoadingSample(false);
    }
  };

  // Filter projects by search query
  const filteredProjects = projects.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(query) ||
      p.logline?.toLowerCase().includes(query) ||
      p.genre?.some((g) => g.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-void pt-16 px-4 md:pl-[72px] md:pr-8 pb-12 overflow-y-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-text tracking-wide mb-1.5">
            Your Creative Studio
          </h1>
          <p className="text-sm text-text-muted">
            Select a project to start writing, planning, or editing.
          </p>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-faint" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 bg-surface border border-border rounded-md pl-9 pr-4 py-2 text-sm text-text placeholder-text-faint focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors"
            />
          </div>
          <Button
            variant="primary"
            onClick={() => setIsWizardOpen(true)}
            className="flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red/10 border border-red/20 rounded-md text-red text-sm mb-6">
          Failed to load projects: {error}
        </div>
      )}

      {/* Main Grid content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-text-muted">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
          <span className="text-sm font-mono">Loading local workspace...</span>
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.slug}
              project={project}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 border border-dashed border-border rounded-xl max-w-xl mx-auto text-center bg-surface shadow-card">
          <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center text-gold mb-4 mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-display font-semibold text-lg text-text mb-2">Welcome to FRAME</h3>
          <p className="text-xs text-text-muted mb-6 max-w-sm">
            FRAME is a local-first creative writing studio. Start by creating a blank project, or load the pre-populated sample script to explore the corkboard, screenplay editing, and visual HTML Lookbook features.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center w-full sm:w-auto">
            <button
              onClick={handleLoadSample}
              disabled={loadingSample}
              className="px-5 py-2.5 bg-gold hover:bg-gold-dim text-void text-xs font-semibold rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loadingSample ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>Load Sample Project</span>
            </button>
            <button
              onClick={() => setIsWizardOpen(true)}
              disabled={loadingSample}
              className="px-5 py-2.5 bg-surface-raised border border-border hover:border-gold/30 text-xs font-semibold rounded-lg transition-all active:scale-[0.98]"
            >
              Create Blank Project
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-xl">
          <span className="text-text-muted mb-4 text-xs">
            No matching projects found for "{searchQuery}".
          </span>
          <Button variant="secondary" onClick={() => setSearchQuery('')}>
            Clear Search Filter
          </Button>
        </div>
      )}

      {/* Multi-step Project Wizard Modal */}
      <NewProjectWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
      />
    </div>
  );
}
