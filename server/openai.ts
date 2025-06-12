import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

interface GeneratedStrategy {
  name: string;
  description: string;
  code: string;
  parameters: Record<string, any>;
  explanation: string;
}

export async function generateStrategy(prompt: string): Promise<GeneratedStrategy> {
  try {
    const systemPrompt = `You are an expert algorithmic trading strategy developer. Based on the user's natural language description, generate a complete JavaScript trading strategy code.

The strategy should:
1. Use the provided sandbox environment with functions: buy(), sell(), sma(), rsi()
2. Access historical data through the 'data' object
3. Implement proper risk management
4. Be production-ready and well-commented
5. Use realistic trading logic

Available functions in sandbox:
- buy(symbol, quantity, price, timestamp) - Execute buy order
- sell(symbol, quantity, price, timestamp) - Execute sell order  
- sma(prices, period) - Simple Moving Average
- rsi(prices, period) - Relative Strength Index
- data[symbol] - Array of historical data points with {timestamp, open, high, low, close, volume}
- portfolio - Object with {cash, positions}
- parameters - Strategy parameters object

Respond with JSON containing:
{
  "name": "Strategy Name",
  "description": "Brief description",
  "code": "Complete JavaScript code",
  "parameters": {"param1": value1, "param2": value2},
  "explanation": "Detailed explanation of the strategy logic"
}

Make the strategy realistic and profitable based on sound trading principles.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Generate a trading strategy based on this description: ${prompt}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Validate the response has required fields
    if (!result.name || !result.code || !result.description) {
      throw new Error("Generated strategy is missing required fields");
    }

    return {
      name: result.name,
      description: result.description,
      code: result.code,
      parameters: result.parameters || {},
      explanation: result.explanation || "",
    };
  } catch (error) {
    console.error("Error generating strategy with OpenAI:", error);
    throw new Error(`Failed to generate strategy: ${error.message}`);
  }
}

export async function optimizeStrategy(
  strategyCode: string,
  backtestResults: any,
  improvementGoal: string
): Promise<GeneratedStrategy> {
  try {
    const systemPrompt = `You are an expert trading strategy optimizer. Given a strategy code and its backtest results, optimize the strategy to improve performance.

Focus on:
1. Risk management improvements
2. Entry/exit signal optimization
3. Parameter tuning
4. Performance enhancement

Respond with JSON containing the optimized strategy:
{
  "name": "Optimized Strategy Name",
  "description": "Description of improvements made",
  "code": "Optimized JavaScript code",
  "parameters": {"param1": value1, "param2": value2},
  "explanation": "Explanation of optimizations made"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Optimize this strategy:
          
Original Code:
${strategyCode}

Backtest Results:
${JSON.stringify(backtestResults, null, 2)}

Improvement Goal: ${improvementGoal}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 2000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      name: result.name,
      description: result.description,
      code: result.code,
      parameters: result.parameters || {},
      explanation: result.explanation || "",
    };
  } catch (error) {
    console.error("Error optimizing strategy with OpenAI:", error);
    throw new Error(`Failed to optimize strategy: ${error.message}`);
  }
}

export async function explainStrategy(strategyCode: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a trading expert. Explain the given trading strategy code in simple terms, including its logic, entry/exit conditions, and risk management.",
        },
        {
          role: "user",
          content: `Explain this trading strategy code:\n\n${strategyCode}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    return response.choices[0].message.content || "Unable to explain strategy";
  } catch (error) {
    console.error("Error explaining strategy with OpenAI:", error);
    throw new Error(`Failed to explain strategy: ${error.message}`);
  }
}
