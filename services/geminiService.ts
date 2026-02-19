
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiModel } from "../types";

const HUSKY_FULL_REFERENCE = `
GOLDEN REFERENCE - "THE HUSKY" (CSS MASTERPIECE):
This code represents the quality floor for SquiggleGen. Use its patterns.

HTML ARCHITECTURE:
<div class="husky">
  <div class="mane"><div class="coat"></div></div>
  <div class="body">
    <div class="head">
      <div class="ear"></div><div class="ear"></div>
      <div class="face">
        <div class="eye"></div><div class="eye"></div>
        <div class="nose"></div>
        <div class="mouth"><div class="lips"></div><div class="tongue"></div></div>
      </div>
    </div>
    <div class="torso"></div>
  </div>
  <div class="legs">
    <div class="front-legs"><div class="leg"></div><div class="leg"></div></div>
    <div class="hind-leg"></div>
  </div>
  <div class="tail">
    <div class="tail"><div class="tail"><div class="tail"><div class="tail"><div class="tail"><div class="tail"><div class="tail"></div></div></div></div></div></div></div>
  </div>
</div>

CSS STRATEGIES:
1. **Recursive Nesting**: flexible parts (tails, necks) must use nested divs (div > div > div). Each child rotates relative to its parent to create a fluid, jointed curve.
2. **Transform Origins**: Crucial for rigging. Tails origin at 'center right'. Heads at 'bottom center'.
3. **Squigglevision**: The main character wrapper must have "animation: squiggly-anim 0.3s infinite;".
4. **SVG Filters**: Include 5 filters (#squiggly-0 through #squiggly-4) using feTurbulence (baseFrequency 0.02) to create the wobbly line effect.
5. **Organic Easing**: ALWAYS use "cubic-bezier(0.645, 0.045, 0.355, 1)".
6. **Pseudo-Detail**: Detail like fur, highlights, pupils, and shadows MUST be ::before and ::after elements.
7. **Complex Keyframing**: Use many steps (e.g., 0, 10, 25, 50, 75, 100) to create personality-driven motion (blinks, twitches, breathing).
`;

export const generateAnimationCode = async (
  model: string,
  systemInstruction: string,
  userPrompt: string,
  visualContext?: string,
  isOpenRouter: boolean = false,
  openRouterKey?: string,
  originalCode?: string
): Promise<string> => {
  if (isOpenRouter && openRouterKey) {
    return callOpenRouter(model, systemInstruction, userPrompt, visualContext, openRouterKey, originalCode);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const isPro = model === GeminiModel.PRO;
  const isIteration = !!originalCode;

  const iterationInstruction = isIteration ? `
    ITERATION MODE ENABLED:
    You are performing a surgical update to an existing animation. 
    1. DO NOT redesign the character or core aesthetic.
    2. PRESERVE the existing DOM structure and CSS variable names.
    3. ONLY modify the specific CSS properties or keyframes needed to fix the identified bugs.
    4. Focus on fixing timing, transform-origins, or layering issues.
  ` : "";

  const enhancedSystemInstruction = `
    ${systemInstruction}
    
    ${HUSKY_FULL_REFERENCE}

    ${iterationInstruction}

    CRITICAL TECHNICAL REQUIREMENTS:
    - ALWAYS use hierarchical DOM nesting.
    - Recursive <div> nesting for fluid, whip-like parts.
    - Leverage ::before and ::after pseudo-elements for detail.
    - Return ONLY valid, single-file HTML code with embedded <style>.
  `;

  const contents: any[] = [
    { text: isIteration 
      ? `Original Code to Optimize:\n${originalCode}\n\nTask: Improve this animation surgically: ${userPrompt}`
      : `Design and code a high-quality CSS animation based on the Husky Golden Standard: ${userPrompt}` 
    }
  ];

  if (visualContext && visualContext !== "SIMULATED_SCREENSHOT_DATA") {
    contents.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: visualContext.split(',')[1] || visualContext
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: contents },
      config: {
        systemInstruction: enhancedSystemInstruction,
        temperature: isIteration ? 0.3 : 0.7,
        thinkingConfig: isPro ? { thinkingBudget: 8000 } : undefined,
      },
    });

    return stripMarkdown(response.text || "");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const analyzeVideoFrames = async (
  frames: string[],
  originalPrompt: string,
  originalCode: string
): Promise<{ critique: string; improvedPrompt: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const promptParts = [
    { text: "Analyze this CSS animation sequence. Identify technical flaws in motion, timing, or structure." },
    { text: `Original Intent: ${originalPrompt}` },
    { text: `Your Task: Identify exactly what is WRONG. Suggest surgical fixes, not redesigns.` },
    ...frames.map(f => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: f.split(',')[1] || f
      }
    })).slice(0, 3), 
    { text: `Source Code Reference:\n${originalCode}` }
  ];

  try {
    const response = await ai.models.generateContent({
      model: GeminiModel.PRO,
      contents: { parts: promptParts },
      config: {
        systemInstruction: "You are a Technical Animation Lead. Focus on precision and surgical code improvements. Return JSON with 'critique' and 'improvedPrompt'.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            critique: { type: Type.STRING },
            improvedPrompt: { type: Type.STRING }
          },
          required: ["critique", "improvedPrompt"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Video Analysis Error:", error);
    return { critique: "Analysis failed", improvedPrompt: "Improve movement fluidity and timing." };
  }
};

const callOpenRouter = async (
  model: string,
  systemInstruction: string,
  userPrompt: string,
  visualContext: string | undefined,
  apiKey: string,
  originalCode?: string
): Promise<string> => {
  const isIteration = !!originalCode;
  
  const messages: any[] = [
    { role: "system", content: systemInstruction + "\n\n" + HUSKY_FULL_REFERENCE + (isIteration ? "\n\nSURGICAL EDITS ONLY. DO NOT REDESIGN." : "") },
    {
      role: "user",
      content: visualContext && visualContext !== "SIMULATED_SCREENSHOT_DATA"
        ? [
            { type: "text", text: isIteration ? `Code:\n${originalCode}\n\nTask: ${userPrompt}` : userPrompt },
            { type: "image_url", image_url: { url: visualContext } }
          ]
        : (isIteration ? `Original Code:\n${originalCode}\n\nTask: ${userPrompt}` : userPrompt)
    }
  ];

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: isIteration ? 0.3 : 0.8
    })
  });

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";
  return stripMarkdown(text);
};

const stripMarkdown = (text: string): string => {
  let cleaned = text.trim();
  const htmlMatch = cleaned.match(/```html([\s\S]*?)```/);
  if (htmlMatch) return htmlMatch[1].trim();
  const genericMatch = cleaned.match(/```([\s\S]*?)```/);
  if (genericMatch) return genericMatch[1].trim();
  return cleaned;
};
