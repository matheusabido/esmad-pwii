import logger from "@/service/logger.js";
import s3Client from "@/service/s3.js";
import { DeleteObjectsCommand } from "@aws-sdk/client-s3";

export async function s3DeleteKeys(keys: string[]) {
  if (!keys.length) {
    return;
  }

  logger.debug("Deleting the following keys from S3: " + keys.join(", "));
  try {
    const deleteResult = await s3Client.send(
      new DeleteObjectsCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Delete: {
          Objects: keys.map((key) => ({ Key: key })),
          Quiet: true,
        },
      }),
    );
    deleteResult.Errors?.forEach((error) => {
      logger.error(
        `Failed to delete key ${error.Key} from S3: ${error.Message} (Code: ${error.Code}). Manual intervention may be required to delete this key.`,
      );
    });

    logger.debug(
      `${keys.length} keys deleted from S3. ${deleteResult.Errors?.length || 0} errors occurred.`,
    );
  } catch (deleteError) {
    logger.error(
      deleteError,
      "An error occurred while trying to delete files from S3. Manual intervention may be required to delete the following keys: " +
        keys.join(", "),
    );
  }
}
