import { google } from 'googleapis';
import googleApiConfig from '../config/googleApiConfig';

const oauth2Client = new google.auth.OAuth2(
  googleApiConfig.clientId,
  googleApiConfig.clientSecret,
  googleApiConfig.redirectUri
);

oauth2Client.setCredentials({
  refresh_token: googleApiConfig.refreshToken
});

const drive = google.drive({
  version: 'v3',
  auth: oauth2Client,
});

export const uploadFile = async (file, folderId = null) => {
  try {
    const response = await drive.files.create({
      requestBody: {
        name: file.name,
        mimeType: file.type,
        parents: folderId ? [folderId] : []
      },
      media: {
        mimeType: file.type,
        body: file
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export const listFiles = async (folderId = null) => {
  try {
    const response = await drive.files.list({
      q: folderId ? `'${folderId}' in parents` : null,
      fields: 'files(id, name, mimeType, webViewLink, createdTime)',
    });
    return response.data.files;
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
};

export const deleteFile = async (fileId) => {
  try {
    await drive.files.delete({
      fileId: fileId,
    });
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

export const createFolder = async (folderName, parentFolderId = null) => {
  try {
    const response = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentFolderId ? [parentFolderId] : []
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
};
