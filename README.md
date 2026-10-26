# Learn24

**See how AI works, one step at a time.**

Learn24 is a free collection of animated, step-by-step lessons on GenAI, Agentic AI, AI Security and AI System Design. Every lesson is an interactive animation you can pause, replay and click through, with real-world examples from banking and fintech.

🌐 **Live site:** [learn24.net](https://learn24.net)
👤 **Created by Ajeetkumar**, AI engineer

---

## Lessons

### 🧠 GenAI
| Lesson | Level | What you'll learn |
|---|---|---|
| [How an LLM Answers a Question](genai/llm-inference.html) | Beginner | Tokenizer → token IDs → transformer → softmax → detokenizer |
| [How an LLM Is Trained](genai/llm-training.html) | Beginner | Pretraining, SFT and RLHF with one example |
| [RAG From Scratch](genai/rag-basics.html) | Intermediate | Chunking, embeddings, vector search, grounded answers |
| [LoRA and Fine-Tuning](genai/fine-tuning.html) | Intermediate | When to fine-tune, and how LoRA trains under 1% of the weights |

### 🤖 Agentic AI
| Lesson | Level | What you'll learn |
|---|---|---|
| [What Is an AI Agent?](agentic-ai/what-is-an-agent.html) | Beginner | The think → act → observe loop, with a live trace |
| [Tool Calling Explained](agentic-ai/tool-calling.html) | Beginner | Tool schemas, tool_use requests and results |
| [MCP in 5 Minutes](agentic-ai/mcp.html) | Intermediate | Hosts, clients, servers, tools, resources and prompts |
| [Multi-Agent Patterns](agentic-ai/multi-agent.html) | Advanced | Router, pipeline, supervisor and handoff patterns |

### 🛡️ AI Security
| Lesson | Level | What you'll learn |
|---|---|---|
| [OWASP Top 10 for LLM Applications](ai-security/owasp-llm-top10.html) | Intermediate | All 10 risks (2025): attack, damage, mitigation |
| [OWASP Top 10 for Agentic Applications](ai-security/owasp-agentic-top10.html) | Advanced | All 10 agentic risks (2026), ASI01–ASI10 |
| [Red-Teaming an LLM App](ai-security/red-teaming.html) | Advanced | Scope, test sets, automation, scoring and CI |

### 🏗️ AI System Design
| Lesson | Level | What you'll learn |
|---|---|---|
| [Design a RAG Chatbot](ai-system-design/design-rag-chatbot.html) | Intermediate | Requirements, pipelines, latency budget, evaluation |
| [Serving LLMs at Scale](ai-system-design/llm-serving.html) | Advanced | Prefill vs decode, KV cache, batching, quantization |
| [Caching, Rate Limits and Cost Control](ai-system-design/llm-gateway.html) | Intermediate | LLM gateway: semantic cache, routing, fallbacks, budgets |

---

## Features
- 14 animated lessons with **Pause, Restart and 0.5× / 1× / 2× speed**
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
Hosted on **Vercel** from the `main` branch (framework preset: *Other*, no build command, output directory `./`).

## Sources
- [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/llm-top-10/)
- [OWASP Top 10 for Agentic Applications 2026](https://genai.owasp.org/)
- [Model Context Protocol](https://modelcontextprotocol.io)

Company names, accounts, amounts and metrics in the lessons (NovaBank, NovaBot, NovaPilot) are fictional examples for teaching.

## License
[MIT](LICENSE) © 2026 Ajeetkumar
