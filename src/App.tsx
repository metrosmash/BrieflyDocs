import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, FileText, Loader2, Tag, Layout, Users, Type as TypeIcon, FilePlus, RefreshCcw } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const BrieflyDocsLogo = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="70" cy="30" r="25" fill="#5b64f5" />
    <circle cx="70" cy="70" r="25" fill="#14b8a6" />
    
    <path d="M15 15 C15 10, 19 6, 24 6 L65 6 L85 26 L85 85 C85 90, 81 94, 76 94 L24 94 C19 94, 15 90, 15 85 Z" fill="white" />
    <path d="M15 15 C15 10, 19 6, 24 6 L65 6 L85 26 L85 85 C85 90, 81 94, 76 94 L24 94 C19 94, 15 90, 15 85 Z" fill="url(#docGradient)" />

    <defs>
      <linearGradient id="docGradient" x1="15" y1="6" x2="85" y2="94" gradientUnits="userSpaceOnUse">
         <stop stopColor="white" />
         <stop offset="1" stopColor="#f8fafc" />
      </linearGradient>
    </defs>
    
    <path d="M65 6 L65 20 C65 23.313 67.686 26 71 26 L85 26 Z" fill="#e2e8f0" />
    
    <rect x="25" y="24" width="20" height="4" rx="2" fill="#0f172a" />
    <rect x="25" y="34" width="40" height="4" rx="2" fill="#0f172a" />
    
    <rect x="25" y="46" width="35" height="3" rx="1.5" fill="#cbd5e1" />
    <rect x="25" y="54" width="35" height="3" rx="1.5" fill="#cbd5e1" />
    
    <path d="M25 66 L38 66 L44 71 L38 76 L25 76 C23.895 76 23 75.105 23 74 L23 68 C23 66.895 23.895 66 25 66 Z" fill="#5b64f5" />
    <circle cx="28" cy="71" r="1.5" fill="white" />
    <rect x="50" y="69.5" width="20" height="3" rx="1.5" fill="#cbd5e1" />

    <path d="M25 82 L38 82 L44 87 L38 92 L25 92 C23.895 92 23 91.105 23 90 L23 84 C23 82.895 23.895 82 25 82 Z" fill="#14b8a6" />
    <circle cx="28" cy="87" r="1.5" fill="white" />
    <rect x="50" y="85.5" width="20" height="3" rx="1.5" fill="#cbd5e1" />
  </svg>
);

const PROMPT = `You are a Professional Document Intelligence Agent specializing in high-speed summarization and semantic classification. Your goal is to process long-form documents and provide structured, actionable metadata.

# CONTEXT
The user will provide a document (PDF, Text, or Image). You have a 1M+ token context window; do not chunk the data. Analyze the document in its entirety to capture global context and subtle nuances that traditional RAG systems might miss.

# TASK
1. **Executive Summary**: Create a concise, high-impact summary (max 3-5 sentences). Focus on the "So What?" of the document.
2. **Auto-Tagging**: Categorize the document based on the following criteria: [Education, Fun, Technical, Legal, Financial, Personal]. 
3. **Sentiment & Tone**: Identify the underlying tone (e.g., Formal, Satirical, Urgent).
4. **Key Entities**: Extract the top 5 most important people, dates, or organizations mentioned.

# CONSTRAINTS
- If the document is purely visual (e.g., an infographic), describe the visual data as part of the summary.
- If the document is ambiguous, choose the closest matching tag and provide a lower confidence_score.
- Maintain professional objectivity.`;

interface DocumentAnalysis {
  title: string;
  summary: string;
  primary_tag: string;
  secondary_tags: string[];
  tone: string;
  key_entities: string[];
  word_count_estimate: number;
  confidence_score: number;
}

