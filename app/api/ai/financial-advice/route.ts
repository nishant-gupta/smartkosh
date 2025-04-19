import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to use this feature" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { question } = body;

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // You can augment this with user data from the database
    // for more personalized responses
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `You are a personal finance assistant. 
          Provide helpful, accurate, and concise financial advice. 
          Focus on practical tips that are actionable and personalized.`
        },
        {
          role: "user",
          content: question
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return NextResponse.json({
      advice: response.choices[0].message.content
    });
  } catch (error) {
    console.error('AI advice error:', error);
    return NextResponse.json(
      { error: "Failed to generate financial advice" },
      { status: 500 }
    );
  }
} 