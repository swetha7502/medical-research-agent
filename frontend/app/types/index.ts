export interface Source {
  title: string;
  source: "pubmed" | "arxiv";
  year: string;
  url: string;
}

export interface AgentStep {
  agent: string;
  thought: string;
  action: string;
  result: string;
}

export interface ResearchResult {
  question: string;
  final_answer: string;
  sources: Source[];
  agent_steps: AgentStep[];
}
