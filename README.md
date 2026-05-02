<div align="center">

```
██████╗ ██████╗ ██╗███████╗███████╗██╗  ██╗   ██╗██████╗  ██████╗  ██████╗███████╗
██╔══██╗██╔══██╗██║██╔════╝██╔════╝██║  ╚██╗ ██╔╝██╔══██╗██╔═══██╗██╔════╝██╔════╝
██████╔╝██████╔╝██║█████╗  █████╗  ██║   ╚████╔╝ ██║  ██║██║   ██║██║     ███████╗
██╔══██╗██╔══██╗██║██╔══╝  ██╔══╝  ██║    ╚██╔╝  ██║  ██║██║   ██║██║     ╚════██║
██████╔╝██║  ██║██║███████╗██║     ███████╗██║   ██████╔╝╚██████╔╝╚██████╗███████║
╚═════╝ ╚═╝  ╚═╝╚═╝╚══════╝╚═╝     ╚══════╝╚═╝   ╚═════╝  ╚═════╝  ╚═════╝╚══════╝
```

**Drop a document. Get intelligence.**

[![Built with React](https://img.shields.io/badge/Built%20with-React-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Gemini%202.5%20Pro-4285F4?style=flat-square&logo=google)](https://aistudio.google.com)
[![Styled with Tailwind](https://img.shields.io/badge/Styled%20with-Tailwind%20CSS-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-00D4FF?style=flat-square)](LICENSE)

</div>

---

## What is BrieflyDocs?

BrieflyDocs is a **Document Intelligence Agent** that transforms any uploaded document — PDF, image, or plain text — into structured, actionable metadata in seconds. No more manually skimming 30-page reports. Drop it in, get the signal, move on.

Under the hood it uses a large-context AI model (no chunking, no RAG) to read the entire document at once, preserving nuance that traditional extraction pipelines miss.

---

## Features

| Feature | Description |
|---|---|
| 📄 **Multi-format Upload** | Accepts PDF, PNG, JPG, and plain text files |
| 🧠 **Executive Summary** | 3–5 sentence "So What?" distillation of the document |
| 🏷️ **Auto-Tagging** | Classifies documents into: Education, Fun, Technical, Legal, Financial, Personal |
| 🎭 **Tone Detection** | Identifies the document's underlying tone (Formal, Satirical, Urgent, etc.) |
| 🔍 **Entity Extraction** | Surfaces the top 5 people, organizations, and dates mentioned |
| 📊 **Confidence Scoring** | Returns a 0.0–1.0 confidence score on the classification |
| 📤 **JSON Export** | One-click export of the full analysis as a structured JSON file |
| ⚡ **Full-context Analysis** | Leverages 1M+ token context — the whole document, not chunks |

---

## Demo

> **Input:** `Ajiboye_TechCV-2.pdf` (0.37 MB)

```json
{
  "document_analysis": {
    "title": "Ajiboye Toluwalase - Machine Learning and AI Engineer Resume",
    "summary": "Ajiboye Toluwalase is a certified ML and AI Engineer with 2 years of
                experience transforming raw data into deployed APIs. His portfolio
                includes a full-stack healthcare prediction platform, an LLM-powered
                conversational agent, and a cybersecurity log analysis tool.",
    "primary_tag": "Technical",
    "secondary_tags": ["Machine Learning", "AI", "MLOps", "Resume", "Engineering"],
    "tone": "Professional",
    "key_entities": [
      { "name": "Ajiboye Toluwalase", "type": "Person" },
      { "name": "Microsoft", "type": "Organization" },
      { "name": "Federal University Oye-Ekiti", "type": "Organization" },
      { "name": "Data Science Nigeria", "type": "Organization" },
      { "name": "Google", "type": "Organization" }
    ],
    "word_count_estimate": 520,
    "confidence_score": 0.980
  }
}
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Google AI Studio API key → [Get one here](https://aistudio.google.com/app/apikey)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/brieflydocs.git
cd brieflydocs

# Install dependencies
npm install

# Add your API key
cp .env.example .env
# Edit .env and add: VITE_GEMINI_API_KEY=your_key_here

# Start the dev server
npm run dev
```

App will be running at `http://localhost:5173`

---

## How It Works

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  User drops │     │  BrieflyDocs     │     │  Gemini 2.5 Pro     │
│  a document │────▶│  encodes file +  │────▶│  reads full doc,    │
│  (PDF/Image │     │  builds prompt   │     │  returns strict     │
│  /Text)     │     │                  │     │  JSON metadata      │
└─────────────┘     └──────────────────┘     └─────────────────────┘
                                                        │
                    ┌──────────────────┐                │
                    │  UI renders      │◀───────────────┘
                    │  summary, tags,  │
                    │  entities, score │
                    └──────────────────┘
```

The system prompt instructs the model to return a **strict JSON schema** with no conversational filler, ensuring the UI can parse and render results reliably every time.

---

## Project Structure

```
brieflydocs/
├── src/
│   ├── components/
│   │   ├── DocumentPanel.jsx     # Left panel — upload + metadata
│   │   ├── AnalysisPanel.jsx     # Right panel — summary, tags, entities
│   │   ├── ConfidenceGauge.jsx   # SVG arc gauge for confidence score
│   │   ├── EntityChip.jsx        # Typed entity chips (Person/Org/Date)
│   │   └── TagBadge.jsx          # Primary + secondary tag components
│   ├── lib/
│   │   ├── gemini.js             # API call + prompt construction
│   │   └── parseResponse.js      # JSON extraction + validation
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── index.html
└── package.json
```

---

## The Prompt

BrieflyDocs is powered by a carefully engineered system prompt that you can find and customize in `src/lib/gemini.js`. Key design decisions:

- **No chunking instruction** — explicitly tells the model to analyze the full document in one pass
- **Strict JSON schema** — returns raw JSON with no markdown fences or prose
- **Typed entity extraction** — classifies each entity as Person, Organization, or Date
- **Confidence scoring** — lower scores surface when the document is ambiguous or multi-domain
- **Visual document fallback** — for infographics or image-only PDFs, the model describes visual data in the summary field

---

## Roadmap

- [ ] Batch document processing (analyze multiple files at once)
- [ ] Comparison mode (diff two documents side by side)
- [ ] Custom tag taxonomy (bring your own classification labels)
- [ ] Export to Notion / Google Docs
- [ ] Chat with your document after analysis
- [ ] History panel with past analyses (localStorage)

---

## Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes, then
git commit -m "feat: describe your change"
git push origin feature/your-feature-name
```

---

## License

MIT © [Ajiboye Toluwalase](https://github.com/yourusername)

---

<div align="center">

Built with curiosity in Ibadan 🇳🇬

*If this saved you time, give it a ⭐*

</div>
