/* Learn24 content list.
   To add a lesson: put the HTML file in its topic folder, then add one entry to that topic's "lessons" below.
   status: "live" shows a link; "soon" shows it greyed out as coming soon. */
window.LEARN24 = {
  site: {
    name: "Learn24",
    tagline: "Animated, step-by-step lessons on GenAI, Agentic AI, AI Security and AI System Design.",
    author: "Ajeetkumar",
    links: { linkedin: "", telegram: "" } /* paste your profile and channel URLs here */
  },
  topics: [
    {
      id: "genai", name: "GenAI", color: "#5aa9ff",
      blurb: "How large language models work, from tokens to training to answers.",
      lessons: [
        { id: "llm-training", title: "How an LLM Is Trained", summary: "Pretraining, SFT and RLHF, each animated step by step with one example: the capital of India.", level: "Beginner", mins: 6, tags: ["Pretraining", "SFT", "RLHF"], status: "live" },
        { id: "llm-inference", title: "How an LLM Answers a Question", summary: "Tokenizer, token IDs, transformer, softmax and detokenizer, one token at a time.", level: "Beginner", mins: 4, tags: ["Inference", "Tokens"], status: "live" },
        { id: "bert", title: "BERT Explained: How It Works and Its Variants", summary: "A full illustrated guide: bidirectional reading, fill-in-the-blank training, fine-tuning, Python code and the BERT family.", level: "Beginner", mins: 15, tags: ["BERT", "Transformers", "Article"], status: "live" },
        { id: "rag-basics", title: "RAG From Scratch", summary: "Chunking, embeddings, vector search and grounded answers.", level: "Intermediate", mins: 8, tags: ["RAG", "Embeddings"], status: "live" },
        { id: "fine-tuning", title: "LoRA and Fine-Tuning", summary: "When to fine-tune, and how adapters change a model cheaply.", level: "Intermediate", mins: 7, tags: ["LoRA", "PEFT"], status: "live" }
      ]
    },
    {
      id: "agentic-ai", name: "Agentic AI", color: "#45d19b",
      blurb: "Agents that plan, call tools and work together.",
      lessons: [
        { id: "what-is-an-agent", title: "What Is an AI Agent?", summary: "The loop of think, act and observe, with tools and memory.", level: "Beginner", mins: 5, tags: ["Agents", "ReAct"], status: "live" },
        { id: "tool-calling", title: "Tool Calling Explained", summary: "How a model picks a tool, fills its arguments and reads the result.", level: "Beginner", mins: 5, tags: ["Tools", "Function calling"], status: "live" },
        { id: "mcp", title: "MCP in 5 Minutes", summary: "The Model Context Protocol: clients, servers, tools and resources.", level: "Intermediate", mins: 5, tags: ["MCP"], status: "live" },
        { id: "multi-agent", title: "Multi-Agent Patterns", summary: "Supervisor, router and swarm designs, and when each one fits.", level: "Advanced", mins: 8, tags: ["Multi-agent", "A2A"], status: "live" }
      ]
    },
    {
      id: "ai-security", name: "AI Security", color: "#ff6b6b",
      blurb: "How AI apps get attacked, and the controls that stop it.",
      lessons: [
        { id: "owasp-llm-top10", title: "OWASP Top 10 for LLM Applications", summary: "All 10 risks on a bank chatbot: where each one hits, the attack, the damage and the fix.", level: "Intermediate", mins: 5, tags: ["OWASP 2025", "Prompt injection"], status: "live" },
        { id: "owasp-agentic-top10", title: "OWASP Top 10 for Agentic Applications", summary: "All 10 agentic risks on a bank's AI agents, from goal hijack to rogue agents.", level: "Advanced", mins: 6, tags: ["OWASP 2026", "Agents"], status: "live" },
        { id: "red-teaming", title: "Red-Teaming an LLM App", summary: "A practical checklist for testing your own chatbot.", level: "Advanced", mins: 8, tags: ["Red team"], status: "live" }
      ]
    },
    {
      id: "ai-system-design", name: "AI System Design", color: "#f2b84b",
      blurb: "Designing GenAI systems that are fast, reliable and affordable.",
      lessons: [
        { id: "design-rag-chatbot", title: "Design a RAG Chatbot", summary: "Ingestion, retrieval, generation, evaluation and monitoring end to end.", level: "Intermediate", mins: 10, tags: ["RAG", "Architecture"], status: "live" },
        { id: "llm-serving", title: "Serving LLMs at Scale", summary: "Batching, KV cache, quantization and autoscaling.", level: "Advanced", mins: 10, tags: ["Serving", "Latency"], status: "live" },
        { id: "llm-gateway", title: "Caching, Rate Limits and Cost Control", summary: "An LLM gateway that keeps bills and latency in check.", level: "Intermediate", mins: 7, tags: ["Gateway", "Cost"], status: "live" }
      ]
    }
  ]
};
