
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

// Implement audio encoding manually as per guidelines
export const encodeAudio = (bytes: Uint8Array) => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Implement audio decoding manually as per guidelines
export const decodeAudio = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const startLiveSession = async (
  onScore: (score: number, feedback: string) => void,
  systemPrompt: string = "You are a Battle Referee. Listen to the user's spoken English. Evaluate their pronunciation and grammar. Return JSON with 'score' (0-100) and 'feedback' in the text field when turn is complete."
) => {
  // Use process.env.API_KEY directly as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: systemPrompt,
      outputAudioTranscription: {},
      inputAudioTranscription: {},
    },
    callbacks: {
      onopen: () => console.log('Live Session Connected'),
      onmessage: async (message: LiveServerMessage) => {
        // Handle model turn completions and transcriptions
        if (message.serverContent?.turnComplete) {
           console.log("Turn complete");
        }
        if (message.serverContent?.outputTranscription) {
            const text = message.serverContent.outputTranscription.text;
            // Simulated scoring logic from text parsing
            if (text.includes("Score:") || text.includes("score:")) {
                const match = text.match(/score:?\s*(\d+)/i);
                if (match) onScore(parseInt(match[1]), text);
            }
        }
        // Even when handling transcriptions, you must still acknowledge model turn parts
        const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (base64EncodedAudioString) {
          // Model returned audio data
        }
      },
      onerror: (e) => console.error('Live Error', e),
      onclose: () => console.log('Live Session Closed'),
    },
  });

  return sessionPromise;
};

// Custom raw PCM decoder as browser's decodeAudioData doesn't support raw streams
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
