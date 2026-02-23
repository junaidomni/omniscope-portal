import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, File, Image as ImageIcon } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface FileUploadProps {
  channelId: number;
  onUploadComplete: (attachment: { id: number; url: string; fileName: string; mimeType: string; fileSize: number }) => void;
}

export function FileUpload({ channelId, onUploadComplete }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.fileUpload.uploadMessageAttachment.useMutation();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];

        const result = await uploadMutation.mutateAsync({
          channelId,
          fileName: file.name,
          fileData: base64,
          mimeType: file.type,
          fileSize: file.size,
        });

        onUploadComplete(result);
        setSelectedFile(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("File upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileInputChange}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
      />

      {selectedFile && !uploading && (
        <div className="absolute bottom-full left-0 mb-2 p-3 bg-popover border rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]">
          {selectedFile.type.startsWith("image/") ? (
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          ) : (
            <File className="h-8 w-8 text-muted-foreground" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={clearFile} className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {uploading && (
        <div className="absolute bottom-full left-0 mb-2 p-3 bg-popover border rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <div className="flex-1">
            <p className="text-sm font-medium">Uploading...</p>
            <p className="text-xs text-muted-foreground">{selectedFile?.name}</p>
          </div>
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`absolute bottom-full left-0 mb-2 p-6 border-2 border-dashed rounded-lg transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-border bg-background"
        } ${uploading ? "hidden" : ""}`}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">Drop files here</p>
          <p className="text-xs text-muted-foreground">or</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Browse Files
          </Button>
        </div>
      </div>
    </div>
  );
}
