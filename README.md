# Learn24

**See how AI works, one step at a time.**

Learn24 is a free collection of animated, step-by-step lessons on GenAI, Agentic AI, AI Security and AI System Design. Every lesson is an interactive animation you can pause, replay and click through, with real-world examples from banking and fintech.

🌐 **Live site:** [learn24-lilac.vercel.app](https://learn24-lilac.vercel.app)
👤 **Created by Ajeetkumar**, AI engineer

---

## New here?
- 🌱 **[Start here](https://learn24-lilac.vercel.app/start)**: what you need, four learning paths and how lessons work
- 📖 **[Glossary](https://learn24-lilac.vercel.app/glossary)**: plain-English meanings of 80+ AI terms (also shown when you hover or tap a term inside a lesson)
- 📄 **Cheat sheets**: a printable one-page summary for each GenAI Course module

## Lessons

### 🧠 GenAI
| Lesson | Level | What you'll learn |
|---|---|---|
| [How an LLM Answers a Question](https://learn24-lilac.vercel.app/genai/llm-inference) | Beginner | Tokenizer → token IDs → transformer → softmax → detokenizer |
| [How an LLM Is Trained](https://learn24-lilac.vercel.app/genai/llm-training) | Beginner | Pretraining, SFT and RLHF with one example |
| [RAG From Scratch](https://learn24-lilac.vercel.app/genai/rag-basics) | Intermediate | Chunking, embeddings, vector search, grounded answers |
| [LoRA and Fine-Tuning](https://learn24-lilac.vercel.app/genai/fine-tuning) | Intermediate | When to fine-tune, and how LoRA trains under 1% of the weights |
| [How BERT Works](https://learn24-lilac.vercel.app/genai/bert) | Beginner | Masked language modelling, the BERT family and fine-tuning, with diagrams |

### 🎓 GenAI Course (24 sessions)

**Module 5 · Transformer & Attention Mechanisms** · [cheat sheet](https://learn24-lilac.vercel.app/genai-course/cheatsheet-m5)

| Session | Lesson | What you'll learn |
|---|---|---|
| 17 | [Motivation & Self-Attention](https://learn24-lilac.vercel.app/genai-course/s17-self-attention) | Why RNNs struggled, and how Query, Key and Value let every word look at every other word. |
| 18 | [Scaled Dot-Product & Multi-Head Attention](https://learn24-lilac.vercel.app/genai-course/s18-multi-head-attention) | The attention formula step by step, why we divide by √dₖ, and why many heads beat one. |
| 19 | [Advanced Attention](https://learn24-lilac.vercel.app/genai-course/s19-advanced-attention) | Efficient attention variants, attention maps on real sentences, and what breaks with long context. |

**Module 6 · Transformer Architecture & Variants** · [cheat sheet](https://learn24-lilac.vercel.app/genai-course/cheatsheet-m6)

| Session | Lesson | What you'll learn |
|---|---|---|
| 20 | [Architecture & Positional Encoding](https://learn24-lilac.vercel.app/genai-course/s20-positional-encoding) | The encoder–decoder end to end, and how word order is injected with positional encodings. |
| 21 | [Inside the Encoder and Decoder Blocks](https://learn24-lilac.vercel.app/genai-course/s21-encoder-decoder-blocks) | Self-attention, FFN, LayerNorm, residuals, masked and cross attention, training vs inference. |
| 22 | [Transformer Variants](https://learn24-lilac.vercel.app/genai-course/s22-transformer-variants) | Encoder-only, decoder-only and encoder-decoder families, and how to choose. |

**Module 7 · Pretrained Models & LLMs** · [cheat sheet](https://learn24-lilac.vercel.app/genai-course/cheatsheet-m7)

| Session | Lesson | What you'll learn |
|---|---|---|
| 23 | [Generative Modeling & Hugging Face](https://learn24-lilac.vercel.app/genai-course/s23-hugging-face) | Autoregressive vs autoencoding models, and the Hugging Face Hub, Transformers, Datasets and Pipelines. |
| 24 | [Decoding Strategies & the LLM Landscape](https://learn24-lilac.vercel.app/genai-course/s24-decoding-llm-landscape) | Greedy, beam, top-k, top-p, temperature, and today’s major model families. |
| 25 | [Adaptation, Quantization & Evaluation](https://learn24-lilac.vercel.app/genai-course/s25-adaptation-evaluation) | Prompting vs RAG vs PEFT, INT8/INT4/GGUF, and metrics like perplexity, BLEU and ROUGE. |

**Module 8 · Prompt Engineering** · [cheat sheet](https://learn24-lilac.vercel.app/genai-course/cheatsheet-m8)

| Session | Lesson | What you'll learn |
|---|---|---|
| 26 | [Prompt Fundamentals](https://learn24-lilac.vercel.app/genai-course/s26-prompt-fundamentals) | Elements of a good prompt, roles, zero-shot and few-shot prompting. |
| 27 | [Reasoning Techniques](https://learn24-lilac.vercel.app/genai-course/s27-reasoning-prompting) | Chain-of-thought, self-consistency and tree-of-thought prompting. |
| 28 | [Structured Output & Reliability](https://learn24-lilac.vercel.app/genai-course/s28-structured-output) | JSON mode, tool schemas, Pydantic parsers, guardrails and retries. |
| 29 | [Dynamic Prompting with LangChain](https://learn24-lilac.vercel.app/genai-course/s29-langchain-lcel) | Prompt templates, output parsers, LCEL, runnables and chains. |
| 30 | [Conversational Chains & Tracing](https://learn24-lilac.vercel.app/genai-course/s30-conversational-chains) | Stuff, map-reduce, refine and map-rerank chains, memory, and LangSmith tracing. |

**Module 9 · LangChain + RAG + LangGraph** · [cheat sheet](https://learn24-lilac.vercel.app/genai-course/cheatsheet-m9)

| Session | Lesson | What you'll learn |
|---|---|---|
| 31 | [RAG Foundations](https://learn24-lilac.vercel.app/genai-course/s31-rag-foundations) | The RAG workflow, why it matters in production, and RAG vs fine-tuning vs long context. |
| 32 | [Document Extraction](https://learn24-lilac.vercel.app/genai-course/s32-document-extraction) | PDF loaders, Unstructured, Textract, Azure Document Intelligence and table extraction. |
| 33 | [Chunking Strategies](https://learn24-lilac.vercel.app/genai-course/s33-chunking) | Fixed, recursive, semantic, structure-aware and parent–child chunking, plus metadata. |
| 34 | [Embeddings & Vector Databases](https://learn24-lilac.vercel.app/genai-course/s34-embeddings-vector-db) | Choosing embeddings, ChromaDB, Pinecone, FAISS, pgvector, and Flat vs IVF vs HNSW. |
| 35 | [Retrievers & Re-Ranking](https://learn24-lilac.vercel.app/genai-course/s35-retrievers-reranking) | Multi-query, parent-document, self-query, hybrid search and cross-encoder re-ranking. |
| 36 | [RAG Evaluation](https://learn24-lilac.vercel.app/genai-course/s36-rag-evaluation) | Golden datasets, hit rate, MRR, faithfulness, and RAGAS / DeepEval. |
| 37 | [LangGraph & Agentic RAG](https://learn24-lilac.vercel.app/genai-course/s37-langgraph-agentic-rag) | State, nodes, edges and cycles; agentic, multimodal and memory-enabled RAG. |
| 38 | [Production Challenges](https://learn24-lilac.vercel.app/genai-course/s38-rag-production) | Incremental indexing, latency, caching, citations, cost, and security. |

**Module 10 · Fine-Tuning Techniques** · [cheat sheet](https://learn24-lilac.vercel.app/genai-course/cheatsheet-m10)

| Session | Lesson | What you'll learn |
|---|---|---|
| 39 | [The Fine-Tuning Decision](https://learn24-lilac.vercel.app/genai-course/s39-fine-tuning-decision) | When to fine-tune, full vs partial tuning, and preparing your dataset. |
| 40 | [PEFT Hands-On](https://learn24-lilac.vercel.app/genai-course/s40-peft-hands-on) | LoRA, QLoRA and a complete fine-tune evaluated against the base model. |

### 🤖 Agentic AI
| Lesson | Level | What you'll learn |
|---|---|---|
| [What Is an AI Agent?](https://learn24-lilac.vercel.app/agentic-ai/what-is-an-agent) | Beginner | The think → act → observe loop, with a live trace |
| [Tool Calling Explained](https://learn24-lilac.vercel.app/agentic-ai/tool-calling) | Beginner | Tool schemas, tool_use requests and results |
| [MCP in 5 Minutes](https://learn24-lilac.vercel.app/agentic-ai/mcp) | Intermediate | Hosts, clients, servers, tools, resources and prompts |
| [Multi-Agent Patterns](https://learn24-lilac.vercel.app/agentic-ai/multi-agent) | Advanced | Router, pipeline, supervisor and handoff patterns |

### 🛡️ AI Security
| Lesson | Level | What you'll learn |
|---|---|---|
| [OWASP Top 10 for LLM Applications](https://learn24-lilac.vercel.app/ai-security/owasp-llm-top10) | Intermediate | All 10 risks (2025): attack, damage, mitigation |
| [OWASP Top 10 for Agentic Applications](https://learn24-lilac.vercel.app/ai-security/owasp-agentic-top10) | Advanced | All 10 agentic risks (2026), ASI01–ASI10 |
| [Red-Teaming an LLM App](https://learn24-lilac.vercel.app/ai-security/red-teaming) | Advanced | Scope, test sets, automation, scoring and CI |

### 🏗️ AI System Design
| Lesson | Level | What you'll learn |
|---|---|---|
| [Design a RAG Chatbot](https://learn24-lilac.vercel.app/ai-system-design/design-rag-chatbot) | Intermediate | Requirements, pipelines, latency budget, evaluation |
| [Serving LLMs at Scale](https://learn24-lilac.vercel.app/ai-system-design/llm-serving) | Advanced | Prefill vs decode, KV cache, batching, quantization |
| [Caching, Rate Limits and Cost Control](https://learn24-lilac.vercel.app/ai-system-design/llm-gateway) | Intermediate | LLM gateway: semantic cache, routing, fallbacks, budgets |

---

## Features
- Animated lessons with **Pause, Restart and 0.25× – 2× speed** (starts at 0.5×)
- Article lessons with diagrams, live demos, copyable code and a quiz
- **Hover definitions** for key terms, a full **glossary** and module **cheat sheets**
- **Light and dark themes** (☀ / ☾ button, remembered per browser)
- Topic pages, search across all lessons, and **progress tracking** ("Mark as done", saved in your browser)
- Works on phones, tablets and desktops
- Plain HTML, CSS and JavaScript: no build step, no framework, no backend

## Run locally
Clone the repo and open `index.html` in your browser:
```bash
git clone https://github.com/ajeetkumarAI/learn24.git
cd learn24
# double-click index.html, or serve it:
npx serve .
```

## Project structure
```
index.html                 Home: topics, search, live lessons
assets/data.js             List of topics and lessons (edit this to add lessons)
assets/site.css, site.js   Home and topic pages
assets/stepper.css, .js    Lesson engine (steps, flows, typed text, charts)
assets/lesson.js           Lesson top bar, breadcrumb, previous/next, "Mark as done"
<topic>/index.html         Topic page
<topic>/<lesson>.html      One lesson
vercel.json                Clean URLs on Vercel
```

## Add a new lesson
1. Create `<topic>/<lesson-id>.html`. The quickest way is to copy an existing lesson and edit its `window.LESSON = {...}` steps.
2. Make sure these lines come just before `</body>`:
   ```html
   <script src="../assets/data.js"></script>
   <script src="../assets/lesson.js" data-lesson="<topic>/<lesson-id>"></script>
   ```
3. Add the lesson to its topic in `assets/data.js` with `status: "live"`.
4. Commit and push. Vercel redeploys automatically.

## Deployment
Hosted on **Vercel** at [learn24-lilac.vercel.app](https://learn24-lilac.vercel.app), deployed from the `main` branch (framework preset: *Other*, no build command, output directory `./`).

## Sources
- [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/llm-top-10/)
- [OWASP Top 10 for Agentic Applications 2026](https://genai.owasp.org/)
- [Model Context Protocol](https://modelcontextprotocol.io)

Company names, accounts, amounts and metrics in the lessons (NovaBank, NovaBot, NovaPilot) are fictional examples for teaching.

## License
[MIT](LICENSE) © 2026 Ajeetkumar
