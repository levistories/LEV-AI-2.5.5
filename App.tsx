
import React, { useState, useRef, useEffect } from 'react';
import { SystemMode, WorkflowMode, ReferenceMode, ArtStyle, BackgroundSelection, ImageFile, AspectRatio, ImageSize, AnalysisResult, SimilarityControls, Locks, AdsObjective, VisualEmphasis, LightingPreset, CompositionPreset, AdsOptimizationSettings, MarketingStyle, VisualLookStyle, Language, ProductionScript, SceneData, ResolutionLevel, SellingAngle, TrustBuilder } from './types';
import { analyzeSubject, processImage, generateSpeech, generateSceneScript } from './services/geminiService';
import { decode, decodeAudioData, blobToBase64, encode } from './utils/audioUtils';
import { GoogleGenAI, Modality } from "@google/genai";

const Header: React.FC = () => (
  <header className="h-16 border-b border-gray-800 bg-[#0a0a0a]/90 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-40 fixed top-0 w-full border-b border-indigo-500/10 shadow-lg shadow-indigo-500/5">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
        <i className="fas fa-bolt text-white text-lg"></i>
      </div>
      <div>
        <h1 className="text-lg font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent uppercase tracking-tight">
          LEVI AI v2.5.5
        </h1>
        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none">High-Efficiency Production Engine</p>
      </div>
    </div>
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Protocol V2.5.5 Active</span>
      </div>
    </div>
  </header>
);

