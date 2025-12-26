
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiModel } from "../types";

export const generateAnimationCode = async (
  model: string,
  systemInstruction: string,
  userPrompt: string,
  visualContext?: string, // base64 image data
  isOpenRouter: boolean = false,
  openRouterKey?: string,
  originalCode?: string // Optional original code for surgical iteration
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
    2. PRESERVE the existing DOM structure and CSS variable names where possible.
    3. ONLY modify the specific CSS properties or keyframes needed to address the critique provided in the user prompt.
    4. Focus on fixing timing, transform-origins, or layering issues without breaking the original design.
  ` : "";

  const enhancedSystemInstruction = `
    ${systemInstruction}
    
    ${iterationInstruction}

    CRITICAL TECHNICAL REQUIREMENTS:
    - ALWAYS use hierarchical DOM nesting (Head > Face > Eye).
    - For flexible parts, use recursive <div> nesting (Tail > Tail > Tail) to create jointed kinematic chains.
    - Leverage ::before and ::after pseudo-elements for detail.
    - Use "transform-origin" correctly at every joint.
    - Use "cubic-bezier(0.645, 0.045, 0.355, 1)" for fluid, organic character movement.
    - Use "vmin" units for responsiveness.
    - Return ONLY valid, single-file HTML code.
  `;

  const contents: any[] = [
    { text: isIteration 
      ? `Original Code to Optimize:\n${originalCode}\n\nTask: Surgically improve this animation based on these instructions: ${userPrompt}`
      : `Design and code a high-quality CSS animation of: ${userPrompt}` 
    }
  ];

  if (visualContext) {
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
        temperature: isIteration ? 0.4 : 0.8, // Lower temperature for iteration to prevent wild deviations
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
  frames: string[], // Array of base64 images
  originalPrompt: string,
  originalCode: string
): Promise<{ critique: string; improvedPrompt: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const promptParts = [
    { text: "Analyze this CSS animation sequence. Identify specific technical flaws in motion, timing, or structure." },
    { text: `Original Intent: ${originalPrompt}` },
    { text: `Your Task: Identify exactly what is WRONG with the current implementation. Do not suggest a redesign. Suggest specific surgical fixes (e.g., 'Change the transform-origin of the tail to right-center', 'Add a 25% keyframe to the head animation for a blink').` },
    ...frames.map(f => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: f.split(',')[1] || f
      }
    })),
    { text: `Source Code Reference:\n${originalCode}` }
  ];

  try {
    const response = await ai.models.generateContent({
      model: GeminiModel.PRO,
      contents: { parts: promptParts },
      config: {
        systemInstruction: "You are a Technical Animation Lead. Focus on precision, preservation of character design, and surgical code improvements. Return JSON with 'critique' (summary) and 'improvedPrompt' (specific technical instructions for the next model).",
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
    throw error;
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
    { role: "system", content: systemInstruction + (isIteration ? "\n\nDO NOT REDESIGN. PERFORM SURGICAL EDITS ONLY." : "") },
    {
      role: "user",
      content: visualContext 
        ? [
            { type: "text", text: isIteration ? `Original Code:\n${originalCode}\n\nTask: ${userPrompt}` : userPrompt },
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
