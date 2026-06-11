const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const fileService = require('../services/fileService');

// Read settings
router.get('/', (req, res) => {
  try {
    const config = fileService.getConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read settings: ' + err.message });
  }
});

// Update settings
router.put('/', (req, res) => {
  try {
    const updated = fileService.updateConfig(req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings: ' + err.message });
  }
});

// Create sample project for onboarding
router.post('/sample', async (req, res) => {
  try {
    const root = fileService.getProjectsRoot();
    const slug = 'the-midnight-frame';
    const projectDir = path.join(root, slug);
    
    // If it already exists, delete it first to ensure fresh reload
    if (fs.existsSync(projectDir)) {
      await fs.promises.rm(projectDir, { recursive: true, force: true });
    }
    
    // Create folders
    await fs.promises.mkdir(projectDir, { recursive: true });
    await fs.promises.mkdir(path.join(projectDir, 'assets'), { recursive: true });
    await fs.promises.mkdir(path.join(projectDir, 'exports'), { recursive: true });
    await fs.promises.mkdir(path.join(projectDir, 'snapshots'), { recursive: true });
    
    const now = new Date().toISOString();
    const projectId = require('crypto').randomUUID();
    
    // 1. meta.json
    const meta = {
      id: projectId,
      slug,
      title: 'The Midnight Frame',
      logline: 'A locked-room visual mystery where a veteran film editor gets trapped inside their own screenplay.',
      synopsis: 'While piecing together a noir thriller late at night, editor Chen spots a silhouette on screen that mirrors their own physical room. Soon, the editing bay locks from the outside, forcing Chen to solve a cinematic puzzle in real time.',
      genre: ['Mystery', 'Thriller'],
      format: 'short-film',
      status: 'writing',
      actStructure: 'three-act',
      color: '#C24B2A',
      coverImage: '',
      createdAt: now,
      updatedAt: now,
      wordCount: 154,
      sceneCount: 3,
      estimatedRuntime: 3,
      tags: ['noir', 'meta']
    };
    
    // 2. story.md
    const story = `# The Midnight Frame
    
An atmospheric, metacinematic noir thriller.

## Act 1: The Cut
We open on CHEN, working late inside a smoke-filled cutting bay. On the screen, a film reel plays in black-and-white. Chen notices a strange shadow in the background of the take.

## Act 2: The Splice
Chen pauses the tape. The shadow in the film seems to match the silhouette of their own editing room door. As Chen stands up, a heavy metallic bolt clicks shut outside the real cutting room door.

## Act 3: The Projection
Chen rewinds the footage. By manipulating the playback deck, the physical room responds. Chen must splice the film reel together to unlock the exit before the silhouette on screen reaches them.
`;

    // 3. scenes.json
    const scenes = {
      version: '1.0',
      acts: [
        { id: 'act-1', label: 'Act 1 (Setup)', color: '#E8C547', order: 1 },
        { id: 'act-2', label: 'Act 2 (Confrontation)', color: '#6B7FD4', order: 2 },
        { id: 'act-3', label: 'Act 3 (Resolution)', color: '#C24B2A', order: 3 }
      ],
      scenes: [
        {
          id: 'scene-1',
          title: 'The Ghost in the Reel',
          synopsis: 'Chen pieces together the climax of a feature film and notices a shadow crossing the back door on the monitor.',
          location: 'INT',
          locationName: 'CUTTING ROOM',
          timeOfDay: 'NIGHT',
          characters: ['CHEN'],
          tone: 'mystery',
          act: 'act-1',
          order: 1,
          color: '#E8C547',
          sketchPath: '',
          referencePath: '',
          notes: 'Keep lighting low key. Focus on eyes.',
          screenplayRef: 'heading-1',
          beatTag: 'inciting-incident',
          conflictLevel: 2,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'scene-2',
          title: 'Bolted Shut',
          synopsis: 'When Chen goes to check the hallway, the editing room door snaps locked from the outside. The projector flickers.',
          location: 'INT',
          locationName: 'CUTTING ROOM',
          timeOfDay: 'CONTINUOUS',
          characters: ['CHEN'],
          tone: 'tension',
          act: 'act-2',
          order: 2,
          color: '#6B7FD4',
          sketchPath: '',
          referencePath: '',
          notes: 'High angle shot highlighting isolation.',
          screenplayRef: 'heading-2',
          beatTag: 'midpoint',
          conflictLevel: 4,
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'scene-3',
          title: 'Splice to Escape',
          synopsis: 'Chen realizes that scrubbing the film spool controls physical locking mechanisms in the real room.',
          location: 'INT',
          locationName: 'CUTTING ROOM',
          timeOfDay: 'NIGHT',
          characters: ['CHEN'],
          tone: 'action',
          act: 'act-3',
          order: 3,
          color: '#C24B2A',
          sketchPath: '',
          referencePath: '',
          notes: 'Fast cutting pace during the splice sequence.',
          screenplayRef: 'heading-3',
          beatTag: 'climax',
          conflictLevel: 5,
          createdAt: now,
          updatedAt: now
        }
      ]
    };

    // 4. screenplay.json
    const screenplay = {
      version: '1.0',
      title: 'The Midnight Frame',
      author: 'FRAME Writer',
      contact: 'hello@frame.writer',
      draftNumber: 1,
      elements: [
        { id: 'titlepage-1', type: 'titlepage', content: 'THE MIDNIGHT FRAME', order: 0, locked: false, revisionMark: 'none' },
        { id: 'heading-1', sceneId: 'scene-1', type: 'scene-heading', content: 'INT. CUTTING ROOM - NIGHT', order: 1, locked: false, revisionMark: 'none' },
        { id: 'action-1', type: 'action', content: 'CHEN (40s) hunches over a flatbed editor. Reels of 35mm film line the walls like metal dust cans.', order: 2, locked: false, revisionMark: 'none' },
        { id: 'char-1', type: 'character', content: 'CHEN', order: 3, locked: false, revisionMark: 'none' },
        { id: 'dialogue-1', type: 'dialogue', content: 'Wait. Go back.', order: 4, locked: false, revisionMark: 'none' },
        { id: 'heading-2', sceneId: 'scene-2', type: 'scene-heading', content: 'INT. CUTTING ROOM - CONTINUOUS', order: 5, locked: false, revisionMark: 'none' },
        { id: 'action-2', type: 'action', content: 'Chen grabs the door handle. It does not budge. A heavy metallic CLANG echoes from the hallway.', order: 6, locked: false, revisionMark: 'none' },
        { id: 'heading-3', sceneId: 'scene-3', type: 'scene-heading', content: 'INT. CUTTING ROOM - NIGHT', order: 7, locked: false, revisionMark: 'none' },
        { id: 'action-3', type: 'action', content: 'Chen slams a razor blade into the splicer deck. The film tape joins together.', order: 8, locked: false, revisionMark: 'none' }
      ],
      revisionHistory: [{ draftNumber: 1, date: now, changes: 0 }]
    };

    // 5. characters.json
    const characters = {
      characters: [
        {
          id: 'char-chen',
          name: 'CHEN',
          displayName: 'Chen',
          age: '40',
          role: 'protagonist',
          bio: 'A reclusive film editor with bloodshot eyes and coffee-stained fingertips. Trust in the edit, not in people.',
          arc: 'Chen goes from observing life behind screens to being forced into action to preserve it.',
          color: '#C24B2A',
          imagePath: '',
          firstScene: 'scene-1',
          traits: ['Focused', 'Obsessive', 'Wary'],
          notes: 'Always wears a gray wool cardigan.'
        }
      ]
    };

    // 6. research.json
    const research = {
      items: [
        {
          id: 'res-note-1',
          type: 'note',
          title: 'Color Moodboard',
          content: 'Deep velvet void, cold editing monitor glow (#6B8A9E), and warm amber safety lamps.',
          filePath: null,
          tags: ['mood'],
          linkedScenes: ['scene-1'],
          createdAt: now
        },
        {
          id: 'res-swatch-1',
          type: 'color-swatch',
          title: 'Film Safety Accent',
          content: '#E8C547',
          filePath: null,
          tags: ['color'],
          linkedScenes: ['scene-3'],
          createdAt: now
        }
      ],
      boards: [
        {
          id: 'board-look',
          name: 'Atmosphere & Mood',
          color: '#C24B2A',
          itemIds: ['res-note-1', 'res-swatch-1']
        }
      ]
    };

    // Write all files to disk
    const pathResolve = (file) => path.join(projectDir, file);
    await fs.promises.writeFile(pathResolve('meta.json'), JSON.stringify(meta, null, 2), 'utf8');
    await fs.promises.writeFile(pathResolve('story.md'), story, 'utf8');
    await fs.promises.writeFile(pathResolve('scenes.json'), JSON.stringify(scenes, null, 2), 'utf8');
    await fs.promises.writeFile(pathResolve('screenplay.json'), JSON.stringify(screenplay, null, 2), 'utf8');
    await fs.promises.writeFile(pathResolve('characters.json'), JSON.stringify(characters, null, 2), 'utf8');
    await fs.promises.writeFile(pathResolve('research.json'), JSON.stringify(research, null, 2), 'utf8');
    
    // Add to recents
    const config = fileService.getConfig();
    let recents = config.recentProjects || [];
    recents = [slug, ...recents.filter(s => s !== slug)].slice(0, 5);
    fileService.updateConfig({ recentProjects: recents });
    
    res.json({ success: true, slug, project: meta });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create sample project: ' + err.message });
  }
});

module.exports = router;
