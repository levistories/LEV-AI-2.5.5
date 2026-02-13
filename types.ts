
export enum SystemMode {
  IMAGE = 'IMAGE GENERATOR',
  SCENE = 'SCENE GENERATOR'
}

export enum WorkflowMode {
  CREATOR = 'CREATOR', // Character-focused
  ADS = 'ADS'          // Product-focused
}

export enum ReferenceMode {
  SINGLE = 'SINGLE',
  MIX = 'MIX'
}

export enum ArtStyle {
  ANIME = 'ANIME',
  REALISTIC = 'REALISTIC',
  SEMI_REALISTIC = 'SEMI_REALISTIC',
  PIXAR_3D = 'PIXAR_3D',
  CARTOON_FLAT = 'CARTOON_FLAT',
  CHIBI = 'CHIBI',
  LOW_POLY = 'LOW_POLY',
  COMMERCIAL = 'COMMERCIAL'
}

export enum VisualLookStyle {
  UGC = 'UGC',
  BROLL = 'BROLL',
  COMMERCIAL = 'COMMERCIAL',
  LIFESTYLE = 'LIFESTYLE',
  CINEMATIC = 'CINEMATIC',
  MINIMALIST = 'MINIMALIST'
}

export enum Language {
  ENGLISH = 'ENGLISH',
  INDONESIAN = 'INDONESIAN',
  MALAY = 'MALAY',
  JAPANESE = 'JAPANESE'
}

export enum BackgroundSelection {
  CAFE = 'CAFE',
  OUTDOOR = 'TAMAN / OUTDOOR',
  OFFICE = 'KANTOR / WORKSPACE',
  URBAN = 'GEDUNG / URBAN ENVIRONMENT',
  STUDIO = 'STUDIO LIVE / PROFESSIONAL STUDIO',
  DINING = 'MEJA MAKAN / DINING TABLE',
  VANITY = 'MEJA RIAS / VANITY TABLE',
  GRADIENT = 'MINIMALIST GRADIENT / PLAIN',
  COZY = 'LIFESTYLE / COZY ROOM',
  GARDEN = 'NATURAL OUTDOOR / GARDEN',
  DESK = 'OFFICE DESK / WORKSPACE SETUP',
  PREMIUM = 'LUXURY ROOM / PREMIUM SETTING',
  ABSTRACT = 'ABSTRACT / FLAT BACKGROUND'
}

export enum AdsObjective {
  CLICK = 'CLICK-ORIENTED',
  CONVERSION = 'CONVERSION-ORIENTED',
  TRUST = 'TRUST-ORIENTED',
  BRANDING = 'BRANDING-ORIENTED'
}

export enum VisualEmphasis {
  SHAPE = 'PRODUCT SHAPE',
  PACKAGING = 'PACKAGING/LABEL',
  TEXTURE = 'TEXTURE/MATERIAL',
  FEATURE = 'KEY FEATURE HIGHLIGHT'
}

export enum SellingAngle {
  BENEFIT = 'BENEFIT-DRIVEN',
  PROBLEM_SOLVER = 'PROBLEM SOLVER',
  LUXURY = 'LUXURY/PREMIUM',
  ECONOMY = 'ECONOMY/VALUE',
  URGENCY = 'URGENCY/SCARCITY'
}

export enum TrustBuilder {
  SOCIAL_PROOF = 'SOCIAL PROOF/REVIEWS',
  CERTIFICATION = 'CERTIFICATION/BADGE',
  GUARANTEE = 'WARRANTY/GUARANTEE',
  EXPERTISE = 'EXPERT ENDORSEMENT',
  NONE = 'NONE/MINIMALIST'
}

export enum MarketingStyle {
  PERSONAL = 'PERSONAL BRANDING',
  TREADMILL = 'TREADMILL LOOP',
  AESTHETIC_HANDS = 'AESTHETIC HANDS',
  MIRROR = 'FOTO MIRROR',
  FOOD = 'FOOD PROMO',
  PROPERTY = 'PROMO PROPERTI',
  UGC = 'UGC CONTENT',
  CUSTOM = 'CUSTOM STYLE'
}

export enum LightingPreset {
  SOFT_CLEAN = 'SOFT & CLEAN',
  BRIGHT_COMMERCIAL = 'BRIGHT COMMERCIAL',
  HIGH_CONTRAST = 'HIGH CONTRAST ADS',
  PREMIUM_SHADOW = 'PREMIUM SOFT SHADOW'
}

export enum CompositionPreset {
  CENTER = 'CENTER FOCUS',
  RULE_OF_THIRDS = 'RULE OF THIRDS',
  CLOSE_UP = 'CLOSE-UP DETAIL',
  HERO = 'HERO SHOT'
}

export enum ImageSize {
  K1 = '1K',
  K2 = '2K',
  K4 = '4K'
}

export enum ResolutionLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '9:16' | '16:9' | '21:9' | '4:5';

export interface ImageFile {
  id: string;
  url: string;
  data: string; // base64
  mimeType: string;
  role?: 'character' | 'product' | 'background';
}

export interface SimilarityControls {
  character: number;
  product: number;
  background: number;
}

export interface Locks {
  character: boolean;
  product: boolean;
}

export interface AdsOptimizationSettings {
  objective: AdsObjective;
  emphasis: VisualEmphasis;
  lighting: LightingPreset;
  composition: CompositionPreset;
  marketingStyles: MarketingStyle[];
  sellingAngle: SellingAngle;
  trustBuilder: TrustBuilder;
}

export interface AnalysisResult {
  identityDna: string;
  styleReport: string;
  consistencyGuidelines: string;
  conversionOptimization?: string;
  compositionPlan: string;
  caption?: string;
  hashtags?: string;
  voScript?: string;
}

export interface SceneData {
  sceneId: number;
  description: string;
  voScript: string;
  imageUrl?: string;
  promptVideo?: string;
  jsonPromptVideo?: any;
}

export interface ProductionScript {
  strategy: string;
  hook: string;
  storylines: string[];
  selectedStorylineIndex?: number;
  scenes: SceneData[];
  caption: string;
  hashtags: string;
}
