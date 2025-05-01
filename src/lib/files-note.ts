import {
  BuildPathParams,
  DeleteImageParams,
  GetImageUrlParams,
  S3Url,
} from "@/types/files-notes.type";
import { UploadImageParams } from "@/types/files-notes.type";
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import slugify from "slugify";

const appBucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_REGION as string;

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

const buildPath = (params: BuildPathParams) => {
  const slugifiedFileName = slugify(params.fileName, {
    lower: true,
  });
  const slugifiedUserName = slugify(params.userName, {
    lower: true,
  });
  return `${slugifiedUserName}/${params.noteId}/${slugifiedFileName}`;
};

export async function uploadImage(
  image: Buffer,
  params: UploadImageParams,
): Promise<{ url: string; fileName: string }> {
  const random = Math.random().toString(36).substring(2, 10);
  const fileName = `${random}-${params.fileName}`;
  const path = buildPath({ ...params, fileName });

  const command = new PutObjectCommand({
    Bucket: appBucketName,
    Key: path,
    Body: image,
  });
  await s3Client.send(command);
  const url = `https://${appBucketName}.s3.${region}.amazonaws.com/${path}`;
  return { url, fileName };
}

export async function deleteImage(params: DeleteImageParams) {
  const path = buildPath(params);
  try {
  const command = new DeleteObjectCommand({
    Bucket: appBucketName,
    Key: path,
  });
  await s3Client.send(command);
} catch (error) {
    // mitigation, after changing to writeroom-app-dev. Try appBucketName to be writeroom-app if this fails
    const command = new DeleteObjectCommand({
      Bucket: "writeroom-app",
      Key: path,
    });
    await s3Client.send(command);
  }
}

export async function downloadImage(
  params: GetImageUrlParams,
): Promise<Buffer> {
  const { s3Url } = params;
  const response = await fetch(s3Url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch image from S3, got status: ${response.status}`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
