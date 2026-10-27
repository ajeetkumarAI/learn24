"""Key-free stand-ins used on Learn24 so every example runs offline.
In Colab you use the real thing:  llm = ChatGroq(model="openai/gpt-oss-20b")"""
import re, math, time
from typing import Any, Iterator
from langchain_core.language_models import BaseChatModel
from langchain_core.language_models.fake_chat_models import GenericFakeChatModel
from langchain_core.messages import AIMessage, AIMessageChunk, BaseMessage
from langchain_core.outputs import ChatGeneration, ChatGenerationChunk, ChatResult
from langchain_core.embeddings import Embeddings


class RuleModel(BaseChatModel):
    """Answers by keyword: the first rule whose key appears in the last message wins.
    A reply can be text or an AIMessage (for tool calls). delay = fake network time."""
    rules: dict = {}
    default: Any = "OK."
    delay: float = 0.0

    @property
    def _llm_type(self): return "rule-model"

    def _pick(self, messages):
        last = messages[-1].content if messages else ""
        text = last if isinstance(last, str) else str(last)
        for k, v in self.rules.items():
            if k.lower() in text.lower(): return v
        return self.default

    def _generate(self, messages, stop=None, run_manager=None, **kw):
        if self.delay: time.sleep(self.delay)
        r = self._pick(messages)
        msg = r.model_copy() if isinstance(r, AIMessage) else AIMessage(content=r)
        n_in = sum(len(str(m.content).split()) for m in messages); n_out = len(str(msg.content).split())
        msg.usage_metadata = {"input_tokens": n_in, "output_tokens": n_out, "total_tokens": n_in + n_out}
        return ChatResult(generations=[ChatGeneration(message=msg)])

    def _stream(self, messages, stop=None, run_manager=None, **kw) -> Iterator[ChatGenerationChunk]:
        r = self._pick(messages)
        text = r.content if isinstance(r, AIMessage) else r
        for i, w in enumerate(re.findall(r"\S+\s*", text)):
            if run_manager: run_manager.on_llm_new_token(w)
            yield ChatGenerationChunk(message=AIMessageChunk(content=w))

    def bind_tools(self, tools, **kw): return self


class ScriptedModel(GenericFakeChatModel):
    """Replies with the given messages in order (one per call): perfect for agent loops."""
    def __init__(self, replies):
        super().__init__(messages=iter([r if isinstance(r, AIMessage) else AIMessage(content=r) for r in replies]))
    def bind_tools(self, tools, **kw): return self


def call(name, args, id="c1"):
    """Shortcut: an AIMessage that asks for one tool call."""
    return AIMessage("", tool_calls=[{"name": name, "args": args, "id": id}])


class KeywordEmbeddings(Embeddings):
    """Tiny bag-of-words embedding (no download). Real apps: HuggingFaceEmbeddings / OpenAIEmbeddings."""
    SYN = {"stolen": "lost", "took": "lost", "missing": "lost", "debit": "card", "credit": "card", "login": "password",
           "forgot": "reset", "send": "payment", "transfer": "payment", "pay": "payment", "payee": "payment",
           "person": "payee", "someone": "payee", "new": "payee", "pin": "pin", "rate": "interest", "fd": "deposit"}
    def __init__(self, dim=384): self.dim = dim
    def _vec(self, text):
        v = [0.0] * self.dim
        for w in re.findall(r"[a-z0-9]+", text.lower()):
            for t in {w[:5], self.SYN.get(w, w)[:5]}:
                v[sum(ord(c) * (i + 1) for i, c in enumerate(t)) % self.dim] += 1
        n = math.sqrt(sum(x * x for x in v)) or 1
        return [round(x / n, 4) for x in v]
    def embed_documents(self, texts): return [self._vec(t) for t in texts]
    def embed_query(self, text): return self._vec(text)
