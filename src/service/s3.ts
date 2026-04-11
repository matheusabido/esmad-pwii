import {
  CreateBucketCommand,
  GetBucketAclCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  endpoint: process.env.S3_ENDPOINT!,
  forcePathStyle: true,
});

export async function initS3() {
  try {
    await s3Client.send(
      new GetBucketAclCommand({ Bucket: process.env.S3_BUCKET_NAME! }),
    );
  } catch (error: any) {
    if (error.name === "NoSuchBucket") {
      try {
        await s3Client.send(
          new CreateBucketCommand({ Bucket: process.env.S3_BUCKET_NAME! }),
        );
      } catch (err) {
        console.error("Error creating S3 bucket:", err);
        throw err;
      }
    }
  }
}

export default s3Client;
