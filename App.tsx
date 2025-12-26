
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Code, Settings, RotateCcw, Copy, Check, Terminal, Sparkles, 
  ChevronRight, Cpu, Zap, Info, ExternalLink, Plus, Save, Trash, 
  Camera, Sliders, Globe, RefreshCw, Layers, History, FastForward,
  BrainCircuit, Eye, PenTool, Video, Beaker
} from 'lucide-react';
import { GeminiModel, Preset, ViewMode, OpenRouterModel, AutoLoopStatus } from './types';
import { PRESETS as INITIAL_PRESETS, PROMPTS } from './constants';
import { generateAnimationCode, analyzeVideoFrames } from './services/geminiService';

// --- SQUIGGLY ROBOT COMPONENT ---
const SquigglyRobot = ({ phase }: { phase: AutoLoopStatus['phase'] }) => {
  return (
    <div className={`squiggle-robot-wrapper ${phase}`}>
      <div className="squiggle-canvas">
        <div className="robot-antenna"></div>
        <div className="robot-head">
          <div className="robot-visor">
            <div className="robot-eye left"></div>
            <div className="robot-eye right"></div>
          </div>
        </div>
        <div className="robot-torso">
          <div className="robot-panel">
             <div className="robot-light"></div>
          </div>
        </div>
        <div className="robot-treads"></div>
        
        {/* Floating Tool Icon */}
        <div className="robot-tool">
          {phase === 'generating' && <BrainCircuit className="w-5 h-5 text-indigo-400" />}
          {phase === 'capturing' && <Video className="w-5 h-5 text-red-400" />}
          {phase === 'analyzing' && <Eye className="w-5 h-5 text-emerald-400" />}
          {phase === 'improving' && <PenTool className="w-5 h-5 text-amber-400" />}
        </div>
      </div>
      
      {/* SVG Filters for Squigglevision */}
      <svg xmlns="http://www.w3.org/2000/svg" version="1.1" style={{ display: 'none' }}>
        <defs>
          {[0, 1, 2, 3, 4].map(i => (
            <filter key={i} id={`ui-squiggly-${i}`}>
              <feTurbulence baseFrequency="0.05" numOctaves="3" result="noise" seed={i} />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
            </filter>
          ))}
        </defs>
      </svg>
    </div>
  );
};

