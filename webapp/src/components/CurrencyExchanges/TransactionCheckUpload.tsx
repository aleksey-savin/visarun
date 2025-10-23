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

const TransactionCheckUpload = ({
    handleCheckUpload,
    existingTransaction,
} : {
    handleCheckUpload: (checkUrl: string) => void;
    existingTransaction?: {
        id: string;
        checkUrl?: string;
    } | undefined;
}) => {
    const [file, setFile] = useState<UploadedFile | null>(existingTransaction?.checkUrl ? {
        name: existingTransaction.checkUrl,
        type: getMimeType(existingTransaction.checkUrl),
        url: existingTransaction.checkUrl,
    } : null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleUploadSuccess = (fileInfo: PendingUpload["fileInfo"]) => {
        // fileInfo — это объект, который вернул сервер (см. Express маршрут)
        const uploadedFile: UploadedFile = {
            name: fileInfo.originalName || 'Uploaded file',
            type: fileInfo.mimetype || 'application/octet-stream',
            url: fileInfo.fileName || "",
        };

        setFile(uploadedFile);
        setIsUploading(false);
        handleCheckUpload(uploadedFile.url)
        toast.success('File uploaded successfully');
    };

    return (
        <div
            className={`w-full space-y-4`}
        >
            {file ? (
                <Card className={`${!isUploading && file ? 'border-success' : ''} bg-secondary p-4`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {file.type?.startsWith('image/') ? (
                                // <img
                                //     src={file.url}
                                //     alt={file.name}
                                //     className="w-10 h-10 object-cover rounded"
                                // />
                                <ImageIcon />
                            ) : (
                                <File className="w-6 h-6" />
                            )}
                            <span className="truncate max-w-[150px]">{file.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                disabled={true}
                                variant="secondary"
                                size="sm"
                                onClick={() => setPreviewOpen(true)}
                            >
                                <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => setFile(null)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </Card>
            ) : (
                <FileUpload
                    uploadEndpoint="/upload/transaction-check"
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
                                    src={file.url}
                                    alt={file.name}
                                    className="max-h-[70vh] object-contain mx-auto rounded"
                                />
                            ) : (
                                <iframe
                                    src={file.url}
                                    title={file.name}
                                    className="w-full h-[70vh] border rounded"
                                />
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default TransactionCheckUpload;


import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {Eye, Trash2, File, ImageIcon} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { FileUpload } from '@/components/ui/file-upload.tsx';



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
