import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/lib/auth-options";
import { invokeGenerateInsights } from "@/lib/aws/lambda";
import { INSIGHTS_TYPES } from "@/utils/constants";

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

    // create background job to generate insights
    const insightsType = (await req.json())?.type || INSIGHTS_TYPES.FINANCIAL_INSIGHTS.value;
    
    // Create a new background job for processing
    const jobId = `job_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    
    // Insert job record using raw SQL
    await prisma.$executeRaw`
      INSERT INTO "BackgroundJob" (
        id,
        "userId",
        type,
        status,
        progress,
        result,
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${jobId},
        ${userId},
        'INSIGHTS_GENERATION',
        'pending',
        0,
        ${JSON.stringify({ userId: userId, insightsType: insightsType })}::jsonb,
        NOW(),
        NOW()
      )
    `;

    console.debug('Job created', jobId);

    // call lambda function to generate insights
    const lambdaResponse = await invokeGenerateInsights(jobId, userId, insightsType);

    console.debug('Lambda response', lambdaResponse);

    return NextResponse.json({ jobId });
  } catch (error) {
    console.error("Error generating insights:", error);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
} 