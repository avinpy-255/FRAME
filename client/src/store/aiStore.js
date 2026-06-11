import { create } from 'zustand';

export const useAiStore = create((set, get) => ({
  status: { available: false, models: [] },
  messages: [],
  activeModel: 'llama3.2',
  isOnline: false,
  isLoading: false,
  streamingText: '',

  checkStatus: async () => {
    try {
      const res = await fetch('/api/ai/status');
      if (res.ok) {
        const data = await res.json();
        set({ 
          status: data, 
          isOnline: data.available,
          activeModel: data.models && data.models.length > 0 ? data.models[0].name : 'llama3.2'
        });
      } else {
        set({ isOnline: false });
      }
    } catch {
      set({ isOnline: false });
    }
  },

  setActiveModel: (model) => set({ activeModel: model }),

  clearHistory: () => set({ messages: [] }),

  sendMessage: async (content, systemPrompt) => {
    const { messages, activeModel } = get();
    
    // Add user message
    const userMessage = { role: 'user', content };
    const updatedMessages = [...messages, userMessage];
    
    set({ 
      messages: updatedMessages, 
      isLoading: true, 
      streamingText: '' 
    });

    try {
      // Build context messages. If systemPrompt is provided, prepend it.
      const apiMessages = systemPrompt 
        ? [{ role: 'system', content: systemPrompt }, ...updatedMessages]
        : updatedMessages;

      const response = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: activeModel,
          messages: apiMessages
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to connect to AI server');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        
        // SSE formatting: data: {"message":{"content":"foo"}}
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') continue;
            
            try {
              const json = JSON.parse(dataStr);
              if (json.message?.content) {
                assistantResponse += json.message.content;
                set({ streamingText: assistantResponse });
              } else if (json.error) {
                throw new Error(json.error);
              }
            } catch (e) {
              // Ignore partial JSON parsing errors that sometimes happen on chunk boundaries
            }
          }
        }
      }

      // Finish streaming and append assistant response to history
      set((state) => ({
        messages: [...state.messages, { role: 'assistant', content: assistantResponse }],
        streamingText: '',
        isLoading: false
      }));

    } catch (err) {
      console.error('AI Request Failed:', err);
      set((state) => ({
        messages: [...state.messages, { role: 'assistant', content: `Error: ${err.message}` }],
        streamingText: '',
        isLoading: false
      }));
    }
  }
}));
