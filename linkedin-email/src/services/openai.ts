import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Note: In production, you should use a backend server
});

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export const generateResponse = async (
  message: string,
  selectedText: string,
  conversationHistory: Message[] = []
): Promise<string> => {
  try {
    // create a regex parser for later
    const messages: Message[] = [
      {
        role: "system",
        content: `You are Caret, a helpful AI assistant. You are knowledgeable, friendly, and concise in your responses. 
        When sharing code snippets or suggesting revisions, always wrap them in backticks (\`like this\`). 
        For mathematical expressions:
        - For inline math, wrap the LaTeX in single dollar signs ($...$)
        - For display math (equations on their own line), wrap the LaTeX in double dollar signs ($$...$$)
        - Never use square brackets [ ] for math equations
        - Always use LaTeX notation, for example:
          * Inline: $\\nabla f$
          * Display: $$\\nabla f = \\left(\\frac{\\partial f}{\\partial x_1}, \\frac{\\partial f}{\\partial x_2}, \\ldots, \\frac{\\partial f}{\\partial x_n}\\right)$$
        ${
          selectedText
            ? `You are given a selected text from the user's browser and you are to respond to the user's message based on the selected text: ${selectedText}.`
            : ""
        }`,
      },
      ...conversationHistory,
      { role: "user", content: message },
    ];

    const completion = await openai.chat.completions.create({
      messages,
      model: "gpt-3.5-turbo",
    });

    return (
      completion.choices[0]?.message?.content ??
      "I apologize, but I couldn't generate a response."
    );
  } catch (error) {
    console.error("Error generating response:", error);
    return "I apologize, but I encountered an error while processing your request.";
  }
};