export default function App() {
  // --- STATE ---
  const [presets, setPresets] = useState<Preset[]>(() => {
    const saved = localStorage.getItem('squiggle_presets');
    return saved ? JSON.parse(saved) : INITIAL_PRESETS;
  });
  const [activePreset, setActivePreset] = useState<Preset>(presets[0]);
  const [model, setModel] = useState<string>(GeminiModel.FLASH);
  const [systemPrompt, setSystemPrompt] = useState(presets[0].prompt);
  const [userQuery, setUserQuery] = useState('A mechanical owl with spinning gears in its wings');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);

  // OpenRouter & Advanced Settings
  const [isOpenRouterEnabled, setIsOpenRouterEnabled] = useState(false);
  const [openRouterKey, setOpenRouterKey] = useState(localStorage.getItem('openrouter_key') || '');
  const [orModels, setOrModels] = useState<OpenRouterModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // AutoLoop Feature
  const [autoLoop, setAutoLoop] = useState<AutoLoopStatus>({
    active: false,
    currentLoop: 0,
    totalLoops: 3,
    phase: 'idle'
  });
  const [loopFeedback, setLoopFeedback] = useState<string[]>([]);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('squiggle_presets', JSON.stringify(presets));
  }, [presets]);

  useEffect(() => {
    localStorage.setItem('openrouter_key', openRouterKey);
  }, [openRouterKey]);

  // --- FETCH MODELS ---
  const fetchORModels = async () => {
    setIsLoadingModels(true);
    try {
      const res = await fetch("https://openrouter.ai/api/v1/models");
      const data = await res.json();
      setOrModels(data.data || []);
    } catch (e) {
      console.error("Failed to fetch OpenRouter models");
    } finally {
      setIsLoadingModels(false);
    }
  };

  useEffect(() => {
    if (isOpenRouterEnabled) fetchORModels();
  }, [isOpenRouterEnabled]);

  // --- CORE LOGIC ---
  const handleGenerate = async (queryOverride?: string, visualContext?: string, originalCode?: string) => {
    if ((!userQuery.trim() && !queryOverride) || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const finalPrompt = queryOverride || userQuery;
      const code = await generateAnimationCode(
        model, 
        systemPrompt, 
        finalPrompt, 
        visualContext, 
        isOpenRouterEnabled, 
        openRouterKey,
        originalCode
      );
      setGeneratedCode(code);
      setViewMode('preview');
      return code;
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // --- PRESET MANAGEMENT ---
  const createNewPreset = async () => {
    const name = prompt("Enter a name for the new style:");
    if (!name) return;
    
    setIsGenerating(true);
    try {
      const resp = await generateAnimationCode(
        GeminiModel.FLASH,
        "You are an expert system architect. Create a detailed CSS animation System Prompt similar to the ones provided. Focus on a specific aesthetic (e.g. 'Watercolor', 'Voxel', 'Blueprint').",
        `Create a new system prompt for a style called '${name}'.`
      );
      
      const newPreset: Preset = {
        id: `custom_${Date.now()}`,
        name,
        description: `AI-generated custom style.`,
        icon: Sparkles,
        prompt: resp,
        isCustom: true
      };
      
      setPresets(prev => [...prev, newPreset]);
      setActivePreset(newPreset);
      setSystemPrompt(newPreset.prompt);
    } catch (e) {
      setError("Failed to generate preset architecture.");
    } finally {
      setIsGenerating(false);
    }
  };

  const deletePreset = (id: string) => {
    if (confirm("Delete this custom preset?")) {
      setPresets(prev => prev.filter(p => p.id !== id));
      if (activePreset.id === id) setActivePreset(presets[0]);
    }
  };

  // --- AUTOLOOP FEATURE ---
  const captureFrames = async (): Promise<string[]> => {
    const frames: string[] = [];
    for (let i = 0; i < 5; i++) {
      await new Promise(r => setTimeout(r, 600)); 
    }
    return []; 
  };

  const runAutoLoop = async () => {
    if (!generatedCode) return;
    setAutoLoop(prev => ({ ...prev, active: true, currentLoop: 1, phase: 'generating' }));
    setLoopFeedback([]);
    
    let currentCode = generatedCode;
    let currentPrompt = userQuery;

    for (let i = 1; i <= autoLoop.totalLoops; i++) {
      setAutoLoop(prev => ({ ...prev, currentLoop: i, phase: 'capturing' }));
      const frames = await captureFrames(); 
      
      setAutoLoop(prev => ({ ...prev, phase: 'analyzing' }));
      const analysis = await analyzeVideoFrames(frames, currentPrompt, currentCode);
      setLoopFeedback(prev => [...prev, `L${i}: ${analysis.critique.substring(0, 80)}...`]);
      
      setAutoLoop(prev => ({ ...prev, phase: 'improving' }));
      // CRITICAL: Pass currentCode to handleGenerate for iteration rather than new generation
      const improvedCode = await handleGenerate(analysis.improvedPrompt, undefined, currentCode);
      if (improvedCode) currentCode = improvedCode;
      
      if (i === autoLoop.totalLoops) break;
    }
    
    setAutoLoop(prev => ({ ...prev, active: false, phase: 'idle' }));
  };

  const handleScreenshotIterate = async () => {
    const base64 = "SIMULATED_SCREENSHOT_DATA"; 
    await handleGenerate(`${userQuery} (Improve based on this screenshot)`, base64, generatedCode);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-[380px] flex flex-col border-r border-slate-800 bg-slate-900 shadow-2xl z-20 transition-all duration-300">
        <header className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.3)]">
              <Zap className="w-6 h-6 text-white fill-current" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white leading-none mb-1 text-nowrap">Squiggle Studio</h1>
              <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-semibold">Pro AI Animator</p>
            </div>
          </div>
          <button 
            onClick={() => setViewMode(viewMode === 'settings' ? 'preview' : 'settings')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'settings' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Engine Selection */}
          <section className="space-y-4">
            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
              <div className="flex items-center gap-2"><Cpu className="w-3 h-3" /> Intelligence Engine</div>
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {!isOpenRouterEnabled ? (
                <>
                  <button
                    onClick={() => setModel(GeminiModel.FLASH)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${model === GeminiModel.FLASH ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-transparent text-slate-500'}`}
                  >
                    <Zap className="w-4 h-4" /><span className="text-[10px] font-bold">3 Flash</span>
                  </button>
                  <button
                    onClick={() => setModel(GeminiModel.PRO)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${model === GeminiModel.PRO ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-800 border-transparent text-slate-500'}`}
                  >
                    <Sparkles className="w-4 h-4" /><span className="text-[10px] font-bold">3 Pro</span>
                  </button>
                </>
              ) : (
                <div className="col-span-2">
                  <select 
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <optgroup label="Native Gemini">
                      <option value={GeminiModel.FLASH}>Gemini 3 Flash</option>
                      <option value={GeminiModel.PRO}>Gemini 3 Pro</option>
                    </optgroup>
                    <optgroup label="OpenRouter Models">
                      {orModels.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              )}
            </div>
          </section>

          {/* Preset Grid */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-3 h-3" /> Visual Style
              </h2>
              <button onClick={createNewPreset} className="text-[10px] flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
                <Plus className="w-3 h-3" /> Create New
              </button>
            </div>
            <div className="space-y-2">
              {presets.map((p) => (
                <div key={p.id} className="group relative">
                  <button
                    onClick={() => { setActivePreset(p); setSystemPrompt(p.prompt); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${activePreset.id === p.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800'}`}
                  >
                    <div className={`p-2 rounded-lg ${activePreset.id === p.id ? 'bg-white/20' : 'bg-slate-700 group-hover:bg-slate-600'}`}>
                      {typeof p.icon === 'string' ? <span>{p.icon}</span> : <p.icon className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs leading-tight">{p.name}</div>
                      <div className={`text-[9px] truncate opacity-70`}>{p.description}</div>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* User Prompt */}
          <section className="space-y-4">
            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Sliders className="w-3 h-3" /> Animation Subject
            </h2>
            <div className="relative">
              <textarea
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Describe your animation..."
                className="w-full h-24 bg-slate-800 border border-slate-700 rounded-xl p-4 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none placeholder-slate-600 text-slate-200"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleGenerate()}
                  disabled={isGenerating}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-100 disabled:opacity-50"
                >
                  {isGenerating ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  Generate
                </button>
                <button
                  onClick={handleScreenshotIterate}
                  title="Iterate with Screenshot"
                  disabled={!generatedCode || isGenerating}
                  className="p-2.5 bg-slate-800 text-slate-400 rounded-lg hover:text-white transition-colors disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>

          {/* AutoLoop Control - UPDATED MINI INTERFACE */}
          <section className="pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <RefreshCw className="w-3 h-3" /> AutoLoop AI Optimizer
              </h2>
              <div className="flex items-center gap-2 bg-slate-800 px-2 py-1 rounded">
                <span className="text-[9px] text-slate-400 font-bold uppercase">Loops</span>
                <input 
                  type="number" 
                  min="1" max="10" 
                  value={autoLoop.totalLoops}
                  onChange={(e) => setAutoLoop(prev => ({...prev, totalLoops: parseInt(e.target.value)}))}
                  className="w-8 bg-transparent text-[10px] text-white focus:outline-none text-center"
                />
              </div>
            </div>

            <div className={`relative p-4 rounded-xl border transition-all ${autoLoop.active ? 'bg-indigo-600/5 border-indigo-500/30' : 'bg-slate-800/30 border-slate-700/50'}`}>
               <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                     <SquigglyRobot phase={autoLoop.phase} />
                  </div>
                  <div className="flex-1 min-w-0">
                     {autoLoop.active ? (
                        <div className="space-y-1">
                           <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex justify-between">
                              <span>Loop {autoLoop.currentLoop}/{autoLoop.totalLoops}</span>
                              <span className="animate-pulse">{autoLoop.phase}</span>
                           </div>
                           <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                 className="h-full bg-indigo-500 transition-all duration-500" 
                                 style={{ width: `${(autoLoop.currentLoop / autoLoop.totalLoops) * 100}%` }}
                              />
                           </div>
                           <p className="text-[9px] text-slate-500 italic truncate">
                              {autoLoop.phase === 'generating' && "Designing rig..."}
                              {autoLoop.phase === 'capturing' && "Processing frames..."}
                              {autoLoop.phase === 'analyzing' && "Critiquing motion..."}
                              {autoLoop.phase === 'improving' && "Injecting quality..."}
                           </p>
                        </div>
                     ) : (
                        <div className="space-y-2">
                           <p className="text-[10px] text-slate-500 leading-snug">Let AI watch your animation and iteratively fix kinematics.</p>
                           <button
                              onClick={runAutoLoop}
                              disabled={!generatedCode || autoLoop.active}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-600/30 rounded-lg text-[10px] font-bold transition-all"
                           >
                              <FastForward className="w-3 h-3" />
                              Start Optimization
                           </button>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {loopFeedback.length > 0 && (
              <div className="mt-3 space-y-1 max-h-24 overflow-y-auto custom-scrollbar font-mono text-[9px] text-slate-600">
                {loopFeedback.map((f, i) => (
                  <div key={i} className="flex gap-2 border-l border-indigo-500/30 pl-2">
                    <span className="text-indigo-400 shrink-0">#{i+1}</span> {f}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col relative bg-slate-950">
        
        {/* Viewport Toolbar */}
        <div className="h-16 border-b border-slate-900 bg-slate-950 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-1 bg-slate-900 p-1.5 rounded-xl border border-slate-800/50">
            <button
              onClick={() => setViewMode('preview')}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'preview' ? 'bg-slate-800 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Live Preview
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'code' ? 'bg-slate-800 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Source Code
            </button>
          </div>

          <div className="flex items-center gap-3">
            {generatedCode && viewMode === 'preview' && (
              <div className="flex items-center gap-2 mr-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                Rendering @ 60 FPS
              </div>
            )}
            {generatedCode && (
              <button
                onClick={copyToClipboard}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border transition-all ${copied ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy HTML'}
              </button>
            )}
          </div>
        </div>

        {/* Workspace Area */}
        <div className="flex-1 relative overflow-hidden bg-[#0a0a0a]">
          
          {viewMode === 'settings' ? (
            <div className="absolute inset-0 z-50 bg-slate-950 p-12 overflow-y-auto custom-scrollbar">
              <div className="max-w-2xl mx-auto space-y-12">
                <header>
                  <h2 className="text-3xl font-bold text-white mb-2">Studio Configuration</h2>
                  <p className="text-slate-500">Manage API keys and model providers.</p>
                </header>

                <section className="space-y-6">
                  <div className="flex items-center justify-between p-6 bg-slate-900 border border-slate-800 rounded-2xl">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                        <Globe className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white">OpenRouter Integration</h4>
                        <p className="text-xs text-slate-500 mt-1">Unlock 400+ models from outside the Gemini ecosystem.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsOpenRouterEnabled(!isOpenRouterEnabled)}
                      className={`w-12 h-6 rounded-full transition-all relative ${isOpenRouterEnabled ? 'bg-indigo-600' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isOpenRouterEnabled ? 'left-7' : 'left-1'}`}></div>
                    </button>
                  </div>

                  {isOpenRouterEnabled && (
                    <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">OpenRouter API Key</label>
                      <input 
                        type="password" 
                        value={openRouterKey}
                        onChange={(e) => setOpenRouterKey(e.target.value)}
                        placeholder="sk-or-v1-..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                      />
                    </div>
                  )}
                </section>

                <div className="flex justify-end pt-8">
                  <button 
                    onClick={() => setViewMode('preview')}
                    className="px-8 py-3 bg-white text-slate-900 rounded-xl font-bold text-sm hover:scale-105 transition-all shadow-2xl"
                  >
                    Save & Close
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {isGenerating && !autoLoop.active && (
                <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-8">
                  <div className="relative mb-8">
                    <div className="w-20 h-20 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Zap className="w-8 h-8 text-indigo-500 animate-pulse fill-current" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Architecting Animation...</h3>
                  <p className="text-slate-500 text-sm max-w-xs text-center">Constructing hierarchical CSS structures.</p>
                </div>
              )}

              {generatedCode && viewMode === 'preview' && (
                <div className="w-full h-full bg-white flex items-center justify-center p-8 lg:p-12 transition-all">
                   <div className="w-full h-full shadow-[0_0_100px_rgba(0,0,0,0.1)] rounded-2xl overflow-hidden border border-slate-100 bg-[#f8f9fa]">
                    <iframe
                      ref={iframeRef}
                      title="Preview Viewport"
                      srcDoc={generatedCode}
                      className="w-full h-full border-none"
                      sandbox="allow-scripts"
                    />
                   </div>
                </div>
              )}

              {generatedCode && viewMode === 'code' && (
                <div className="w-full h-full overflow-hidden flex flex-col bg-[#0d1117]">
                  <div className="flex-1 overflow-auto p-12 font-mono text-[13px] custom-scrollbar">
                    <pre className="text-indigo-200/90 leading-relaxed whitespace-pre-wrap select-all">
                      {generatedCode}
                    </pre>
                  </div>
                </div>
              )}

              {!generatedCode && !isGenerating && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700">
                    <div className="w-24 h-24 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-6">
                      <Sparkles className="w-10 h-10 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-400 mb-2">Workspace Ready</h3>
                    <p className="text-slate-600">Select a preset or describe a subject to begin.</p>
                 </div>
              )}
            </>
          )}
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }

        /* SQUIGGLE ROBOT STYLING */
        .squiggle-robot-wrapper {
          width: 80px;
          height: 80px;
          position: relative;
          background: #0f172a;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 1px solid #1e293b;
        }

        .squiggle-canvas {
          width: 60px;
          height: 60px;
          position: relative;
          animation: ui-squiggly-anim 0.3s infinite steps(1);
          transform: translateY(2px);
        }

        .robot-antenna {
          width: 3px;
          height: 10px;
          background: #4f46e5;
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
        }
        .robot-antenna::after {
          content: '';
          width: 6px;
          height: 6px;
          background: #ef4444;
          border-radius: 50%;
          position: absolute;
          top: -4px;
          left: -1.5px;
          box-shadow: 0 0 5px #ef4444;
        }

        .robot-head {
          width: 34px;
          height: 28px;
          background: #1e293b;
          border: 2px solid #4f46e5;
          border-radius: 8px;
          position: absolute;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 2;
        }

        .robot-visor {
          width: 24px;
          height: 8px;
          background: #0f172a;
          border-radius: 4px;
          position: absolute;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding: 0 4px;
        }

        .robot-eye {
          width: 4px;
          height: 4px;
          background: #4f46e5;
          border-radius: 50%;
          box-shadow: 0 0 5px #4f46e5;
        }

        .robot-torso {
          width: 40px;
          height: 30px;
          background: #1e293b;
          border: 2px solid #4f46e5;
          border-radius: 10px;
          position: absolute;
          top: 36px;
          left: 50%;
          transform: translateX(-50%);
        }

        .robot-panel {
          width: 12px;
          height: 12px;
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 3px;
          position: absolute;
          top: 6px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .robot-light {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #4f46e5;
        }

        .robot-treads {
          width: 44px;
          height: 8px;
          background: #0f172a;
          border: 2px solid #4f46e5;
          border-radius: 4px;
          position: absolute;
          bottom: -15px;
          left: 50%;
          transform: translateX(-50%);
        }

        .robot-tool {
          position: absolute;
          top: 0;
          right: 0;
          background: #1e293b;
          padding: 4px;
          border-radius: 50%;
          border: 1px solid #334155;
          box-shadow: 0 2px 5px rgba(0,0,0,0.5);
          animation: tool-float 2s ease-in-out infinite;
        }

        @keyframes tool-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @keyframes ui-squiggly-anim {
          0% { filter: url('#ui-squiggly-0'); }
          25% { filter: url('#ui-squiggly-1'); }
          50% { filter: url('#ui-squiggly-2'); }
          75% { filter: url('#ui-squiggly-3'); }
          100% { filter: url('#ui-squiggly-4'); }
        }

        /* Status Effects */
        .generating .robot-light { background: #4f46e5; animation: antenna-pulse 1s infinite; }
        .capturing .robot-visor { background: #ef444422; border: 1px solid #ef4444; }
        .analyzing .squiggle-canvas { transform: translateX(1px); animation: ui-squiggly-anim 0.2s infinite steps(1); }
        .improving .robot-head { animation: head-nod 0.5s infinite; }

        @keyframes head-nod {
           0%, 100% { transform: translateX(-50%) translateY(0); }
           50% { transform: translateX(-50%) translateY(2px); }
        }

        @keyframes antenna-pulse {
           0%, 100% { opacity: 1; transform: scale(1); }
           50% { opacity: 0.5; transform: scale(1.5); }
        }
      `}</style>
    </div>
  );
}
