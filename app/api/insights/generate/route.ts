import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/app/lib/auth-options";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json(
        { error: "User not properly authenticated" },
        { status: 401 }
      );
    }

    // Fetch user's financial data
    const [profile, financialProfile, financialGoals, financialSummaries] = await Promise.all([
      prisma.profile.findUnique({
        where: { userId },
        select: {
          dob: true,
          phone: true,
          address: true,
        }
      }),
      prisma.financialProfile.findUnique({
        where: { userId },
        select: {
          yearlyIncome: true,
          occupation: true,
          incomeSource: true,
          taxBracket: true,
          savingsGoal: true,
          financialGoals: true,
        }
      }),
      prisma.financialGoal.findMany({
        where: { userId },
        select: {
          title: true,
          description: true,
          goalType: true,
          targetAmount: true,
          currentAmount: true,
          targetDate: true,
          status: true,
          monthlyContributionEstimate: true,
        }
      }),
      prisma.financialSummary.findMany({
        where: { userId },
        orderBy: [
          { year: 'desc' },
          { month: 'desc' }
        ],
        take: 12, // Last 12 months
        select: {
          year: true,
          month: true,
          category: true,
          type: true,
          amount: true,
        }
      })
    ]);

    // Prepare the prompt for OpenAI
    const prompt = `You are a financial advisor AI assistant.

Based on the following user profile and financial summary, suggest 2 realistic short- or long-term financial goals. Then, assess their current financial situation and determine if they are on track to achieve these goals. If not, provide actionable steps to get back on track.

Return response as structured JSON.

---

User Profile:
- Age: ${profile?.dob ? Math.floor((new Date().getTime() - new Date(profile.dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : 'Unknown'}
- Occupation: ${financialProfile?.occupation || 'Unknown'}
- Yearly Income: ${financialProfile?.yearlyIncome || 'Unknown'}
- Current Savings: ${financialGoals.reduce((sum, goal) => sum + goal.currentAmount, 0)}
- Monthly Investments: ${financialGoals.reduce((sum, goal) => sum + goal.monthlyContributionEstimate, 0)}
- Financial Behavior: ${financialProfile?.financialGoals || 'Not defined yet'}

Current Goals:
${financialGoals.map(goal => `- ${goal.title}: ${goal.currentAmount}/${goal.targetAmount} (${goal.status})`).join('\n')}

Recent Financial Summary (Last 12 months):
${financialSummaries.map(summary => 
  `- ${summary.year}-${summary.month}: ${summary.category} (${summary.type}): ${summary.amount}`
).join('\n')}

---

Please provide output in this format:

{
  "suggested_goals": [
    {
      "goal": "string",
      "target_amount": number,
      "deadline": "string",
      "status": "on track / off track / unknown",
      "recommendation": "string"
    }
  ]
}`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are a financial advisor AI assistant. Provide realistic, actionable financial advice based on user data."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Fix: Remove code block markers if present
    let content = response.choices[0].message.content || '{"suggested_goals": []}';
    content = content.replace(/```json|```/g, '').trim();
    const aiResponse = JSON.parse(content);

    // Create insights in the database
    const insights = await Promise.all(
      aiResponse.suggested_goals.map(async (goal: any) => {
        // Create insight first
        const insight = await prisma.insight.create({
          data: {
            userId,
            type: 'goal_suggestion',
            summary: goal.goal,
            details: goal,
            suggestedAction: goal.recommendation || '',
            confidenceScore: 0.8, // You might want to adjust this based on the AI's confidence
            status: 'new',
            generatedAt: new Date(),
          }
        });

        // Create a financial goal linked to this insight
        await prisma.financialGoal.create({
          data: {
            userId,
            title: goal.goal,
            description: goal.recommendation || '',
            goalType: 'suggestion',
            targetAmount: goal.target_amount,
            currentAmount: 0,
            targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days from now
            source: 'ai_suggestion',
            acceptedByUser: false,
            status: 'pending',
            monthlyContributionEstimate: goal.target_amount / 12, // Simple monthly estimate
            linkedInsightId: insight.id // Correct field
          }
        });

        return insight;
      })
    );

    return NextResponse.json({ insights });
  } catch (error) {
    console.error("Error generating insights:", error);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
} 