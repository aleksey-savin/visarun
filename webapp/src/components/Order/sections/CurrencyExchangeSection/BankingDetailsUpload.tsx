import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {Eye, Trash2, File} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { FileUpload } from '@/components/ui/file-upload.tsx';

interface UploadedFile {
    name: string;
    type?: string;
    url: string;
}

interface PendingUpload {
    filePath: string;
    fileInfo: {
        fileName?: string;
        originalName: string;
        size: number;
        mimetype?: string;
    };
}

const getMimeType = (fileName: string): string | undefined => {
    const cleanName = fileName.split('?')[0].toLowerCase();
    const ext = cleanName.split('.').pop();

    if (!ext) return undefined;

    const mimeTypes: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
        pdf: "application/pdf",
        json: "application/json",
    };

    return mimeTypes[ext] || undefined;
};

const BankingDetailsUpload = ({
    handleDocumentUpload,
    existingBankingDetails,
    handleDocumentDelete
} : {
    handleDocumentUpload: (documentUrl: string) => void;
    handleDocumentDelete: () => void;
    existingBankingDetails?: {
        id: string;
        documentUrl?: string | null;
    } | undefined;
}) => {
    const [file, setFile] = useState<UploadedFile | null>(existingBankingDetails?.documentUrl ? {
        name: existingBankingDetails.documentUrl,
        type: getMimeType(existingBankingDetails.documentUrl),
        url: existingBankingDetails.documentUrl,
    } : null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleUploadSuccess = (fileInfo: PendingUpload["fileInfo"]) => {
        // fileInfo — это объект, который вернул сервер (см. Express маршрут)
        const uploadedFile: UploadedFile = {
            name: fileInfo.originalName || 'Uploaded file',
            type: fileInfo.mimetype || 'application/octet-stream',
            url: fileInfo.fileName || "", // например: /uploads/banking-details/filename.pdf
        };

        setFile(uploadedFile);
        setIsUploading(false);
        handleDocumentUpload(uploadedFile.url)
        toast.success('File uploaded successfully');
    };

    const handleDeleteFile = () => {
        setFile(null);
        handleDocumentDelete();
    }

    return (
        <div className="w-full space-y-4">
            {file ? (
                <Card className="p-4 bg-secondary">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {file.type?.startsWith('image/') ? (
                                <img
                                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/upload/file/${file.url}`}
                                    alt={file.name}
                                    className="w-10 h-10 object-cover rounded"
                                />
                            ) : (
                                <File className="w-6 h-6" />
                            )}
                            <span className="truncate max-w-[150px]">{file.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                disabled={!file.url}
                                variant="secondary"
                                size="sm"
                                onClick={() => setPreviewOpen(true)}
                            >
                                <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleDeleteFile}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </Card>
            ) : (
                <FileUpload
                    uploadEndpoint="/upload/banking-details"
                    fileFieldName="document"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.gif"
                    maxSize={10 * 1024 * 1024}
                    placeholder="Drag or click to select"
                    onUploadSuccess={handleUploadSuccess}
                    onChange={() => {}}
                    disabled={isUploading}
                    className="bg-secondary"
                />
            )}

            {isUploading && (
                <div className="flex items-center gap-2 text-blue-600 text-sm mt-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Uploading...</span>
                </div>
            )}

            {/* Preview modal */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-3xl overflow-hidden">
                    {file && (
                        <>
                            {file.type?.startsWith('image/') ? (
                                <img
                                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/upload/file/${file.url}`}
                                    alt={file.name}
                                    className="max-h-[70vh] object-contain mx-auto rounded"
                                />
                            ) : (
                                <iframe
                                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/upload/file/${file.url}`}
                                    title={file.name}
                                    className="w-full h-[70vh] border rounded"
                                />
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default BankingDetailsUpload;
