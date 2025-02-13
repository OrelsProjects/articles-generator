"use server";
// File management for the server, using s3

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import slugify from "slugify";

const s3Client = new S3Client({
  region: process.env.AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

export interface FileFunctionParams {
  publicationName: string;
  id: string;
  extension: string;
}

const buildFileId = (publicationName: string, id: string, extension: string) =>
  `${slugify(publicationName, {
    lower: true,
    strict: true,
  })}/${id}.${extension}`;

export async function getFileUrl({
  publicationName,
  id,
  extension,
}: FileFunctionParams) {
  const path = buildFileId(publicationName, id, extension);
  // it's a public bucket, so we don't need to sign the url
  const url = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${path}`;
  return url;
}

export async function uploadFile(file: Buffer, params: FileFunctionParams) {
  const path = buildFileId(params.publicationName, params.id, params.extension);
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: path,
    Body: file,
  });
  await s3Client.send(command);
  return getFileUrl(params);
}

export async function deleteFile(params: FileFunctionParams) {
  const path = buildFileId(params.publicationName, params.id, params.extension);
  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: path,
  });
  await s3Client.send(command);
}
