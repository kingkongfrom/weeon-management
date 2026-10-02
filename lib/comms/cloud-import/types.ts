export type DropboxCloudImport = {
  source: "dropbox";
  name: string;
  url: string;
  bytes?: number;
};

export type GoogleDriveCloudImport = {
  source: "google-drive";
  name: string;
  fileId: string;
  mimeType: string;
  accessToken: string;
  bytes?: number;
};

export type CloudImportRef = DropboxCloudImport | GoogleDriveCloudImport;
