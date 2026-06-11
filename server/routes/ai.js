const express = require('express');
const router = express.Router();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

// GET /api/ai/status - Check if Ollama is running and get model tags
router.get('/status', async (req, res) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2-second quick check
    
    const response = await fetch(`${OLLAMA_URL}/api/tags`, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      return res.json({ available: true, models: data.models || [] });
    }
    return res.json({ available: false, error: `Ollama returned status ${response.statusCode}`, models: [] });
  } catch (err) {
    return res.json({ available: false, error: err.message, models: [] });
  }
});

// GET /api/ai/models - List available local models
router.get('/models', async (req, res) => {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    if (response.ok) {
      const data = await response.json();
      return res.json(data.models || []);
    }
    return res.status(response.status).json({ error: `Failed to fetch models: ${response.statusText}` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/chat - Standard JSON chat proxy
router.post('/chat', async (req, res) => {
  const { model, messages, options } = req.body;
  try {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'llama3.2',
        messages: messages || [],
        stream: false,
        options: options || { temperature: 0.7 }
      })
    });

    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
    const errText = await response.text();
    return res.status(response.status).json({ error: errText });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/stream - Server-Sent Events (SSE) streaming chat proxy
router.post('/stream', async (req, res) => {
  const { model, messages, options } = req.body;
  try {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'llama3.2',
        messages: messages || [],
        stream: true,
        options: options || { temperature: 0.7 }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(l => l.trim() !== '');
      for (const line of lines) {
        res.write(`data: ${line}\n\n`);
      }
    }

    res.write('event: end\ndata: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Error in AI streaming proxy:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message });
    }
    res.write(`data: {"error": "${err.message}"}\n\n`);
    res.end();
  }
});

module.exports = router;