const App: React.FC = () => {
  // System Config
  const [systemMode, setSystemMode] = useState<SystemMode>(SystemMode.IMAGE);
  const [workflow, setWorkflow] = useState<WorkflowMode>(WorkflowMode.CREATOR);
  const [refMode, setRefMode] = useState<ReferenceMode>(ReferenceMode.SINGLE);
  const [artStyle, setArtStyle] = useState<ArtStyle>(ArtStyle.REALISTIC);
  const [lookStyles, setLookStyles] = useState<VisualLookStyle[]>([VisualLookStyle.COMMERCIAL]);
  const [language, setLanguage] = useState<Language>(Language.ENGLISH);
  const [bgSelection, setBgSelection] = useState<BackgroundSelection>(BackgroundSelection.STUDIO);
  const [resolution, setResolution] = useState<ResolutionLevel>(ResolutionLevel.MEDIUM);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [productCommand, setProductCommand] = useState("");
  
  // Ref Assets
  const [images, setImages] = useState<ImageFile[]>([]);
  const [similarity, setSimilarity] = useState<SimilarityControls>({ character: 100, product: 100, background: 50 });
  const [locks, setLocks] = useState<Locks>({ character: true, product: true });

  // Production State
  const [adsOpt, setAdsOpt] = useState<AdsOptimizationSettings>({
    objective: AdsObjective.CLICK,
    emphasis: VisualEmphasis.SHAPE,
    lighting: LightingPreset.SOFT_CLEAN,
    composition: CompositionPreset.CENTER,
    marketingStyles: [MarketingStyle.PERSONAL],
    sellingAngle: SellingAngle.BENEFIT,
    trustBuilder: TrustBuilder.SOCIAL_PROOF
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [imageCount, setImageCount] = useState(1);
  const [outputImages, setOutputImages] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");

  // Scene Generator State
  const [sceneCount, setSceneCount] = useState(4);
  const [sceneDuration, setSceneDuration] = useState(5);
  const [productionStep, setProductionStep] = useState(1);
  const [script, setScript] = useState<ProductionScript | null>(null);

  const [isLive, setIsLive] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, role?: ImageFile['role']) => {
    const files = e.target.files;
    if (!files) return;
    const file = files[0];
    const data = await blobToBase64(file);
    const newImg: ImageFile = {
      id: Math.random().toString(36).substr(2, 9),
      url: URL.createObjectURL(file),
      data,
      mimeType: file.type,
      role
    };
    if (refMode === ReferenceMode.SINGLE) {
      setImages([newImg]);
    } else {
      setImages(prev => {
        const filtered = prev.filter(img => img.role !== role);
        return [...filtered, newImg];
      });
    }
    setAnalysis(null);
    setOutputImages([]);
  };

  const handleAnalyze = async () => {
    if (images.length === 0) return;
    setAnalyzing(true);
    try {
      const result = await analyzeSubject(
        images.map(i => ({ data: i.data, mimeType: i.mimeType, role: i.role })),
        systemMode, workflow, artStyle, similarity, locks, lookStyles, language, 
        workflow === WorkflowMode.ADS ? adsOpt : undefined
      );
      setAnalysis(result);
    } catch (e) { console.error(e); } finally { setAnalyzing(false); }
  };

  const handleProduction = async () => {
    if (systemMode === SystemMode.IMAGE) {
      if (images.length === 0 || !prompt) return;
      setProcessing(true);
      try {
        const results: string[] = [];
        for (let i = 0; i < imageCount; i++) {
          const res = await processImage(
            images.map(img => ({ data: img.data, mimeType: img.mimeType, role: img.role })),
            `${prompt} - variation ${i+1}`,
            workflow, artStyle, false, similarity, locks, lookStyles, language,
            bgSelection, aspectRatio, resolution, workflow === WorkflowMode.ADS ? adsOpt : undefined
          );
          if (res) results.push(res);
        }
        setOutputImages(results);
      } catch (e) { console.error(e); } finally { setProcessing(false); }
    } else {
      setProcessing(true);
      try {
        const resScript = await generateSceneScript(
          images.map(i => ({ data: i.data, mimeType: i.mimeType, role: i.role })),
          workflow, language, sceneCount, productCommand
        );
        setScript(resScript);
        setProductionStep(2);
      } catch (e) { console.error(e); } finally { setProcessing(false); }
    }
  };

  const generateSceneImages = async () => {
    if (!script) return;
    setProcessing(true);
    try {
      const updatedScenes = [...script.scenes];
      for (let i = 0; i < updatedScenes.length; i++) {
        const res = await processImage(
          images.map(img => ({ data: img.data, mimeType: img.mimeType, role: img.role })),
          `Scene ${i+1}: ${updatedScenes[i].description}. ${productCommand ? `Product Detail: ${productCommand}` : ''}`,
          workflow, artStyle, false, similarity, locks, lookStyles, language,
          bgSelection, aspectRatio, resolution, workflow === WorkflowMode.ADS ? adsOpt : undefined
        );
        if (res) updatedScenes[i].imageUrl = res;
      }
      setScript({ ...script, scenes: updatedScenes });
      setProductionStep(4);
    } catch (e) { console.error(e); } finally { setProcessing(false); }
  };

  const playVO = async (text: string) => {
    try {
      const base64Audio = await generateSpeech(text);
      if (base64Audio) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const buffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start();
      }
    } catch (e) { console.error(e); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const toggleMarketingStyle = (style: MarketingStyle) => {
    setAdsOpt(prev => {
      const styles = prev.marketingStyles.includes(style) 
        ? prev.marketingStyles.filter(s => s !== style)
        : [...prev.marketingStyles, style];
      return { ...prev, marketingStyles: styles.length === 0 ? [style] : styles };
    });
  };

  return (
    <div className="flex flex-col h-screen font-sans bg-[#050505] text-gray-100 overflow-hidden">
      <Header />
      
      <main className="flex flex-1 overflow-hidden mt-16">
        {/* Advanced Sidebar v2.5.5 */}
        <aside className="w-80 border-r border-gray-800/50 bg-[#080808] overflow-y-auto p-6 flex flex-col gap-6 scrollbar-hide z-20 shadow-2xl">
          
          <section>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">System Mode</label>
            <div className="grid grid-cols-2 bg-black/50 p-1 rounded-xl border border-gray-800">
              {Object.values(SystemMode).map(mode => (
                <button 
                  key={mode}
                  onClick={() => { setSystemMode(mode); setOutputImages([]); setScript(null); setProductionStep(1); }}
                  className={`py-2.5 text-[8px] font-black rounded-lg transition-all uppercase tracking-tighter ${systemMode === mode ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </section>

          <section>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">Strategy Focus</label>
            <div className="flex bg-black/50 p-1 rounded-xl border border-gray-800">
              <button onClick={() => setWorkflow(WorkflowMode.CREATOR)} className={`flex-1 py-3 text-[9px] font-black rounded-lg transition-all flex flex-col items-center gap-1 uppercase ${workflow === WorkflowMode.CREATOR ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>
                <i className="fas fa-user-circle"></i> Kreator
              </button>
              <button onClick={() => setWorkflow(WorkflowMode.ADS)} className={`flex-1 py-3 text-[9px] font-black rounded-lg transition-all flex flex-col items-center gap-1 uppercase ${workflow === WorkflowMode.ADS ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>
                <i className="fas fa-shopping-cart"></i> Product Ads
              </button>
            </div>
          </section>

          {/* v2.5.5 Identity & Consistency Locks */}
          <section className="bg-indigo-600/5 border border-indigo-500/10 p-4 rounded-2xl space-y-4">
             <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <i className="fas fa-shield-halved"></i> Identity Locks
             </label>
             <div className="space-y-4">
                <div className="flex items-center justify-between p-2 bg-black/40 rounded-xl border border-gray-800/50">
                   <div>
                      <p className="text-[9px] font-black text-gray-300 uppercase">Character Lock</p>
                      <p className="text-[7px] text-gray-600 uppercase">Secure Identity</p>
                   </div>
                   <button 
                     onClick={() => setLocks({...locks, character: !locks.character})}
                     className={`w-10 h-5 rounded-full relative transition-all ${locks.character ? 'bg-indigo-600' : 'bg-gray-800'}`}
                   >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${locks.character ? 'left-6' : 'left-1'}`}></div>
                   </button>
                </div>
                <div className="flex items-center justify-between p-2 bg-black/40 rounded-xl border border-gray-800/50">
                   <div>
                      <p className="text-[9px] font-black text-gray-300 uppercase">Product Lock</p>
                      <p className="text-[7px] text-gray-600 uppercase">Brand Fidelity</p>
                   </div>
                   <button 
                     onClick={() => setLocks({...locks, product: !locks.product})}
                     className={`w-10 h-5 rounded-full relative transition-all ${locks.product ? 'bg-indigo-600' : 'bg-gray-800'}`}
                   >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${locks.product ? 'left-6' : 'left-1'}`}></div>
                   </button>
                </div>
                <div className="space-y-2 p-2 bg-black/40 rounded-xl border border-gray-800/50">
                   <div className="flex justify-between items-center">
                      <p className="text-[9px] font-black text-gray-300 uppercase">BG Similarity</p>
                      <span className="text-[8px] font-black text-indigo-400">{similarity.background}%</span>
                   </div>
                   <input 
                     type="range" 
                     min="0" max="100" 
                     value={similarity.background}
                     onChange={(e) => setSimilarity({...similarity, background: parseInt(e.target.value)})}
                     className="w-full accent-indigo-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                   />
                </div>
             </div>
          </section>

          {/* v2.5.3 Optimization Panel */}
          {workflow === WorkflowMode.ADS && (
            <section className="bg-amber-600/5 border border-amber-500/20 p-4 rounded-2xl space-y-4">
              <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                <i className="fas fa-rocket"></i> Optimization Panel
              </label>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-gray-600 uppercase">Selling Angle</span>
                  <select 
                    value={adsOpt.sellingAngle}
                    onChange={(e) => setAdsOpt({...adsOpt, sellingAngle: e.target.value as SellingAngle})}
                    className="w-full bg-black/50 border border-gray-800 text-[9px] font-bold p-2 rounded-lg outline-none focus:border-amber-500"
                  >
                    {Object.values(SellingAngle).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[8px] font-black text-gray-600 uppercase">Trust Builder</span>
                  <select 
                    value={adsOpt.trustBuilder}
                    onChange={(e) => setAdsOpt({...adsOpt, trustBuilder: e.target.value as TrustBuilder})}
                    className="w-full bg-black/50 border border-gray-800 text-[9px] font-bold p-2 rounded-lg outline-none focus:border-amber-500"
                  >
                    {Object.values(TrustBuilder).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[8px] font-black text-gray-600 uppercase">Key Feature Highlight</span>
                  <select 
                    value={adsOpt.emphasis}
                    onChange={(e) => setAdsOpt({...adsOpt, emphasis: e.target.value as VisualEmphasis})}
                    className="w-full bg-black/50 border border-gray-800 text-[9px] font-bold p-2 rounded-lg outline-none focus:border-amber-500"
                  >
                    {Object.values(VisualEmphasis).map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <span className="text-[8px] font-black text-gray-600 uppercase">Marketing Style</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.values(MarketingStyle).map(style => (
                      <button 
                        key={style}
                        onClick={() => toggleMarketingStyle(style)}
                        className={`py-2 px-1 rounded-lg border text-[7px] font-black uppercase transition-all truncate ${adsOpt.marketingStyles.includes(style) ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-900/20' : 'bg-black/40 border-gray-800 text-gray-600'}`}
                        title={style}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[8px] font-black text-gray-600 uppercase">Lighting Preset</span>
                  <select 
                    value={adsOpt.lighting}
                    onChange={(e) => setAdsOpt({...adsOpt, lighting: e.target.value as LightingPreset})}
                    className="w-full bg-black/50 border border-gray-800 text-[9px] font-bold p-2 rounded-lg outline-none focus:border-amber-500"
                  >
                    {Object.values(LightingPreset).map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[8px] font-black text-gray-600 uppercase">Composition Preset</span>
                  <select 
                    value={adsOpt.composition}
                    onChange={(e) => setAdsOpt({...adsOpt, composition: e.target.value as CompositionPreset})}
                    className="w-full bg-black/50 border border-gray-800 text-[9px] font-bold p-2 rounded-lg outline-none focus:border-amber-500"
                  >
                    {Object.values(CompositionPreset).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Reference Assets</label>
              <button onClick={() => { setRefMode(refMode === ReferenceMode.SINGLE ? ReferenceMode.MIX : ReferenceMode.SINGLE); setImages([]); }} className="text-[8px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
                {refMode === ReferenceMode.SINGLE ? 'Mix' : 'Single'}
              </button>
            </div>
            {refMode === ReferenceMode.SINGLE ? (
              <div className="relative group h-24">
                <input type="file" onChange={(e) => handleFileUpload(e)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="border border-dashed border-gray-800 group-hover:border-indigo-500/50 transition-all rounded-xl p-4 flex flex-col items-center justify-center gap-2 bg-black/40 h-full overflow-hidden">
                  {images[0] ? <img src={images[0].url} className="w-full h-full object-cover rounded-lg" /> : <><i className="fas fa-upload text-gray-700"></i><span className="text-[8px] font-black text-gray-600 uppercase">Master Ref</span></>}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {['character', 'product', 'background'].map((role) => {
                  const img = images.find(i => i.role === role);
                  return (
                    <div key={role} className="relative group h-14">
                      <input type="file" onChange={(e) => handleFileUpload(e, role as any)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className={`border border-dashed border-gray-800 group-hover:border-indigo-500/50 transition-all rounded-lg p-2 flex items-center gap-3 bg-black/40 h-full ${img ? 'border-indigo-600/30' : ''}`}>
                        <div className="w-10 h-10 bg-gray-900 rounded flex items-center justify-center overflow-hidden shrink-0">
                          {img ? <img src={img.url} className="w-full h-full object-cover" /> : <i className="fas fa-image text-gray-700 text-[10px]"></i>}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-[8px] font-black text-gray-400 uppercase truncate">{role}</p>
                          <p className="text-[7px] text-gray-600 uppercase">{img ? 'Identity Locked' : 'Empty'}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">Art Style Look</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(ArtStyle).map(([key, val]) => (
                <button key={val} onClick={() => setArtStyle(val as ArtStyle)} className={`p-2 rounded-lg border text-[8px] font-black uppercase transition-all ${artStyle === val ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-black/20 border-gray-800 text-gray-600'}`}>
                  {val}
                </button>
              ))}
            </div>
          </section>

          <section>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">Visual Look Style</label>
            <div className="grid grid-cols-3 gap-1.5">
              {Object.values(VisualLookStyle).map(look => (
                <button 
                  key={look} 
                  onClick={() => {
                    if (systemMode === SystemMode.IMAGE) {
                      setLookStyles(prev => prev.includes(look) ? prev.filter(l => l !== look) : [...prev, look]);
                    } else {
                      setLookStyles([look]);
                    }
                  }}
                  className={`py-2 rounded-md border text-[7px] font-black uppercase transition-all ${lookStyles.includes(look) ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-black/40 border-gray-800 text-gray-600'}`}
                >
                  {look}
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-4">
             <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">
                <i className="fas fa-expand mr-2"></i> Ratio & Resolution
             </label>
             <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-gray-600 uppercase">Aspect Ratio</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['1:1', '4:5', '9:16', '16:9'].map(r => (
                      <button key={r} onClick={() => setAspectRatio(r as any)} className={`py-1.5 rounded-lg border text-[8px] font-black uppercase transition-all ${aspectRatio === r ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-black/40 border-gray-800 text-gray-600'}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-gray-600 uppercase">Resolution</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {Object.values(ResolutionLevel).map(res => (
                      <button key={res} onClick={() => setResolution(res)} className={`py-1.5 rounded-lg border text-[8px] font-black uppercase transition-all ${resolution === res ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-black/40 border-gray-800 text-gray-600'}`}>
                        {res}
                      </button>
                    ))}
                  </div>
                </div>
             </div>
          </section>

          <section>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">Custom Background Menu</label>
            <select value={bgSelection} onChange={(e) => setBgSelection(e.target.value as BackgroundSelection)} className="w-full bg-black border border-gray-800 text-[9px] font-bold p-2.5 rounded-xl outline-none focus:border-indigo-500 uppercase text-gray-400">
              {Object.values(BackgroundSelection).map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </section>

          <section>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">Language Selection</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value as Language)} className="w-full bg-black border border-gray-800 text-[10px] font-bold p-2.5 rounded-xl outline-none focus:border-indigo-500 uppercase text-gray-400">
              {Object.values(Language).map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </section>

          {systemMode === SystemMode.SCENE && (
            <section className="bg-indigo-600/5 border border-indigo-500/10 p-4 rounded-2xl space-y-3">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">
                 <i className="fas fa-tag mr-2"></i> Scene Product Command
              </label>
              <textarea 
                value={productCommand}
                onChange={(e) => setProductCommand(e.target.value)}
                placeholder="Detail produk per scene: warna, logo, props detail..."
                className="w-full h-24 bg-black/40 border border-gray-800 rounded-xl p-3 text-[10px] outline-none focus:border-indigo-500 transition-all font-medium text-gray-300 resize-none"
              />
            </section>
          )}

          {systemMode === SystemMode.IMAGE && (
            <section>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">Batch Quantity</label>
              <div className="flex bg-black/50 p-1 rounded-xl border border-gray-800">
                {[1, 2, 3, 4].map(n => (
                  <button key={n} onClick={() => setImageCount(n)} className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${imageCount === n ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </section>
          )}

          <div className="mt-auto pt-4 flex flex-col gap-3">
            <button onClick={handleAnalyze} disabled={analyzing || images.length === 0} className="w-full py-3.5 bg-gray-900 border border-gray-800 hover:border-indigo-500/50 disabled:opacity-30 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3">
              {analyzing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-dna text-indigo-500"></i>}
              Analyze Master DNA
            </button>
            <button onClick={handleProduction} disabled={processing || (systemMode === SystemMode.IMAGE && !prompt)} className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-30 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-indigo-900/20 transition-all flex items-center justify-center gap-3">
              {processing ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-rocket"></i>}
              {systemMode === SystemMode.IMAGE ? 'Execute Batch' : 'Start Scene Gen'}
            </button>
          </div>
        </aside>

        {/* Studio Canvas v2.5.5 */}
        <section className="flex-1 bg-black p-8 overflow-y-auto scrollbar-hide">
          <div className="max-w-6xl mx-auto space-y-8 pb-32">
            
            {/* System Output Header */}
            <div className="flex items-center justify-between border-b border-gray-800/50 pb-6">
              <div className="flex items-center gap-4">
                 <span className="px-4 py-2 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                   {systemMode}
                 </span>
                 <span className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">
                    {workflow} STRATEGY • {lookStyles.join(' + ')}
                 </span>
              </div>
              {analysis && (
                <button onClick={() => playVO(analysis.voScript!)} className="flex items-center gap-2 text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors">
                  <i className="fas fa-waveform text-xs"></i> Briefing Analyst
                </button>
              )}
            </div>

            {/* Workflow Area */}
            {systemMode === SystemMode.IMAGE ? (
              <div className="grid grid-cols-1 gap-12">
                {/* Inputs */}
                <div className="bg-[#0c0c0c] rounded-[2rem] p-10 border border-gray-800/30 flex flex-col gap-8 shadow-2xl">
                  <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em] flex items-center gap-2">
                    <i className="fas fa-edit text-indigo-500"></i> Production Prompt
                  </h2>
                  <textarea 
                    value={prompt} 
                    onChange={(e) => setPrompt(e.target.value)} 
                    placeholder={`Gunakan ${workflow === WorkflowMode.CREATOR ? 'Character' : 'Product'} sebagai fokus utama...`}
                    className="w-full h-32 bg-black border border-gray-800 rounded-2xl p-6 text-sm outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-gray-800 transition-all font-medium text-gray-200 shadow-inner"
                  />
                  <div className="flex items-center justify-between">
                     <div className="flex gap-4">
                        <button className="text-[9px] font-black text-gray-600 uppercase hover:text-indigo-400"><i className="fas fa-microchip mr-2"></i> Nano Banana 2.5</button>
                        <button className="text-[9px] font-black text-gray-600 uppercase hover:text-indigo-400"><i className="fas fa-shield-alt mr-2"></i> Style Lock Active</button>
                     </div>
                     <div className="flex gap-4 items-center">
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{aspectRatio} • {resolution}</span>
                     </div>
                  </div>
                </div>

                {/* Vertical Output Stream */}
                <div className="flex flex-col gap-10">
                   {outputImages.length > 0 ? (
                      outputImages.map((img, idx) => (
                        <div key={idx} className="bg-[#0c0c0c] border border-gray-800/30 rounded-[2.5rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl group animate-in slide-in-from-bottom-8 duration-700">
                           <div className="lg:w-1/2 aspect-square relative group/img overflow-hidden">
                              <img src={img} className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-1000" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-all flex items-center justify-center gap-4">
                                 <button className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform"><i className="fas fa-search-plus"></i></button>
                                 <button onClick={() => { const a = document.createElement('a'); a.href = img; a.download = `levi-output-${idx+1}.jpg`; a.click(); }} className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-xl"><i className="fas fa-download"></i></button>
                              </div>
                           </div>
                           <div className="p-10 flex flex-col gap-6 lg:w-1/2">
                              <div className="flex justify-between items-start">
                                 <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Variation Output #{idx + 1}</h3>
                                 <span className="text-[8px] bg-indigo-600/10 text-indigo-400 px-2 py-1 rounded-full border border-indigo-500/20 font-black">CONSISTENT</span>
                              </div>
                              <div className="space-y-4">
                                 <div className="p-5 bg-black/40 border border-gray-800/50 rounded-2xl relative">
                                    <h4 className="text-[8px] font-black text-indigo-400 uppercase mb-2 tracking-widest">Video Prompt Context</h4>
                                    <code className="text-[10px] text-gray-500 font-mono block break-all leading-tight">
                                       {`{"prompt": "${prompt}", "strategy": "${workflow}", "art": "${artStyle}", "res": "${resolution}"}`}
                                    </code>
                                    <button onClick={() => copyToClipboard(`{"prompt": "${prompt}", "strategy": "${workflow}"}`)} className="absolute top-4 right-4 text-[9px] hover:text-white"><i className="fas fa-copy"></i></button>
                                 </div>
                                 <div className="grid grid-cols-2 gap-4">
                                    <button className="py-4 bg-gray-900 border border-gray-800 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:border-indigo-500/40 transition-all"><i className="fas fa-redo-alt mr-2 text-indigo-500"></i> Re-Render</button>
                                    <button className="py-4 bg-gray-900 border border-gray-800 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:border-indigo-500/40 transition-all"><i className="fas fa-video mr-2 text-indigo-500"></i> Text-to-Video</button>
                                 </div>
                              </div>
                           </div>
                        </div>
                      ))
                   ) : processing && (
                      <div className="h-[400px] flex flex-col items-center justify-center gap-6 animate-pulse border border-gray-800/30 rounded-[3rem] bg-[#0c0c0c]/50">
                        <div className="w-20 h-20 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">Synthesis Pipeline Running...</p>
                      </div>
                   )}
                </div>

                {/* Bottom Assets */}
                {analysis && outputImages.length > 0 && (
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="bg-[#0c0c0c] border border-gray-800/30 p-8 rounded-[2rem] flex flex-col gap-4">
                         <div className="flex justify-between items-center mb-2">
                            <h4 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Copywriting Caption</h4>
                            <button onClick={() => copyToClipboard(analysis.caption!)} className="text-gray-600 hover:text-white"><i className="fas fa-copy"></i></button>
                         </div>
                         <p className="text-[11px] text-gray-400 leading-relaxed italic">{analysis.caption}</p>
                      </div>
                      <div className="bg-[#0c0c0c] border border-gray-800/30 p-8 rounded-[2rem] flex flex-col gap-4">
                         <div className="flex justify-between items-center mb-2">
                            <h4 className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Recommended Hashtags</h4>
                            <button onClick={() => copyToClipboard(analysis.hashtags!)} className="text-gray-600 hover:text-white"><i className="fas fa-copy"></i></button>
                         </div>
                         <p className="text-[11px] text-emerald-600 font-bold leading-relaxed">{analysis.hashtags}</p>
                      </div>
                      <div className="bg-[#0c0c0c] border border-gray-800/30 p-8 rounded-[2rem] flex flex-col gap-4">
                         <div className="flex justify-between items-center mb-2">
                            <h4 className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Voice Over Script</h4>
                            <button onClick={() => copyToClipboard(analysis.voScript!)} className="text-gray-600 hover:text-white"><i className="fas fa-copy"></i></button>
                         </div>
                         <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{analysis.voScript}</p>
                         <button onClick={() => playVO(analysis.voScript!)} className="mt-auto py-3 bg-purple-600/10 border border-purple-500/20 rounded-xl text-[9px] font-black text-purple-400 uppercase hover:bg-purple-600/20 transition-all"><i className="fas fa-play mr-2"></i> Play VO</button>
                      </div>
                   </div>
                )}
              </div>
            ) : (
              /* Scene Generator Workflow v2.5.5 */
              <div className="flex flex-col gap-12">
                 {/* Steps Navigation */}
                 <div className="flex items-center justify-center gap-10">
                    {[1, 2, 3, 4].map(step => (
                      <div key={step} className={`flex items-center gap-3 transition-all ${productionStep >= step ? 'opacity-100' : 'opacity-20'}`}>
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black border ${productionStep === step ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-600/30' : 'border-gray-800 text-gray-500'}`}>
                            {step === 4 ? <i className="fas fa-check"></i> : step}
                         </div>
                         <span className="text-[9px] font-black uppercase tracking-widest text-gray-600 hidden md:block">
                            {step === 1 ? 'Strategy' : step === 2 ? 'Storyline' : step === 3 ? 'Production' : 'Final Mix'}
                         </span>
                      </div>
                    ))}
                 </div>

                 {/* Custom Scene Settings */}
                 {productionStep === 1 && (
                    <div className="bg-[#0c0c0c] border border-gray-800/30 p-8 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-top-8 duration-700 space-y-8">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-indigo-600/10 border border-indigo-500/20 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/10">
                             <i className="fas fa-sliders-h text-indigo-400"></i>
                          </div>
                          <div>
                             <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Custom Scene Settings</h3>
                             <p className="text-[8px] text-indigo-500 font-black uppercase mt-0.5">Define Production Parameters</p>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="bg-black/40 border border-gray-800/50 p-6 rounded-2xl flex flex-col gap-4">
                             <div className="flex justify-between items-center">
                                <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Scene Count</label>
                                <span className="text-[10px] font-black text-indigo-400">{sceneCount} Scenes</span>
                             </div>
                             <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {[3, 4, 5, 6, 8, 10].map(n => (
                                   <button key={n} onClick={() => setSceneCount(n)} className={`shrink-0 w-12 py-3 text-[10px] font-black rounded-xl transition-all border ${sceneCount === n ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30' : 'bg-black/40 border-gray-800 text-gray-600 hover:text-gray-400 hover:border-gray-700'}`}>
                                      {n}
                                   </button>
                                ))}
                             </div>
                          </div>

                          <div className="bg-black/40 border border-gray-800/50 p-6 rounded-2xl flex flex-col gap-4">
                             <div className="flex justify-between items-center">
                                <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Scene Duration</label>
                                <span className="text-[10px] font-black text-indigo-400">{sceneDuration}s</span>
                             </div>
                             <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {[3, 5, 7, 10, 15].map(d => (
                                   <button key={d} onClick={() => setSceneDuration(d)} className={`shrink-0 w-12 py-3 text-[10px] font-black rounded-xl transition-all border ${sceneDuration === d ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30' : 'bg-black/40 border-gray-800 text-gray-600 hover:text-gray-400 hover:border-gray-700'}`}>
                                      {d}s
                                   </button>
                                ))}
                             </div>
                          </div>
                       </div>

                       <div className="bg-indigo-600/5 border border-indigo-500/10 p-6 rounded-2xl">
                          <p className="text-[10px] text-gray-500 font-medium leading-relaxed italic text-center">
                             Scene settings locked. Protocol V2.5.5 will prioritize these constraints during visual synthesis.
                          </p>
                       </div>
                    </div>
                 )}

                 {productionStep === 2 && script && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-8 duration-700">
                       {script.storylines.map((story, idx) => (
                          <div key={idx} className="bg-[#0c0c0c] border border-gray-800/30 p-10 rounded-[2.5rem] flex flex-col gap-6 hover:border-indigo-500/40 transition-all group shadow-2xl">
                             <div className="flex justify-between items-center">
                                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Concept Proposal #{idx + 1}</h3>
                                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center"><i className="fas fa-magic text-xs text-indigo-500"></i></div>
                             </div>
                             <p className="text-xs text-gray-400 leading-relaxed font-medium">{story}</p>
                             <button onClick={() => { setScript({...script, selectedStorylineIndex: idx}); setProductionStep(3); }} className="mt-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20">Select Storyline</button>
                          </div>
                       ))}
                    </div>
                 )}

                 {productionStep === 3 && script && (
                    <div className="bg-[#0c0c0c] border border-gray-800/30 p-10 rounded-[3rem] shadow-2xl animate-in fade-in duration-1000">
                       <div className="flex flex-col gap-8">
                          <div className="flex justify-between items-center border-b border-gray-800 pb-6">
                             <div>
                                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Synthesis Queue Ready</h3>
                                <p className="text-[9px] text-indigo-500 font-black uppercase mt-1">{sceneCount} Scenes Locked • Mode: ${workflow}</p>
                             </div>
                             <button onClick={generateSceneImages} disabled={processing} className="px-8 py-4 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 transition-all">
                                {processing ? <i className="fas fa-circle-notch fa-spin mr-2"></i> : <i className="fas fa-play mr-2"></i>}
                                Process Visuals
                             </button>
                          </div>
                          <div className="space-y-6">
                             {script.scenes.map(s => (
                                <div key={s.sceneId} className="flex gap-6 items-start p-6 bg-black/40 rounded-2xl border border-gray-800/50">
                                   <div className="w-12 h-12 bg-indigo-600/10 border border-indigo-500/20 rounded-full flex items-center justify-center shrink-0">
                                      <span className="text-[10px] font-black text-indigo-400">S{s.sceneId}</span>
                                   </div>
                                   <div className="flex-1 space-y-2">
                                      <p className="text-[11px] text-gray-300 font-bold leading-relaxed">{s.description}</p>
                                      <p className="text-[10px] text-gray-500 italic">"VO: ${s.voScript}"</p>
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>
                    </div>
                 )}

                 {productionStep === 4 && script && (
                    <div className="flex flex-col gap-12">
                       {script.scenes.map((s, idx) => (
                          <div key={idx} className="bg-[#0c0c0c] border border-gray-800/30 rounded-[2.5rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl animate-in slide-in-from-bottom-12 duration-1000">
                             <div className="lg:w-1/2 aspect-video relative group overflow-hidden">
                                {s.imageUrl ? <img src={s.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" /> : <div className="w-full h-full bg-black/50 animate-pulse"></div>}
                                <div className="absolute top-6 left-6 px-4 py-2 bg-black/80 backdrop-blur-md rounded-full border border-indigo-500/20 text-[9px] font-black text-indigo-400 uppercase tracking-widest">Scene {s.sceneId}</div>
                             </div>
                             <div className="p-10 lg:w-1/2 flex flex-col gap-6">
                                <div className="space-y-4">
                                   <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Visual Narrative</h4>
                                   <p className="text-xs text-gray-300 font-medium leading-relaxed">{s.description}</p>
                                   <div className="p-5 bg-indigo-600/5 border border-indigo-500/10 rounded-2xl">
                                      <h5 className="text-[8px] font-black text-indigo-400 uppercase mb-2 tracking-widest">Master VO</h5>
                                      <p className="text-xs text-gray-400 italic font-medium leading-relaxed">"{s.voScript}"</p>
                                   </div>
                                </div>
                                <div className="mt-auto grid grid-cols-2 gap-4">
                                   <button onClick={() => playVO(s.voScript)} className="py-4 bg-gray-900 border border-gray-800 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:border-indigo-500/40"><i className="fas fa-volume-up mr-2 text-indigo-500"></i> Voice Gen</button>
                                   <button className="py-4 bg-indigo-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500 shadow-lg shadow-indigo-600/20"><i className="fas fa-video mr-2"></i> Scene Video</button>
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Floating Analyst Assistant */}
      <button 
        onClick={() => setIsLive(!isLive)}
        className={`fixed bottom-10 right-10 w-16 h-16 rounded-[2.5rem] shadow-2xl flex items-center justify-center transition-all z-50 transform hover:scale-110 active:scale-90 ${isLive ? 'bg-red-500 rotate-90 shadow-red-500/40' : 'bg-indigo-600 shadow-indigo-600/40 border border-indigo-400/20'}`}
      >
        <i className={`fas ${isLive ? 'fa-times' : 'fa-headset'} text-2xl text-white`}></i>
      </button>

      {isLive && (
        <LiveAudioSession onClose={() => setIsLive(false)} workflow={workflow} style={artStyle} />
      )}
    </div>
  );
};

const LiveAudioSession: React.FC<{ onClose: () => void; workflow: WorkflowMode; style: ArtStyle }> = ({ onClose, workflow, style }) => {
  const [status, setStatus] = useState<string>("Initializing...");
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    let inputCtx: AudioContext | null = null;
    let outputCtx: AudioContext | null = null;
    let stream: MediaStream | null = null;

    const startLive = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: `You are the Production Director for LEVI AI v2.5.5. 
            Currently active Strategy: ${workflow}. 
            Style Lock: ${style}. 
            Support Custom Similarity & Locks System. Explain that Character and Product locks ensure visual consistency, while Background Similarity slider adjusts env fidelity. Provide professional, commercial guidance.`
          },
          callbacks: {
            onopen: () => {
              setStatus("Direct Line Open");
              const source = inputCtx!.createMediaStreamSource(stream!);
              const scriptProcessor = inputCtx!.createScriptProcessor(4096, 1, 1);
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const l = inputData.length;
                const int16 = new Int16Array(l);
                for (let i = 0; i < l; i++) { int16[i] = inputData[i] * 32768; }
                const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
                sessionPromise.then((session: any) => { session.sendRealtimeInput({ media: pcmBlob }); });
              };
              source.connect(scriptProcessor);
              scriptProcessor.connect(inputCtx!.destination);
            },
            onmessage: async (message: any) => {
              const audioBase64 = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (audioBase64 && outputCtx) {
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                const buffer = await decodeAudioData(decode(audioBase64), outputCtx, 24000, 1);
                const source = outputCtx.createBufferSource();
                source.buffer = buffer;
                source.connect(outputCtx.destination);
                source.onended = () => sourcesRef.current.delete(source);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(source);
              }
            },
            onerror: () => setStatus("Signal Loss"),
            onclose: () => { setStatus("Standby"); onClose(); }
          }
        });
        sessionRef.current = await sessionPromise;
      } catch (err) { setStatus("No Access"); }
    };

    startLive();
    return () => {
      if (sessionRef.current) sessionRef.current.close();
      if (inputCtx) inputCtx.close();
      if (outputCtx) outputCtx.close();
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [workflow, style]);

  return (
    <div className="fixed bottom-32 right-10 bg-[#0c0c0c]/98 border border-gray-800 p-8 rounded-[3rem] shadow-2xl w-80 z-50 backdrop-blur-3xl animate-in slide-in-from-bottom-12 duration-500 ring-1 ring-indigo-500/20">
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
           <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></div>
           <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Levi Pipeline Link</span>
        </div>
        <button onClick={onClose} className="text-gray-700 hover:text-white transition-colors"><i className="fas fa-times"></i></button>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex gap-2 items-end h-16">
          {[1,2,3,4,5,6,7].map(i => (
             <div key={i} className={`w-1.5 bg-indigo-500/40 rounded-full animate-bounce`} style={{ height: `${30 + Math.random() * 70}%`, animationDelay: `${i * 100}ms` }}></div>
          ))}
        </div>
        <div>
          <p className="text-[11px] font-black text-gray-200 uppercase tracking-widest leading-tight">{status}</p>
          <p className="text-[9px] text-gray-500 uppercase font-black mt-2">LEVI v2.5.5 Protocol</p>
        </div>
      </div>
      <div className="mt-10 p-5 bg-indigo-500/5 rounded-3xl border border-indigo-500/10">
        <p className="text-[10px] text-gray-400 italic leading-relaxed">
          "LEVI AI Studio v2.5.5 is active. Strategy ${workflow} is engaged. Custom Similarity & Locks System (Update 21) is operational. Monitoring visual production pipeline."
        </p>
      </div>
    </div>
  );
};

export default App;
