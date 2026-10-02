import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useUpload() {
  const uploadFiles = useMutation({
    mutationFn: async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const results = await Promise.all(
        fileArray.map(async (file) => {
          if (file.size > 50 * 1024 * 1024) throw new Error(`File ${file.name} too large`);
          
          const presigned = await api.getPresignedUrl({
            filename: file.name,
            mimeType: file.type,
            size: file.size,
          });

          await fetch(presigned.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type },
          });

          const complete = await api.completeUpload({
            fileId: presigned.fileId,
          });

          return { fileId: presigned.fileId, url: presigned.fileUrl, ...complete };
        })
      );
      return results;
    },
  });

  return { uploadFiles, isUploading: uploadFiles.isPending, uploadProgress: 0 };
}