export type S3Url = string;

export interface UploadImageParams {
  fileName: string;
  noteId: string;
  userName: string;
}


export interface DeleteImageParams {
  fileName: string;
  noteId: string;
  userName: string;
}

export interface GetImageUrlParams {
  s3Url: string;
}

export interface BuildPathParams {
  fileName: string;
  noteId: string;
  userName: string;
}
