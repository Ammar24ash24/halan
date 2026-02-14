
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeScreen = async (base64Image: string): Promise<AnalysisResult> => {
  const model = ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image.split(',')[1],
            },
          },
          {
            text: `قم بتحليل هذه الصورة التي تمثل شاشة هاتف بدقة عالية جداً. 
1. استخرج أي سؤال أو مسألة تظهر في الشاشة.
2. إذا كان السؤال اختيار من متعدد (Multiple Choice)، قم بتحديد جميع الخيارات المتاحة.
3. قدم الإجابة الصحيحة والنموذجية.
4. **هام جداً**: إذا كان هناك خيارات على الشاشة، حدد بوضوح أي خيار هو الصحيح (مثلاً: "الخيار الثاني" أو نص الخيار نفسه).
5. يجب أن تكون جميع المخرجات باللغة العربية.

أريد النتيجة بتنسيق JSON حصراً:
{
  "question": "نص السؤال المستخرج كاملاً",
  "answer": "شرح الإجابة بالتفصيل",
  "selectedOption": "النص الدقيق للخيار الصحيح كما يظهر في الشاشة (اتركه فارغاً إذا لم يكن سؤال اختياري)"
}`
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          answer: { type: Type.STRING },
          selectedOption: { type: Type.STRING }
        },
        required: ["question", "answer"]
      }
    }
  });

  const response = await model;
  const result = JSON.parse(response.text || '{}');
  return result as AnalysisResult;
};
