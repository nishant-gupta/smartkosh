import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

function getS3Client() {
  if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('Missing required AWS credentials');
  }

  return new S3Client({
    region: process.env.AWS_REGION as string,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  });
}

export async function uploadToS3(fileName: string, fileContent: string) {
  console.log('Uploading to S3');
  console.log(process.env.AWS_REGION);
  console.log(process.env.AWS_BUCKET_NAME);
  console.log(fileName);
  const s3Client = getS3Client();
  
  return s3Client.send(new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    Body: fileContent,
  }));
} 