
import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";
import { SystemMode, WorkflowMode, ArtStyle, BackgroundSelection, AspectRatio, ImageSize, AnalysisResult, SimilarityControls, Locks, AdsOptimizationSettings, MarketingStyle, VisualLookStyle, Language, ProductionScript, SceneData, ResolutionLevel } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const STYLE_LOCK_DEFINITIONS: Record<ArtStyle, string> = {
  [ArtStyle.ANIME]: "2D anime, cel-shaded, Japanese style art. Bold outlines and vibrant colors.",
  [ArtStyle.REALISTIC]: "Photo-realistic, studio lighting, high-fidelity textures, and cinematic depth.",
  [ArtStyle.SEMI_REALISTIC]: "Hybrid realistic-illustrative rendering with natural proportions but stylized surfaces.",
  [ArtStyle.PIXAR_3D]: "Pixar / 3D Stylized. High-quality PBR materials, rounded forms, and expressive lighting.",
  [ArtStyle.CARTOON_FLAT]: "Flat Illustration. Clean vector-like shapes, minimal shading, and high legibility.",
  [ArtStyle.CHIBI]: "Chibi style. Super-deformed (SD) proportions, large heads, cute aesthetic.",
  [ArtStyle.LOW_POLY]: "Low Poly / 3D. Stylized geometric facets, clean shapes, and 3D volume.",
  [ArtStyle.COMMERCIAL]: "Clean Commercial Illustration. Idealized surfaces optimized for e-commerce and marketing."
};

const MARKETING_STYLE_RULES: Record<MarketingStyle, string> = {
  [MarketingStyle.PERSONAL]: "Personal Branding: Product integrated with personal identity, premium minimal clutter.",
  [MarketingStyle.TREADMILL]: "Treadmill Loop: Product presented in dynamic lifestyle context with motion feel.",
  [MarketingStyle.AESTHETIC_HANDS]: "Aesthetic Hands: Product held by hands (face out of frame), rear-camera focus aesthetic.",
  [MarketingStyle.MIRROR]: "Foto Mirror: Product shown through mirror reflection for aesthetic symmetry.",
  [MarketingStyle.FOOD]: "Food Promo: Close-up details, warm lighting, appetizing high-fidelity textures.",
  [MarketingStyle.PROPERTY]: "Promo Properti: Wide shot focus on rooms/buildings, premium interior/exterior context.",
  [MarketingStyle.UGC]: "UGC Content: User-Generated Content style. Natural, relatable, non-studio lighting, often handheld feel.",
  [MarketingStyle.CUSTOM]: "Custom Style: User-defined bespoke marketing aesthetic."
};

const MODE_INSTRUCTIONS: Record<WorkflowMode, string> = {
  [WorkflowMode.CREATOR]: `STRATEGY: Creator Mode (Character-Focused). The CHARACTER is the primary focal point. Visuals should prioritize character identity, emotion, and storytelling. Products are supporting elements to the character's narrative. (LEVI AI v2.5.5)`,
  [WorkflowMode.ADS]: `STRATEGY: Product Ads Mode (Product-Focused). The PRODUCT is the primary focal point. Visuals should prioritize product clarity, branding, and commercial appeal. Characters are supporting elements to provide context or usage scenarios. (LEVI AI v2.5.5)`
};

