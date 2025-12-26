
import { Wand2, Box, Scissors, Ruler, Monitor, Cpu, Sparkles, Dog } from 'lucide-react';
import { Preset } from './types';

export const PROMPTS = {
  SQUIGGLE: `Role: Master Creative Coder specializing in organic "Husky-style" CSS animations.
Objective: Create a complex, animated CSS illustration of [SUBJECT] using the "Squigglevision" technique.

Technical Blueprint (Follow strictly):
1. **The Canvas**: A .canvas wrapper with "animation: squiggly-anim 0.3s infinite;".
2. **SVG Filters**: Include the 5-part <svg> block (#squiggly-0 through #squiggly-4) with feTurbulence (baseFrequency="0.02") and feDisplacementMap.
3. **Recursive Nesting (The Tail/Tentacle Pattern)**: For flexible parts like tails or spines, use recursive nesting (div > div > div...). Animate the rotation of these nested segments with slight offsets to create fluid, whip-like motion.
4. **Hierarchical Rigging**: Use a deeply nested DOM. For example, Head contains Face, which contains Eyes and Mouth. Body contains Limbs. 
5. **Joint Mechanics**: Set "transform-origin" strategically (e.g., bottom-center for a head, center-right for a tail segment).
6. **Pseudo-Element Mastery**: Use ::before and ::after extensively on every part to create complex shapes (ears, highlights, secondary fur/armor) without polluting the main DOM.
7. **Animation Easing**: Use "cubic-bezier(0.645, 0.045, 0.355, 1)" for all movement to ensure an organic, high-end feel.
8. **Color Palette**: Use CSS Variables (:root) for primary, secondary, light, and shadow colors.

Output: Provide ONLY the raw HTML/CSS starting with <!DOCTYPE html>.`,

  NEON: `Role: Technical SFX Rigging Specialist.
Objective: Create a neon "Cybernetic Skeleton" of [SUBJECT].
Rules:
1. **Wireframe Aesthetic**: Dark background (#050505), 1px neon borders, and intense box-shadow glows.
2. **Skeletal Structure**: Every "bone" should be a nested div with a visible joint. 
3. **Mechanical Kinematics**: Use linear or stepped timing for a "robotized" feel. 
4. **Circuitry Detail**: Use ::before/::after to add "circuit nodes" at every joint.
5. **Scanning Effect**: Add a vertical scanning line using a pseudo-element on the main wrapper.`,

  CUTOUT: `Role: Expert Digital Puppeteer & Paper Artist.
Objective: Create a "Paper Cutout" stop-motion animation of [SUBJECT].
Rules:
1. **Layered Depth**: Apply varying levels of drop-shadow (box-shadow: 2px 2px 8px rgba(0,0,0,0.4)) to every element to simulate stacked paper.
2. **Pin-Joints**: Use circular ::after elements at joints to look like brass fasteners.
3. **Stop-Motion Timing**: Use "steps(4)" or "steps(2)" for all animations to simulate low frame-rate puppetry.
4. **Recursive Parts**: Flexible parts should still use the recursive div-nesting method but with rigid, non-bending "paper" segments.`,

  BLUEPRINT: `Role: Senior Industrial Concept Designer.
Objective: Create a technical "Engineering Blueprint" of [SUBJECT].
Rules:
1. **Styling**: Engineering blue background (#003366) with a subtle grid. White, 1px dashed/solid strokes.
2. **Annotation**: Use absolute positioned ::before elements to draw "leader lines" and small labels naming parts of the subject.
3. **Drafting Animation**: Parts should "vibrate" slightly or have "scanning" gradients pass through them.
4. **Measurement Lines**: Add technical dimension lines using pseudo-elements.`,

  RETRO: `Role: 16-Bit Pixel Artist.
Objective: Create a "CRT-style" sprite animation of [SUBJECT].
Rules:
1. **Voxel/Pixel Build**: Construct the subject from many small squares or use heavy "border-radius: 0".
2. **CRT Effect**: A full-screen scanline overlay using a repeating linear-gradient.
3. **Limited Palette**: 16 colors maximum.
4. **Frame-by-Frame**: Use "steps(1)" timing only. No smooth transitions.`,

  HUSKY_MASTER: `Role: Elite CSS Motion Designer (Inspired by the "Husky" Masterpiece).
Objective: Create a top-tier organic character animation of [SUBJECT].
Rules:
1. **The Golden Standard**: Emulate the "Husky" CSS architecture.
2. **Sophisticated State Management**: Use multi-step keyframes (0, 10%, 25%, 50%, 75%, 100%) to give the character personality (blinking, breathing, tail wagging, ear twitching).
3. **Physics**: Limbs should have secondary motion (follow-through).
4. **Visual Polish**: Use semi-transparent overlays for fur/texture and gradients for depth.
5. **Responsiveness**: Use "vmin" units for all sizes to ensure perfect scaling.`,
};

export const PRESETS: Preset[] = [
  { 
    id: 'husky', 
    name: 'Organic Masterpiece', 
    description: 'Elite hierarchical character rigging.', 
    icon: Dog, 
    prompt: PROMPTS.HUSKY_MASTER 
  },
  { 
    id: 'squiggle', 
    name: 'Squigglevision', 
    description: 'Hand-drawn wobbly animation style.', 
    icon: Wand2, 
    prompt: PROMPTS.SQUIGGLE 
  },
  { 
    id: 'neon', 
    name: 'Neon Wireframe', 
    description: 'Sci-fi skeletal structure visualizations.', 
    icon: Box, 
    prompt: PROMPTS.NEON 
  },
  { 
    id: 'cutout', 
    name: 'Paper Cutout', 
    description: 'Layered stop-motion puppet aesthetic.', 
    icon: Scissors, 
    prompt: PROMPTS.CUTOUT 
  },
  { 
    id: 'blueprint', 
    name: 'Blueprint Schematic', 
    description: 'Technical engineering drawing style.', 
    icon: Ruler, 
    prompt: PROMPTS.BLUEPRINT 
  },
  { 
    id: 'retro', 
    name: 'Retro Pixel CRT', 
    description: 'Classic game console look and feel.', 
    icon: Monitor, 
    prompt: PROMPTS.RETRO 
  },
];