export default function App() {
  const [isHovering, setIsHovering] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsHovering(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsHovering(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsHovering(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setSelectedFile(file);
    setIsLoading(true);
    setAnalysis(null);
    setError(null);

    try {
      let contentPart: any;

      if (file.type.startsWith('text/')) {
        const text = await file.text();
        contentPart = { text };
      } else {
        const base64Data = await convertFileToBase64(file);
        contentPart = {
          inlineData: {
            mimeType: file.type,
            data: base64Data,
          },
        };
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [
          { text: PROMPT },
          contentPart
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              document_analysis: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  primary_tag: { type: Type.STRING },
                  secondary_tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  tone: { type: Type.STRING },
                  key_entities: { type: Type.ARRAY, items: { type: Type.STRING } },
                  word_count_estimate: { type: Type.INTEGER },
                  confidence_score: { type: Type.NUMBER }
                },
                required: ["title", "summary", "primary_tag", "secondary_tags", "tone", "key_entities", "word_count_estimate", "confidence_score"]
              }
            },
            required: ["document_analysis"]
          }
        }
      });

      const textOutput = response.text;
      if (!textOutput) throw new Error("No response generated.");

      const parsedData = JSON.parse(textOutput);
      setAnalysis(parsedData.document_analysis);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while analyzing the document.");
    } finally {
      setIsLoading(false);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip out the data URL prefix (e.g., "data:image/png;base64,")
        const base64String = result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const reset = () => {
    setSelectedFile(null);
    setAnalysis(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-3">
          <BrieflyDocsLogo className="w-10 h-10 drop-shadow-sm" />
          <span className="font-bold text-2xl tracking-tight text-[#0f172a]">Briefly<span className="text-teal-500 font-normal">Docs</span></span>
        </div>
        <div className="flex items-center space-x-4 text-sm font-medium text-slate-500">
          <span className="text-emerald-600 flex items-center">
            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span> Systems Online
          </span>
        </div>
      </header>

      <main className="flex-1 p-8 w-full max-w-7xl mx-auto flex flex-col">
        {/* Upload Zone (Show if no file is selected) */}
        {!selectedFile && (
          <div className="max-w-3xl mx-auto w-full mt-12">
            <div className="mb-8 text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Document Intelligence</h1>
              <p className="text-slate-500 text-lg">High-speed document summarization and semantic classification.</p>
            </div>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer border-2 border-dashed rounded-xl p-16 flex flex-col items-center justify-center transition-all bg-white relative overflow-hidden group
                ${isHovering ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md'}`}
            >
              <div className="absolute inset-0 bg-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex flex-col items-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-900">Upload a document</p>
                  <p className="text-slate-500 text-sm mt-1">Images, PDFs, or Text files (Drag & drop)</p>
                </div>
              </div>
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.json,.csv"
              />
            </div>
          </div>
        )}

        {/* Loading / Error States */}
        {selectedFile && (isLoading || error) && (
          <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-4 max-w-3xl mx-auto w-full mt-12">
            {isLoading ? (
              <>
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <div>
                  <p className="text-lg font-bold text-slate-900">Analyzing {selectedFile.name}...</p>
                  <p className="text-slate-500 text-sm mt-1">Extracting intelligence metadata via Semantic Engine</p>
                </div>
              </>
            ) : error ? (
              <>
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-2 border border-red-100">
                  <FilePlus className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">Analysis Failed</p>
                  <p className="text-red-600 text-sm mt-1 max-w-md mx-auto">{error}</p>
                </div>
                <button onClick={reset} className="mt-4 px-6 py-2 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 rounded text-sm font-bold transition-colors">
                  TRY AGAIN
                </button>
              </>
            ) : null}
          </div>
        )}

        {/* Results */}
        {analysis && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full w-full">
            
            {/* Left Sidebar (Col 4) */}
            <div className="lg:col-span-4 flex flex-col space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded border border-blue-100 uppercase">
                    Source: {selectedFile?.name.split('.').pop()}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex justify-between items-center">
                  Document Source
                  <button onClick={reset} className="text-slate-400 hover:text-slate-700 transition-colors" title="Upload new file">
                    <RefreshCcw className="w-4 h-4" />
                  </button>
                </h3>
                
                <div className="space-y-4">
                  <div className="border border-slate-100 rounded p-4 bg-slate-50 opacity-60">
                    <div className="h-3 bg-slate-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-5/6 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-4/5 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                  </div>
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-sm font-semibold text-slate-800 break-all">{selectedFile?.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{(selectedFile!.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Metadata</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Word Count</p>
                    <p className="text-xl font-mono font-bold">{analysis.word_count_estimate.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Confidence Score</p>
                    <p className={`text-xl font-mono font-bold ${analysis.confidence_score > 0.8 ? 'text-emerald-600' : analysis.confidence_score > 0.5 ? 'text-amber-500' : 'text-red-500'}`}>
                      {analysis.confidence_score.toFixed(3)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Raw JSON Toggle (Optional utility) */}
              <details className="group border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
                 <summary className="p-4 cursor-pointer text-xs font-bold text-slate-400 uppercase tracking-widest hover:bg-slate-50 flex items-center justify-between transition-colors">
                   <span>View Raw JSON Output</span>
                   <span className="group-open:rotate-180 transition-transform">▼</span>
                 </summary>
                 <div className="p-4 bg-slate-900 border-t border-slate-200 overflow-x-auto">
                   <pre className="text-xs text-blue-400 font-mono">
                     {JSON.stringify({ document_analysis: analysis }, null, 2)}
                   </pre>
                 </div>
              </details>
            </div>

            {/* Right Main Content (Col 8) */}
            <div className="lg:col-span-8 flex flex-col space-y-6">
              
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8">
                
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                      {analysis.title || "Document Analysis Report"}
                    </h1>
                    <div className="flex flex-wrap items-center mt-3 gap-2">
                      <span className="px-2.5 py-1 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider rounded">
                        {analysis.primary_tag}
                      </span>
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-200">
                        {analysis.tone} Tone
                      </span>
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center" onClick={() => {
                     const blob = new Blob([JSON.stringify(analysis, null, 2)], {type: 'application/json'});
                     const url = URL.createObjectURL(blob);
                     const a = document.createElement('a');
                     a.href = url;
                     a.download = `analysis_${analysis.title.replace(/\s+/g, '_')}.json`;
                     a.click();
                  }}>
                    <FilePlus className="w-4 h-4 mr-1" />
                    Export JSON
                  </button>
                </div>

                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-6 mb-8">
                  <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-3">Executive Summary</h3>
                  <p className="text-slate-700 leading-relaxed">
                    {analysis.summary}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <section>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Key Entities</h3>
                    {analysis.key_entities && analysis.key_entities.length > 0 ? (
                      <ul className="space-y-3">
                        {analysis.key_entities.map((entity, i) => (
                          <li key={i} className="flex items-center text-sm font-medium text-slate-700">
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3 shrink-0"></span> {entity}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500 italic">No key entities detected.</p>
                    )}
                  </section>
                  
                  <section>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Secondary Tags</h3>
                    {analysis.secondary_tags && analysis.secondary_tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {analysis.secondary_tags.map((tag, i) => (
                          <span key={i} className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded text-xs font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic">No secondary tags detected.</p>
                    )}
                  </section>
                </div>

              </div>
            </div>

          </div>
        )}

      </main>
      
      <footer className="px-8 py-3 bg-white border-t border-slate-200 flex justify-between items-center text-[10px] uppercase tracking-widest font-bold text-slate-400 shrink-0">
        <span>Processing Engine: Semantic-V4-Pro</span>
        <span>Session ID: DOC-INT-{(Math.random() * 1000).toFixed(0).padStart(3, '0')}-{(Math.random() * 100).toFixed(0).padStart(2, '0')}-X</span>
      </footer>
    </div>
  );
}
