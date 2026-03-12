import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface FileRecord {
  id: string;
  userId: string;
  originalName: string;
  blobName: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
}

export function useFiles() {
  return useQuery({
    queryKey: ["files"],
    queryFn: () => api.get<FileRecord[]>("/api/files"),
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) =>
      api.upload<FileRecord>("/api/files", file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ message: string }>(`/api/files/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}
