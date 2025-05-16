import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

function getLambdaClient() {
  if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('Missing required AWS credentials');
  }

  return new LambdaClient({
    region: process.env.AWS_REGION as string,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  });
}

export async function invokeProcessCSV(jobId: string, bucket: string, key: string, userId: string, accountId: string) {
  const lambdaClient = getLambdaClient();
  
  return lambdaClient.send(new InvokeCommand({
    FunctionName: process.env.AWS_LAMBDA_FN_NAME as string,
    Payload: JSON.stringify({
      jobId,
      data: {
        bucket,
        key,
        userId,
        accountId,
      }
    }),
  }));
} 

export async function invokeProcessFinancialSummary(jobId: string, userId: string, accountId: string) {
  const lambdaClient = getLambdaClient();
  
  return lambdaClient.send(new InvokeCommand({
    FunctionName: process.env.AWS_LAMBDA_SUMMARY_FN_NAME as string,
    Payload: JSON.stringify({
      jobId,
      data: {
        userId,
        accountId,
      }
    }),
  }));
}