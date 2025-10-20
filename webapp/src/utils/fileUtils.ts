export const getFullFileUrl = (fileUrl: string) => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // If it's an S3 URL, convert it to use backend file endpoint
  const s3Endpoint = import.meta.env.VITE_S3_ENDPOINT || 'https://storage.yandexcloud.net';
  if (fileUrl.includes(s3Endpoint)) {
    // Extract the file path after bucket name
    const parts = fileUrl.split(s3Endpoint + '/')[1];
    if (parts) {
      // Remove bucket name from path: bucket/folder/file -> folder/file
      const filePath = parts.split('/').slice(1).join('/');
      return `${baseUrl}/upload/file/${filePath}`;
    }
  }

  // For legacy local paths, route through new file endpoint
  if (fileUrl.startsWith('/uploads/')) {
    const filePath = fileUrl.replace('/uploads/', '');
    return `${baseUrl}/upload/file/${filePath}`;
  }

  // Return as-is for other cases
  return fileUrl;
};

export const isImageFile = (fileName: string): boolean => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.heic'];
  return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
};

export const createDocumentFromFileUrl = (
  id: string,
  documentUrl: string,
  documentType:
    | 'client-documents'
    | 'payment-documents'
    | 'requirement-documents' = 'client-documents'
) => {
  return {
    id,
    originalName: documentUrl.includes(
      import.meta.env.VITE_S3_ENDPOINT || 'https://storage.yandexcloud.net'
    )
      ? documentUrl.split('/').pop() || documentUrl
      : documentUrl,
    fileUrl:
      documentUrl.includes(import.meta.env.VITE_S3_ENDPOINT || 'https://storage.yandexcloud.net') ||
      documentUrl.startsWith('/uploads/')
        ? documentUrl
        : `/uploads/${documentType}/${documentUrl}`,
  };
};
