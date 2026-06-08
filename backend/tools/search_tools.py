"""
Four tools available to the agents:
  search_pubmed    — searches PubMed (peer-reviewed clinical papers)
  search_arxiv     — searches arXiv (preprints / AI-in-health papers)
  embed_and_store  — embeds papers into ChromaDB vector store
  retrieve_context — semantic search over stored papers
"""

import os
from typing import Annotated
from Bio import Entrez
import arxiv as arxiv_lib
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma
from langchain.schema import Document
from langchain_core.tools import tool

# ── Vector store (singleton) ─────────────────────────────────────────────────
from langchain_openai import OpenAIEmbeddings
_embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
_vectorstore = Chroma(
    collection_name="research_papers",
    persist_directory="./chroma_db",
    embedding_function=_embeddings,
)

Entrez.email = os.getenv("NCBI_EMAIL", "agent@research.ai")


# ── PubMed ────────────────────────────────────────────────────────────────────
@tool
def search_pubmed(
    query: Annotated[str, "Clinical or medical search query"],
    max_results: int = 5,
) -> list[dict]:
    """Search PubMed for peer-reviewed medical literature. Returns list of paper dicts."""
    try:
        handle = Entrez.esearch(db="pubmed", term=query, retmax=max_results)
        record = Entrez.read(handle)
        handle.close()
        ids = record["IdList"]
        if not ids:
            return []

        handle = Entrez.efetch(db="pubmed", id=",".join(ids), rettype="xml", retmode="xml")
        records = Entrez.read(handle)
        handle.close()

        papers = []
        for article in records["PubmedArticle"]:
            try:
                med = article["MedlineCitation"]
                art = med["Article"]
                title = str(art.get("ArticleTitle", "No title"))
                abstract_texts = art.get("Abstract", {}).get("AbstractText", ["No abstract available"])
                abstract = " ".join(str(t) for t in abstract_texts)
                pub_date = art.get("Journal", {}).get("JournalIssue", {}).get("PubDate", {})
                year = str(pub_date.get("Year", pub_date.get("MedlineDate", "Unknown")))[:4]
                pmid = str(med["PMID"])
                papers.append({
                    "source": "pubmed",
                    "id": pmid,
                    "title": title,
                    "abstract": abstract,
                    "year": year,
                    "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
                })
            except Exception:
                continue
        return papers
    except Exception as e:
        return [{"error": str(e), "source": "pubmed"}]


# ── arXiv ─────────────────────────────────────────────────────────────────────
@tool
def search_arxiv(
    query: Annotated[str, "Research query for arXiv (biomedical, AI in health, etc.)"],
    max_results: int = 5,
) -> list[dict]:
    """Search arXiv for preprints in medicine, biology, or AI-in-health."""
    try:
        client = arxiv_lib.Client()
        search = arxiv_lib.Search(
            query=query,
            max_results=max_results,
            sort_by=arxiv_lib.SortCriterion.Relevance,
        )
        papers = []
        for result in client.results(search):
            papers.append({
                "source": "arxiv",
                "id": result.entry_id.split("/")[-1],
                "title": result.title,
                "abstract": result.summary,
                "year": str(result.published.year),
                "url": result.entry_id,
                "authors": [a.name for a in result.authors[:3]],
            })
        return papers
    except Exception as e:
        return [{"error": str(e), "source": "arxiv"}]


# ── ChromaDB ──────────────────────────────────────────────────────────────────
@tool
def embed_and_store(
    papers: Annotated[list[dict], "List of paper dicts from search_pubmed or search_arxiv"],
) -> str:
    """Embed papers into ChromaDB for semantic retrieval. Returns count stored."""
    docs = []
    for p in papers:
        if "error" in p:
            continue
        docs.append(Document(
            page_content=f"{p['title']}\n\n{p.get('abstract', '')}",
            metadata={k: v for k, v in p.items() if k not in ("abstract", "authors")},
        ))
    if docs:
        _vectorstore.add_documents(docs)
    return f"Stored {len(docs)} papers in ChromaDB."


@tool
def retrieve_context(
    query: Annotated[str, "Semantic search query to find relevant cached papers"],
    k: int = 4,
) -> list[dict]:
    """Retrieve the most semantically similar papers from ChromaDB."""
    results = _vectorstore.similarity_search(query, k=k)
    return [{"content": doc.page_content, "metadata": doc.metadata} for doc in results]
