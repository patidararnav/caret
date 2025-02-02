import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, you should use a backend server
});

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export const generateResponse = async (message: string, conversationHistory: Message[] = []): Promise<string> => {
  try {
    const messages: Message[] = [
      { 
        role: "system", 
        content: "You are Caret, a helpful AI assistant. You are knowledgeable, friendly, and concise in your responses." 
      },
      ...conversationHistory,
      { role: "user", content: message }
    ];

    const completion = await openai.chat.completions.create({
      messages,
      model: "gpt-3.5-turbo",
    });

    return completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response.";
  } catch (error) {
    console.error('Error generating response:', error);
    return "I apologize, but I encountered an error while processing your request.";
  }
}; 