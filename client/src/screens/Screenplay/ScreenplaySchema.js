import { Schema } from 'prosemirror-model';

// Custom screenplay schema nodes map
// We style elements exactly to simulate standard letter screenplay margins
export const screenplaySchema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    
    paragraph: {
      content: 'inline*',
      group: 'block',
      parseDOM: [{ tag: 'p' }],
      toDOM() { return ['p', 0]; }
    },

    scene_heading: {
      content: 'inline*',
      group: 'block',
      attrs: { sceneId: { default: null } },
      parseDOM: [{ 
        tag: 'div.scene-heading', 
        getAttrs: dom => ({ sceneId: dom.getAttribute('data-scene-id') }) 
      }],
      toDOM(node) { 
        return ['div', { 
          class: 'scene-heading font-mono font-bold uppercase tracking-wider text-left text-text pt-6 pb-2', 
          'data-scene-id': node.attrs.sceneId 
        }, 0]; 
      }
    },

    action: {
      content: 'inline*',
      group: 'block',
      parseDOM: [{ tag: 'div.action' }],
      toDOM() { 
        return ['div', { 
          class: 'action font-mono text-left text-text-muted leading-relaxed py-2 w-full max-w-[650px]' 
        }, 0]; 
      }
    },

    character: {
      content: 'inline*',
      group: 'block',
      parseDOM: [{ tag: 'div.character' }],
      toDOM() { 
        return ['div', { 
          class: 'character font-mono font-bold uppercase text-left pt-4 pb-0.5 md:pl-[240px] text-gold tracking-widest' 
        }, 0]; 
      }
    },

    dialogue: {
      content: 'inline*',
      group: 'block',
      parseDOM: [{ tag: 'div.dialogue' }],
      toDOM() { 
        return ['div', { 
          class: 'dialogue font-mono text-left leading-normal text-text pb-2.5 max-w-[500px] md:pl-[140px]' 
        }, 0]; 
      }
    },

    parenthetical: {
      content: 'inline*',
      group: 'block',
      parseDOM: [{ tag: 'div.parenthetical' }],
      toDOM() { 
        return ['div', { 
          class: 'parenthetical font-mono text-left italic text-text-muted py-0.5 max-w-[420px] md:pl-[180px]' 
        }, 0]; 
      }
    },

    transition: {
      content: 'inline*',
      group: 'block',
      parseDOM: [{ tag: 'div.transition' }],
      toDOM() { 
        return ['div', { 
          class: 'transition font-mono font-bold uppercase text-right py-4 pr-12 text-gold-dim' 
        }, 0]; 
      }
    },

    shot: {
      content: 'inline*',
      group: 'block',
      parseDOM: [{ tag: 'div.shot' }],
      toDOM() { 
        return ['div', { 
          class: 'shot font-mono font-bold uppercase py-2 text-left text-text-muted tracking-wide' 
        }, 0]; 
      }
    },

    note: {
      content: 'inline*',
      group: 'block',
      parseDOM: [{ tag: 'div.note' }],
      toDOM() { 
        return ['div', { 
          class: 'note font-mono italic text-xs bg-surface-raised border-l-2 border-red/40 text-red px-4 py-2 my-3 max-w-[650px]' 
        }, 0]; 
      }
    },

    text: { group: 'inline' }
  }
});
