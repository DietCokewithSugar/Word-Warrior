
import { GoogleGenAI, Type } from "@google/genai";

// Use process.env.API_KEY directly as per SDK guidelines
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const gradeWriting = async (topic: string, content: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `请根据语法、词汇和相关性对以下写作练习进行评分。
    题目: ${topic}
    内容: ${content}`,
    config: {
      systemInstruction: "你是一位英语老师。对写作任务进行 0 到 100 的评分。返回一个包含 'score'（数字）、'feedback'（中文反馈字符串）和 'corrections'（改进建议数组）的 JSON 对象。",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          feedback: { type: Type.STRING },
          corrections: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["score", "feedback"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    return { score: 0, feedback: "评分出错" };
  }
};

export const getExplanation = async (question: string, userAnswer: string, correctAnswer: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `请解释为什么在这个问题中 '${userAnswer}' 是错误的，而 '${correctAnswer}' 是正确的：${question}`,
    config: {
      systemInstruction: "你是一位专业的考试辅导英语老师。请用中文提供清晰、简练的解释。"
    }
  });
  return response.text;
};

export const generateQuiz = async (category: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `为 TOEFL 或 IELTS 等英语考试生成一个高难度的 ${category} 题目。`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          prompt: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctAnswer: { type: Type.STRING },
          explanation: { type: Type.STRING }
        },
        required: ["prompt", "options", "correctAnswer"]
      }
    }
  });
  return JSON.parse(response.text);
};
