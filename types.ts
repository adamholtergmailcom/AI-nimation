
import { LucideIcon } from 'lucide-react';

export enum GeminiModel {
  FLASH = 'gemini-3-flash-preview',
  PRO = 'gemini-3-pro-preview',
  FLASH_LITE = 'gemini-flash-lite-latest'
}

export interface OpenRouterModel {
  id: string;
  name: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon | string; // Support string for custom icons
  prompt: string;
  isCustom?: boolean;
}

export type ViewMode = 'preview' | 'code' | 'settings' | 'autoloop';

export interface AutoLoopStatus {
  active: boolean;
  currentLoop: number;
  totalLoops: number;
  phase: 'idle' | 'generating' | 'capturing' | 'analyzing' | 'improving';
  feedback?: string;
}
