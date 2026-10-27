/* Learn24 glossary: one list of plain-English definitions.
   On lesson pages the first use of each term gets a dotted underline; hover, tap or focus it to see the meaning.
   glossary.html renders the same list as an A–Z page. To add a term, add one row below. */
(function () {
  if (window.L24_GLOSSARY_LOADED) return; window.L24_GLOSSARY_LOADED = true;
  const me = document.currentScript, base = me ? me.src.replace(/assets\/glossary\.js(\?.*)?$/, '') : '../';

  // [id, term, other spellings matched in text, group, definition]
  const G = [
    // Basics
    ['llm', 'LLM', ['large language model', 'LLMs'], 'Basics', 'Large Language Model. A neural network trained on huge amounts of text to predict the next token. ChatGPT, Claude, Gemini and Llama are LLMs.'],
    ['token', 'Token', ['tokens'], 'Basics', 'A small piece of text that the model reads and writes: a word, part of a word or a symbol. "unbelievable" may become "un", "believ", "able". Models count length and price in tokens.'],
    ['tokenizer', 'Tokenizer', ['tokenizers', 'tokenisation', 'tokenization'], 'Basics', 'The tool that splits text into tokens and turns each token into a number (its ID) before the model sees it.'],
    ['parameter', 'Parameter', ['parameters', 'weights'], 'Basics', 'A number inside the model that is learned during training. "8B" means about 8 billion parameters. More parameters usually means more knowledge but more memory and cost.'],
    ['neural-network', 'Neural network', ['neural networks'], 'Basics', 'A program made of many layers of simple maths units. Each layer transforms numbers and passes them on. Training adjusts the parameters so the output becomes useful.'],
    ['inference', 'Inference', [], 'Basics', 'Using a trained model to get an answer. Training teaches the model; inference is the model doing its job for a user.'],
    ['prompt', 'Prompt', ['prompts'], 'Basics', 'The text you send to the model: your question, instructions and any examples or documents.'],
    ['system-prompt', 'System prompt', ['system prompts', 'system message'], 'Basics', 'Hidden instructions given to the model before the user’s message, such as its role, rules and tone. The user usually does not see it.'],
    ['context-window', 'Context window', ['context length'], 'Basics', 'The maximum number of tokens the model can look at in one request, counting both input and output. Text beyond it is cut off.'],
    ['hallucination', 'Hallucination', ['hallucinations', 'hallucinate'], 'Basics', 'When a model gives an answer that sounds confident but is false or made up. RAG and citations reduce it; they do not remove it fully.'],
    ['api', 'API', ['APIs'], 'Basics', 'Application Programming Interface. A way for one program to call another, e.g. your code sending a prompt to OpenAI and getting the reply back as data.'],
    ['json', 'JSON', [], 'Basics', 'A simple text format for structured data, like {"name": "Asha", "age": 30}. Most APIs and structured LLM outputs use it.'],
    ['gpu', 'GPU', ['GPUs'], 'Basics', 'Graphics Processing Unit. A chip that does many calculations in parallel, which makes training and running LLMs fast. GPU memory (VRAM) limits how big a model you can load.'],
    ['latency', 'Latency', [], 'Basics', 'How long the user waits for a response. For chat apps people also measure time to first token: how soon the first word appears.'],
    ['throughput', 'Throughput', [], 'Basics', 'How much work a system finishes per second, e.g. tokens per second or requests per second across all users.'],

    // NLP basics
    ['stemming', 'Stemming / lemmatization', ['stemming', 'lemmatization', 'lemmatisation', 'stemmer', 'lemmatizer'], 'NLP basics', 'Reducing words to a base form. Stemming chops endings by rule ("studies" → "studi"); lemmatization looks up the dictionary form ("studies" → "study").'],
    ['stopwords', 'Stopwords', ['stopword', 'stop words'], 'NLP basics', 'Very common words like "the", "is", "in". Often removed for keyword search, but removing "not" can flip the meaning.'],
    ['ner', 'NER', ['named entity recognition', 'named entities'], 'NLP basics', 'Named Entity Recognition: finding names of people, organisations, places, amounts and dates in text.'],
    ['pos', 'POS tagging', ['part-of-speech', 'POS tags'], 'NLP basics', 'Labelling each word with its type: noun, verb, adjective and so on.'],
    ['regex', 'Regular expression', ['regex', 'regular expressions'], 'NLP basics', 'A short pattern that describes text, like \\d{4} for "four digits". Used to extract and redact data such as emails, dates and IDs.'],
    ['one-hot', 'One-hot encoding', ['one-hot'], 'NLP basics', 'Representing a word as a vector of zeros with a single 1 at its position in the vocabulary. Simple, but every word looks equally unrelated.'],
    ['bow', 'Bag of Words', ['BoW', 'bag-of-words'], 'NLP basics', 'Representing a document by counting how often each vocabulary word appears, ignoring word order.'],
    ['ngram', 'N-gram', ['n-grams', 'bigram', 'bigrams', 'trigram'], 'NLP basics', 'A run of n neighbouring words. "payment failed" is a bigram (n = 2).'],
    ['tfidf', 'TF-IDF', [], 'NLP basics', 'Term Frequency × Inverse Document Frequency: a word weight that is high when the word is frequent in this document but rare across all documents.'],
    ['word2vec', 'Word2Vec / GloVe', ['Word2Vec', 'GloVe'], 'NLP basics', 'Classic methods (2013, 2014) that learn one embedding vector per word from the contexts it appears in.'],
    // Deep learning
    ['perceptron', 'Perceptron', ['perceptrons', 'MLP', 'multi-layer perceptron'], 'Deep learning', 'The simplest neural network: one neuron that sums weighted inputs plus a bias and outputs yes or no. Stacked in layers it becomes a multi-layer perceptron (MLP).'],
    ['activation', 'Activation function', ['activation functions', 'ReLU', 'sigmoid', 'tanh'], 'Deep learning', 'The non-linear step after each layer, such as ReLU, sigmoid or tanh. Without it, many layers would act like one.'],
    ['loss', 'Loss function', ['loss functions', 'cross-entropy', 'MSE'], 'Deep learning', 'A number that says how wrong the model is, e.g. mean squared error for numbers or cross-entropy for classes. Training tries to make it smaller.'],
    ['learning-rate', 'Learning rate', [], 'Deep learning', 'The step size of each weight update in gradient descent. Too small = slow; too big = training explodes.'],
    ['backprop', 'Backpropagation', ['backprop', 'BPTT'], 'Deep learning', 'The algorithm that computes the gradient of the loss for every weight, by applying the chain rule from the output back to the input.'],
    ['optimizer', 'Optimizer', ['optimizers', 'Adam', 'AdamW', 'SGD'], 'Deep learning', 'The rule for updating weights from gradients: SGD, Momentum, RMSProp, Adam or AdamW.'],
    ['dropout', 'Dropout', [], 'Deep learning', 'Randomly switching off some neurons during training so the network does not rely on any single one. Turned off at evaluation time.'],
    ['rnn', 'RNN', ['RNNs', 'recurrent neural network', 'recurrent neural networks'], 'Deep learning', 'Recurrent Neural Network: reads a sequence one step at a time, carrying a hidden state (memory) forward.'],
    ['lstm', 'LSTM / GRU', ['LSTM', 'LSTMs', 'GRU', 'GRUs'], 'Deep learning', 'RNN variants with gates that decide what to remember and forget, so memory lasts over longer sequences.'],
    ['seq2seq', 'Seq2seq', ['sequence-to-sequence', 'encoder-decoder', 'encoder–decoder'], 'Deep learning', 'An encoder reads the input sequence and a decoder writes an output sequence, e.g. for translation.'],
    // Tools
    ['venv', 'Virtual environment', ['virtual environments', 'venv'], 'Basics', 'A private folder of Python packages for one project, so projects with different versions do not break each other.'],
    ['streamlit', 'Streamlit / Gradio', ['Streamlit', 'Gradio'], 'Basics', 'Python libraries that turn a script or function into a simple web app in a few lines.'],

    // Transformer
    ['transformer', 'Transformer', ['transformers'], 'Transformer', 'The neural network design behind almost all modern LLMs (2017, "Attention Is All You Need"). It processes all tokens in parallel and uses attention to connect them.'],
    ['embedding', 'Embedding', ['embeddings'], 'Transformer', 'A list of numbers (a vector) that stands for the meaning of a token, sentence or document. Similar meanings get similar vectors, so a computer can compare meanings with maths.'],
    ['vector', 'Vector', ['vectors'], 'Transformer', 'An ordered list of numbers, like [0.12, -0.80, 0.33]. Embeddings are vectors; you can measure how close two vectors are.'],
    ['attention', 'Attention', ['self-attention'], 'Transformer', 'The step where every token looks at the other tokens and decides which ones matter for its meaning. In "the bank of the river", attention links "bank" to "river".'],
    ['qkv', 'Query, Key, Value', ['Q, K, V', 'Q, K and V'], 'Transformer', 'Three vectors made from each token for attention. The query asks "what am I looking for?", keys answer "what do I contain?", and values carry the information that gets mixed in.'],
    ['multi-head', 'Multi-head attention', ['multi-head'], 'Transformer', 'Running several attention "heads" side by side. Each head can learn a different kind of relation, such as grammar, meaning or position.'],
    ['softmax', 'Softmax', [], 'Transformer', 'A formula that turns any list of scores into probabilities between 0 and 1 that add up to 1. Higher scores get bigger shares.'],
    ['logits', 'Logits', ['logit'], 'Transformer', 'The raw scores the model gives every possible next token, before softmax turns them into probabilities.'],
    ['positional-encoding', 'Positional encoding', ['position encoding', 'positional embeddings', 'RoPE'], 'Transformer', 'Extra information added to each token so the model knows word order. Without it, "dog bites man" and "man bites dog" would look the same.'],
    ['encoder', 'Encoder', ['encoders'], 'Transformer', 'The part of a transformer that reads the whole input at once and builds an understanding of it. BERT is encoder-only.'],
    ['decoder', 'Decoder', ['decoders'], 'Transformer', 'The part of a transformer that generates output one token at a time, looking only at earlier tokens. GPT-style chat models are decoder-only.'],
    ['kv-cache', 'KV cache', ['KV-cache'], 'Transformer', 'Saved keys and values from earlier tokens, so the model does not recompute them for every new token. It makes generation fast but uses GPU memory.'],
    ['bert', 'BERT', [], 'Transformer', 'An encoder-only transformer from Google (2018) trained by filling in hidden words. Great for understanding tasks like classification and search, not for writing long text.'],
    ['gpt', 'GPT', [], 'Transformer', 'Generative Pre-trained Transformer. OpenAI’s family of decoder-only models that generate text one token at a time.'],

    // Training
    ['pretraining', 'Pretraining', ['pre-training', 'pretrained', 'pre-trained'], 'Training', 'The first, biggest training stage: the model reads trillions of tokens of text and learns to predict the next token. This gives it general knowledge of language and facts.'],
    ['fine-tuning', 'Fine-tuning', ['fine-tune', 'fine-tuned', 'finetuning'], 'Training', 'Training an already-trained model a bit more on a smaller, focused dataset so it learns a task, style or domain.'],
    ['sft', 'SFT', ['supervised fine-tuning'], 'Training', 'Supervised Fine-Tuning. Training on example pairs of instruction → good answer, so the model learns to follow instructions like an assistant.'],
    ['rlhf', 'RLHF', [], 'Training', 'Reinforcement Learning from Human Feedback. People rank model answers, a reward model learns those preferences, and the LLM is trained to give answers that score higher.'],
    ['lora', 'LoRA', ['QLoRA'], 'Training', 'Low-Rank Adaptation. A cheap fine-tuning method that freezes the original model and trains small extra matrices (often under 1% of the parameters). QLoRA does the same on a 4-bit quantized model.'],
    ['peft', 'PEFT', ['parameter-efficient fine-tuning'], 'Training', 'Parameter-Efficient Fine-Tuning. Methods such as LoRA that train only a small number of parameters, so fine-tuning fits on a single GPU.'],
    ['quantization', 'Quantization', ['quantized', 'quantisation'], 'Training', 'Storing model numbers with fewer bits (for example 4 or 8 instead of 16) so the model needs less memory and runs faster, with a small loss in quality.'],
    ['epoch', 'Epoch', ['epochs'], 'Training', 'One full pass over the training dataset.'],
    ['gradient', 'Gradient', ['gradients', 'gradient descent'], 'Training', 'The direction to change each parameter to reduce the error. Training takes many small steps along the gradient.'],
    ['overfitting', 'Overfitting', ['overfit'], 'Training', 'When a model memorises its training examples instead of learning the general pattern, so it does badly on new data.'],
    ['hugging-face', 'Hugging Face', [], 'Training', 'A website and set of Python libraries (transformers, datasets, peft) where people share and download open models and datasets.'],

    // Generation
    ['temperature', 'Temperature', [], 'Generation', 'A setting that controls randomness when picking the next token. Low (around 0) = focused and repeatable; high (around 1 or more) = more varied and creative.'],
    ['top-k', 'Top-k', ['top-k sampling'], 'Generation', 'Only the k most likely next tokens are allowed; the model picks among them.'],
    ['top-p', 'Top-p', ['nucleus sampling'], 'Generation', 'Only the smallest set of likely tokens whose probabilities add up to p (e.g. 0.9) is allowed; the model picks among them.'],
    ['greedy', 'Greedy decoding', ['greedy'], 'Generation', 'Always picking the single most likely next token. Simple and repeatable, but can sound dull or loop.'],
    ['beam-search', 'Beam search', [], 'Generation', 'Keeping several candidate sentences at each step and choosing the best overall sequence at the end. Common in translation.'],
    ['perplexity', 'Perplexity', [], 'Generation', 'A score for how surprised a model is by real text. Lower perplexity means the model predicts the text better.'],
    ['bleu-rouge', 'BLEU / ROUGE', ['BLEU', 'ROUGE'], 'Generation', 'Scores that compare model output with a reference text by counting overlapping words. BLEU is common for translation, ROUGE for summaries.'],

    // Prompting
    ['zero-shot', 'Zero-shot', [], 'Prompting', 'Asking the model to do a task with instructions only, no examples.'],
    ['few-shot', 'Few-shot', ['few-shot prompting'], 'Prompting', 'Putting a few worked examples in the prompt so the model copies the pattern.'],
    ['cot', 'Chain-of-thought', ['chain of thought', 'CoT'], 'Prompting', 'Asking the model to work through the steps before giving the final answer. It often improves maths and logic answers.'],
    ['structured-output', 'Structured output', ['structured outputs'], 'Prompting', 'Making the model reply in a fixed format, usually JSON that matches a schema, so your code can read it reliably.'],
    ['pydantic', 'Pydantic', [], 'Prompting', 'A Python library for defining data shapes (fields and types) and checking data against them. Often used to validate LLM JSON output.'],
    ['schema', 'Schema', ['schemas', 'JSON Schema'], 'Prompting', 'A description of the exact fields, types and rules your data must follow.'],

    // RAG
    ['rag', 'RAG', ['retrieval-augmented generation'], 'RAG', 'Retrieval-Augmented Generation. Before answering, the app searches your documents, puts the best passages into the prompt, and the LLM answers from them. Like an open-book exam.'],
    ['chunk', 'Chunk', ['chunks', 'chunking'], 'RAG', 'A small piece of a document (a few sentences to a paragraph) stored for search. Documents are split into chunks because whole files are too big and too noisy.'],
    ['vector-db', 'Vector database', ['vector databases', 'vector store', 'vector stores', 'vector DB'], 'RAG', 'A database that stores embeddings and quickly finds the ones closest to a query. Examples: FAISS, Chroma, Pinecone, pgvector, Qdrant.'],
    ['cosine', 'Cosine similarity', [], 'RAG', 'A way to measure how similar two vectors are by the angle between them: 1 = same direction (same meaning), 0 = unrelated.'],
    ['retriever', 'Retriever', ['retrievers', 'retrieval'], 'RAG', 'The part of a RAG app that finds the most relevant chunks for a question.'],
    ['bm25', 'BM25', [], 'RAG', 'A classic keyword-search scoring method. It rewards chunks that contain the exact query words, especially rare ones. Good for names, codes and IDs.'],
    ['hybrid-search', 'Hybrid search', [], 'RAG', 'Combining keyword search (like BM25) with vector search, then merging the two result lists, often with Reciprocal Rank Fusion.'],
    ['reranker', 'Reranker', ['rerankers', 'reranking', 're-ranking', 'cross-encoder'], 'RAG', 'A second, more careful model that re-scores the top search results against the question and puts the best ones first.'],
    ['ann', 'ANN / HNSW', ['HNSW', 'approximate nearest neighbour', 'approximate nearest neighbor'], 'RAG', 'Approximate nearest-neighbour search: index methods such as HNSW (a graph you hop through) that find close vectors very fast by skipping most comparisons, at a tiny cost in accuracy.'],
    ['faiss', 'FAISS', [], 'RAG', 'A free library from Meta for fast vector search. It runs inside your program; it is not a full database server.'],
    ['metadata', 'Metadata', [], 'RAG', 'Extra facts stored with each chunk, such as source file, page, date or department, used for filtering and citations.'],
    ['grounding', 'Grounding', ['grounded'], 'RAG', 'Making sure the answer is based on the retrieved sources and not on the model’s guesses.'],
    ['mrr', 'Hit rate / MRR', ['MRR', 'hit rate', 'Recall@k'], 'RAG', 'Retrieval scores. Hit rate (or recall@k): how often the right chunk is anywhere in the top k. MRR: on average, how high the first right chunk is ranked (1 = always first).'],

    // Agents and frameworks
    ['agent', 'AI agent', ['agents', 'agentic'], 'Agents', 'An LLM in a loop that can decide its next step, call tools, look at the result and keep going until the task is done.'],
    ['tool-calling', 'Tool calling', ['function calling', 'tool call', 'tool calls'], 'Agents', 'The model replies with a structured request like {"tool": "get_weather", "city": "Pune"}; your code runs the tool and sends the result back.'],
    ['mcp', 'MCP', ['Model Context Protocol'], 'Agents', 'Model Context Protocol. An open standard (from Anthropic) for connecting AI apps to tools and data sources through one common interface, like a USB port for tools.'],
    ['langchain', 'LangChain', [], 'Agents', 'A popular Python/JavaScript framework with ready parts for prompts, models, retrievers and chains.'],
    ['lcel', 'LCEL', ['LangChain Expression Language'], 'Agents', 'LangChain Expression Language: joining steps with the | symbol, e.g. prompt | model | parser.'],
    ['langgraph', 'LangGraph', [], 'Agents', 'A library for building agents as a graph of steps (nodes) with arrows (edges), including loops and shared state.'],
    ['memory', 'Conversation memory', ['chat history'], 'Agents', 'Earlier messages kept and sent again with each new request, because the model itself remembers nothing between calls.'],

    // Security
    ['guardrail', 'Guardrail', ['guardrails'], 'Security', 'A check before or after the model (filters, rules, classifiers) that blocks unsafe input or output.'],
    ['prompt-injection', 'Prompt injection', [], 'Security', 'An attack where text written by an attacker (in a message, web page or document) tricks the model into ignoring its instructions. The number one risk in the OWASP LLM Top 10.'],
    ['jailbreak', 'Jailbreak', ['jailbreaks', 'jailbreaking'], 'Security', 'A prompt crafted to make a model break its safety rules.'],
    ['red-teaming', 'Red teaming', ['red team'], 'Security', 'Attacking your own AI system on purpose, before real attackers do, to find weak spots.'],
    ['owasp', 'OWASP', [], 'Security', 'Open Worldwide Application Security Project: a non-profit that publishes free security guides, such as the Top 10 risks for LLM apps and for agentic apps.'],
    ['pii', 'PII', ['personal data'], 'Security', 'Personally Identifiable Information: data that identifies a person, such as name, phone, email, ID or account number.'],

    // Cloud & AWS
    ['cloud-computing', 'Cloud computing', ['the cloud'], 'Cloud & AWS', 'Renting computing resources (servers, storage, databases, networking) over the internet and paying only for what you use.'],
    ['capex', 'CapEx / OpEx', ['CapEx', 'OpEx'], 'Cloud & AWS', 'CapEx = big upfront spending to buy things (servers). OpEx = ongoing running costs (electricity, rent, cloud bills). The cloud turns CapEx into OpEx.'],
    ['iaas', 'IaaS / PaaS / SaaS', ['IaaS', 'PaaS', 'SaaS'], 'Cloud & AWS', 'Cloud service models. IaaS: you get virtual servers and manage the OS (EC2). PaaS: you only bring code (Elastic Beanstalk). SaaS: ready software (Gmail).'],
    ['region', 'AWS Region', ['Region', 'Regions'], 'Cloud & AWS', 'A geographic area where AWS has data centres, e.g. Mumbai (ap-south-1). Each Region has several Availability Zones.'],
    ['az', 'Availability Zone (AZ)', ['Availability Zone', 'Availability Zones', 'AZ', 'AZs'], 'Cloud & AWS', 'One or more isolated data centres inside a Region, with separate power and networking. Run in 2+ AZs for high availability.'],
    ['hypervisor', 'Hypervisor', ['hypervisors', 'virtualization', 'virtualisation'], 'Cloud & AWS', 'Software that splits one physical machine into many isolated virtual machines. AWS uses the Nitro hypervisor.'],
    ['ec2', 'Amazon EC2', ['EC2'], 'Cloud & AWS', 'Elastic Compute Cloud: AWS virtual servers (instances) you rent by the second.'],
    ['ami', 'AMI', ['Amazon Machine Image'], 'Cloud & AWS', 'Amazon Machine Image: a template with an operating system (and software) used to launch EC2 instances.'],
    ['ebs', 'EBS', ['Elastic Block Store', 'EBS volume', 'EBS volumes'], 'Cloud & AWS', 'Elastic Block Store: a persistent network disk for an EC2 instance. Data survives stop and start; back it up with snapshots.'],
    ['vpc', 'VPC', ['Virtual Private Cloud', 'VPCs'], 'Cloud & AWS', 'Virtual Private Cloud: your own private, isolated network in AWS, divided into subnets.'],
    ['security-group', 'Security group', ['security groups'], 'Cloud & AWS', 'A virtual firewall for EC2: allow rules for ports and IP ranges. Stateful; no deny rules.'],
    ['key-pair', 'Key pair', ['key pairs'], 'Cloud & AWS', 'A public key (kept by AWS on the instance) and a private key (.pem, kept by you) used to log in securely.'],
    ['elastic-ip', 'Elastic IP', ['Elastic IPs'], 'Cloud & AWS', 'A fixed public IPv4 address in AWS that does not change when you stop and start an instance.'],
    ['cidr', 'CIDR', ['CIDR block', 'subnet mask'], 'Cloud & AWS', 'A short way to write an IP range: 10.0.0.0/16 means the first 16 bits are the network. Addresses = 2^(32 − prefix).'],
    ['subnet', 'Subnet', ['subnets'], 'Cloud & AWS', 'A smaller piece of a network. In AWS, each subnet lives in one Availability Zone; AWS reserves 5 addresses in each.'],
    ['nat', 'NAT', ['NAT Gateway', 'Network Address Translation'], 'Cloud & AWS', 'Network Address Translation: lets many private IPs share one public IP to reach the internet.'],
    ['dhcp', 'DHCP', ['Dynamic Host Configuration Protocol'], 'Cloud & AWS', 'Gives devices IP addresses automatically, in four steps: Discover, Offer, Request, Acknowledge (DORA).'],
    ['ssh-rdp', 'SSH / RDP', ['SSH', 'RDP'], 'Cloud & AWS', 'Remote login methods. SSH (port 22) gives a Linux command line; RDP (port 3389) gives a Windows desktop.'],
    ['iam', 'IAM', ['Identity and Access Management'], 'Cloud & AWS', 'AWS Identity and Access Management: users, roles and permissions that control who can do what in your account.'],
    ['s3', 'Amazon S3', ['S3'], 'Cloud & AWS', 'Simple Storage Service: stores files (objects) with 99.999999999% durability; also hosts static websites.'],

    // Indian examples used in lessons
    ['upi', 'UPI', [], 'Examples used in lessons', 'Unified Payments Interface: India’s instant mobile payment system (like Pix in Brazil or a faster bank transfer). Used in many lesson examples.'],
    ['kyc', 'KYC', [], 'Examples used in lessons', 'Know Your Customer: the identity check banks must do when you open an account. Used in banking examples.'],
    ['neft', 'NEFT / IMPS', ['NEFT', 'IMPS', 'RTGS'], 'Examples used in lessons', 'Indian bank-to-bank transfer methods (similar to ACH or wire transfers in other countries).'],
    ['inr', '₹ / lakh / crore', ['lakh', 'crore'], 'Examples used in lessons', '₹ is the Indian rupee (the rate changes; about ₹95 = US$1 in late 2026). 1 lakh = 100,000 and 1 crore = 10,000,000.'],
  ];
  const groups = [...new Set(G.map(g => g[3]))];
  window.L24_GLOSSARY = { terms: G.map(([id, term, alt, group, def]) => ({ id, term, alt, group, def })), groups, base };

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // ---------- glossary page ----------
  const page = document.getElementById('gl-list');
  if (page) {
    const q = document.getElementById('gl-q'), cnt = document.getElementById('gl-count');
    const draw = () => {
      const s = (q.value || '').trim().toLowerCase();
      const hit = t => !s || [t.term, ...t.alt, t.def].join(' ').toLowerCase().includes(s);
      let n = 0;
      page.innerHTML = groups.map(gp => {
        const rows = window.L24_GLOSSARY.terms.filter(t => t.group === gp && hit(t)).sort((a, b) => a.term.localeCompare(b.term));
        n += rows.length; if (!rows.length) return '';
        return `<section class="gl-sec"><h2>${esc(gp)}</h2><dl>${rows.map(t => `<div class="gl-row" id="${t.id}"><dt>${esc(t.term)}${t.alt.length ? `<small>${esc(t.alt.slice(0, 3).join(' · '))}</small>` : ''}</dt><dd>${esc(t.def)}</dd></div>`).join('')}</dl></section>`;
      }).join('') || `<p class="gl-none">No term matches “${esc(q.value)}”.</p>`;
      cnt.textContent = `${n} term${n === 1 ? '' : 's'}`;
    };
    q.addEventListener('input', draw); draw();
    if (location.hash) { const el = document.getElementById(location.hash.slice(1)); if (el) { el.classList.add('hl'); el.scrollIntoView({ block: 'center' }); } }
    return;
  }

  // ---------- lesson pages: underline the first use of each term ----------
  const scope = document.querySelector('article') || document.querySelector('.wrap') || document.querySelector('main');
  if (!scope) return;
  const forms = [];
  window.L24_GLOSSARY.terms.forEach(t => [t.term, ...t.alt].forEach(f => {
    if (/[\/,]/.test(f) && f !== t.term) return;
    f.split(' / ').forEach(x => forms.push({ f: x.trim(), t }));
  }));
  forms.sort((a, b) => b.f.length - a.f.length);
  const caps = f => f === f.toUpperCase() && /[A-Z]/.test(f);       // acronyms match case-sensitively
  const rx = new RegExp('(^|[^\\w-])(' + forms.map(x => reEsc(x.f)).join('|') + ')(?![\\w-])', 'gi');
  const byForm = new Map(); forms.forEach(x => { if (!byForm.has(x.f.toLowerCase())) byForm.set(x.f.toLowerCase(), x); });
  const used = new Set();
  const SKIP = 'code,pre,a,h1,h2,h3,h4,button,script,style,svg,.quiz,.demo,.codebox,.out,.toc,.l24-bar,.l24-nav,.credit,.meta,.kicker,.gl,label,.chip,.txt';
  const okEl = el => el && !el.closest(SKIP);
  const blocks = scope.querySelectorAll('p,li,td,.callout,.lede,.sub,figcaption,blockquote');
  let added = 0;
  blocks.forEach(b => {
    if (!okEl(b) || added > 40) return;
    const walker = document.createTreeWalker(b, NodeFilter.SHOW_TEXT, { acceptNode: n => okEl(n.parentElement) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const txt = node.nodeValue; rx.lastIndex = 0; let m, out = null, last = 0;
      while ((m = rx.exec(txt))) {
        const word = m[2], hit = byForm.get(word.toLowerCase());
        if (!hit || used.has(hit.t.id) || (caps(hit.f) && word !== hit.f)) continue;
        used.add(hit.t.id); added++;
        out = out || document.createDocumentFragment();
        const start = m.index + m[1].length;
        out.append(txt.slice(last, start));
        const s = document.createElement('span'); s.className = 'gl'; s.tabIndex = 0; s.dataset.gl = hit.t.id; s.textContent = word;
        s.setAttribute('role', 'button'); s.setAttribute('aria-label', `${word}: show meaning`);
        out.append(s); last = start + word.length;
      }
      if (out) { out.append(txt.slice(last)); node.replaceWith(out); }
    });
  });

  // ---------- tooltip ----------
  let tip = null, owner = null, hideT = 0;
  const byId = Object.fromEntries(window.L24_GLOSSARY.terms.map(t => [t.id, t]));
  function show(el) {
    clearTimeout(hideT); if (owner === el && tip) return; hide(true);
    const t = byId[el.dataset.gl]; if (!t) return;
    owner = el; tip = document.createElement('div'); tip.className = 'gl-tip'; tip.setAttribute('role', 'tooltip'); tip.id = 'gl-tip';
    tip.innerHTML = `<b>${esc(t.term)}</b>${esc(t.def)}<br><a href="${base}glossary.html#${t.id}">All AI terms →</a>`;
    document.body.append(tip); el.setAttribute('aria-describedby', 'gl-tip');
    const r = el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    let x = Math.min(Math.max(12, r.left + r.width / 2 - w / 2), innerWidth - w - 12);
    let y = r.bottom + 8; if (y + h > innerHeight - 8 && r.top - h - 8 > 0) y = r.top - h - 8;
    tip.style.left = (x + scrollX) + 'px'; tip.style.top = (y + scrollY) + 'px';
    tip.addEventListener('mouseenter', () => clearTimeout(hideT)); tip.addEventListener('mouseleave', () => later());
  }
  function hide() { if (tip) tip.remove(); if (owner) owner.removeAttribute('aria-describedby'); tip = owner = null; }
  const later = () => { clearTimeout(hideT); hideT = setTimeout(hide, 220); };
  document.addEventListener('mouseover', e => { const g = e.target.closest && e.target.closest('.gl'); if (g) show(g); });
  document.addEventListener('mouseout', e => { const g = e.target.closest && e.target.closest('.gl'); if (g) later(); });
  document.addEventListener('focusin', e => { if (e.target.classList && e.target.classList.contains('gl')) show(e.target); });
  document.addEventListener('focusout', e => { if (e.target.classList && e.target.classList.contains('gl')) later(); });
  document.addEventListener('click', e => {
    const g = e.target.closest && e.target.closest('.gl');
    if (g) { e.preventDefault(); show(g); return; }
    if (tip && !tip.contains(e.target)) hide();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('gl')) { e.preventDefault(); show(e.target); } });
  addEventListener('scroll', () => { if (tip && owner) { const r = owner.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) hide(); } }, { passive: true });
})();