export const analyzeSubject = async (
  images: { data: string; mimeType: string; role?: string }[],
  systemMode: SystemMode,
  mode: WorkflowMode,
  style: ArtStyle,
  similarity: SimilarityControls,
  locks: Locks,
  lookStyles: VisualLookStyle[],
  language: Language,
  adsOpt?: AdsOptimizationSettings
): Promise<AnalysisResult> => {
  const ai = getAI();
  const styleLock = STYLE_LOCK_DEFINITIONS[style];
  const modeCtx = MODE_INSTRUCTIONS[mode];
  const looks = lookStyles.join(', ');

  const adsOptCtx = adsOpt && mode === WorkflowMode.ADS ? `
ADS OPTIMIZATION (FULL PANEL ACTIVE):
- Objective: ${adsOpt.objective}
- Selling Angle: ${adsOpt.sellingAngle}
- Trust Builder: ${adsOpt.trustBuilder}
- Visual Emphasis: ${adsOpt.emphasis}
- Lighting: ${adsOpt.lighting}
- Composition: ${adsOpt.composition}
- Marketing Styles: ${adsOpt.marketingStyles.join(', ')}` : '';

  const prompt = `You are a professional Visual Analyst for LEVI AI v2.5.5.
SYSTEM MODE: ${systemMode}
${modeCtx}
LANGUAGE: ${language}
ART STYLE LOCK: ${styleLock}
VISUAL LOOK STYLE: ${looks}
${adsOptCtx}

SIMILARITY PROTOCOL:
- Character Identity: ${locks.character ? 'STRICT LOCK (100% IDENTITY CONSISTENCY)' : `${similarity.character}% Similarity`}
- Product Identity: ${locks.product ? 'STRICT LOCK (100% VISUAL FIDELITY)' : `${similarity.product}% Similarity`}
- Background Similarity: ${similarity.background}%

Analyze and extract Visual DNA. Provide a compelling caption, hashtags, and a Voice Over script in ${language}.
Focus heavily on the defined STRATEGY (Character-first for Creator, Product-first for Ads).
Return analysis in JSON format.`;

  const parts = images.map(img => ({
    inlineData: { data: img.data, mimeType: img.mimeType },
    text: img.role ? `Reference Role: ${img.role}` : undefined
  })).flatMap(p => p.text ? [{ text: p.text }, { inlineData: p.inlineData }] : [{ inlineData: p.inlineData }]);

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts: [...parts as any, { text: prompt }] },
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          identityDna: { type: Type.STRING },
          styleReport: { type: Type.STRING },
          consistencyGuidelines: { type: Type.STRING },
          compositionPlan: { type: Type.STRING },
          caption: { type: Type.STRING },
          hashtags: { type: Type.STRING },
          voScript: { type: Type.STRING },
          conversionOptimization: { type: Type.STRING }
        },
        required: ["identityDna", "styleReport", "consistencyGuidelines", "compositionPlan", "caption", "hashtags", "voScript"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const processImage = async (
  images: { data: string; mimeType: string; role?: string }[],
  prompt: string,
  mode: WorkflowMode,
  style: ArtStyle,
  isEdit: boolean,
  similarity: SimilarityControls,
  locks: Locks,
  lookStyles: VisualLookStyle[],
  language: Language,
  background?: BackgroundSelection,
  aspectRatio?: AspectRatio,
  resolution: ResolutionLevel = ResolutionLevel.MEDIUM,
  adsOpt?: AdsOptimizationSettings
): Promise<string | null> => {
  const ai = getAI();
  const styleLock = STYLE_LOCK_DEFINITIONS[style];
  const modeCtx = MODE_INSTRUCTIONS[mode];

  const adsOptCtx = adsOpt && mode === WorkflowMode.ADS ? `
ADS OPTIMIZATION DETAILS:
- Objective: ${adsOpt.objective}
- Selling Angle: ${adsOpt.sellingAngle}
- Trust Builder: ${adsOpt.trustBuilder}
- Visual Emphasis: ${adsOpt.emphasis}
- Marketing Styles: ${adsOpt.marketingStyles.join(', ')}
- Lighting: ${adsOpt.lighting}
- Composition: ${adsOpt.composition}` : '';

  const systemInstruction = `You are an AI Image Editor for LEVI AI v2.5.5 enforcing STRICT VISUAL CONSISTENCY.
${modeCtx}
LANGUAGE: ${language}
ART STYLE LOCK: ${styleLock}
VISUAL LOOK STYLE: ${lookStyles.join(', ')}
${background ? `BACKGROUND PRESET: ${background}` : ''}
${adsOptCtx}

CONSISTENCY LOCKS & SIMILARITY:
- Character Lock: ${locks.character ? 'ON (Maintain exact features, face, and clothing if provided)' : 'OFF'}
- Character Similarity: ${similarity.character}%
- Product Lock: ${locks.product ? 'ON (Maintain exact logo, shape, and packaging)' : 'OFF'}
- Product Similarity: ${similarity.product}%
- Background Similarity: ${similarity.background}%

Task: ${isEdit ? 'Modify source' : 'Generate new variation'}. 
Follow the Strategy: ${mode === WorkflowMode.CREATOR ? 'Prioritize CHARACTER' : 'Prioritize PRODUCT'}.`;

  const model = isEdit ? 'gemini-2.5-flash-image' : 'gemini-3-pro-image-preview';
  const config: any = {};

  let size: ImageSize = ImageSize.K1;
  if (resolution === ResolutionLevel.MEDIUM) size = ImageSize.K2;
  if (resolution === ResolutionLevel.HIGH) size = ImageSize.K4;

  if (!isEdit && aspectRatio) {
    config.imageConfig = { aspectRatio, imageSize: size };
  }

  const parts = images.map(img => ({
    inlineData: { data: img.data, mimeType: img.mimeType },
    text: img.role ? `Reference Role: ${img.role}` : undefined
  })).flatMap(p => p.text ? [{ text: p.text }, { inlineData: p.inlineData }] : [{ inlineData: p.inlineData }]);

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        ...parts as any,
        { text: `${systemInstruction}\n\nUSER REQUEST: ${prompt}` }
      ]
    },
    config
  });

  const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  return part?.inlineData ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : null;
};

export const generateSceneScript = async (
  images: { data: string; mimeType: string; role?: string }[],
  mode: WorkflowMode,
  language: Language,
  sceneCount: number,
  productCommand?: string
): Promise<ProductionScript> => {
  const ai = getAI();
  const modeCtx = MODE_INSTRUCTIONS[mode];
  const prompt = `Generate a high-conversion script for ${mode === WorkflowMode.ADS ? 'Product Ads' : 'Creator Storytelling'} in ${language} using LEVI AI v2.5.5 logic.
${modeCtx}
${productCommand ? `SPECIFIC PRODUCT COMMAND/DETAILS: ${productCommand}` : ''}

Provide:
1. Strategy and Hook (Hook must be powerful based on the ${mode} strategy)
2. Two storyline options
3. Scene by scene breakdown for ${sceneCount} scenes. Each scene needs a visual description and VO script.
4. Caption and Hashtags.

Return as JSON.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: images.map(i => ({ inlineData: { data: i.data, mimeType: i.mimeType } })).concat([{ text: prompt }] as any),
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          strategy: { type: Type.STRING },
          hook: { type: Type.STRING },
          storylines: { type: Type.ARRAY, items: { type: Type.STRING } },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sceneId: { type: Type.NUMBER },
                description: { type: Type.STRING },
                voScript: { type: Type.STRING }
              }
            }
          },
          caption: { type: Type.STRING },
          hashtags: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
};
