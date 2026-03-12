import {
    VideoPlayer,
    VideoPlayerContent,
    VideoPlayerControlBar,
    VideoPlayerMuteButton,
    VideoPlayerPlayButton,
    VideoPlayerSeekBackwardButton,
    VideoPlayerSeekForwardButton,
    VideoPlayerTimeDisplay,
    VideoPlayerTimeRange,
    VideoPlayerVolumeRange,
} from "@/components/kibo-ui/video-player";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import {
    useDeleteFile,
    useFiles,
    useUploadFile,
    type FileRecord,
} from "@/hooks/useFiles";
import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

function isPreviewable(contentType: string): boolean {
  return (
    contentType.startsWith("image/") ||
    contentType.startsWith("video/") ||
    contentType === "application/pdf"
  );
}

function getFileUrl(fileId: string, inline = false): string {
  const apiBase = import.meta.env.VITE_API_URL ?? "";
  return `${apiBase}/api/files/${fileId}/download${inline ? "?inline=1" : ""}`;
}

function FilePreview({ file }: { file: FileRecord }) {
  const url = getFileUrl(file.id, true);

  if (file.contentType.startsWith("image/")) {
    return (
      <img
        src={url}
        alt={file.originalName}
        className="max-h-[70vh] w-full rounded-md object-contain"
      />
    );
  }

  if (file.contentType.startsWith("video/")) {
    return (
      <VideoPlayer className="w-full overflow-hidden rounded-md">
        <VideoPlayerContent
          src={url}
          slot="media"
          crossOrigin=""
        />
        <VideoPlayerControlBar>
          <VideoPlayerPlayButton />
          <VideoPlayerSeekBackwardButton />
          <VideoPlayerSeekForwardButton />
          <VideoPlayerTimeRange />
          <VideoPlayerTimeDisplay showDuration />
          <VideoPlayerMuteButton />
          <VideoPlayerVolumeRange />
        </VideoPlayerControlBar>
      </VideoPlayer>
    );
  }

  if (file.contentType === "application/pdf") {
    return <PdfPreview file={file} />;
  }

  return null;
}

function PdfPreview({ file }: { file: FileRecord }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = getFileUrl(file.id, true);
    fetch(url, { credentials: "include" })
      .then((res) => res.blob())
      .then((blob) => {
        setBlobUrl(URL.createObjectURL(blob));
      });

    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file.id]);

  if (!blobUrl) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Loading PDF...
      </p>
    );
  }

  return (
    <iframe
      src={blobUrl}
      title={file.originalName}
      className="h-[70vh] w-full rounded-md border-0"
    />
  );
}

export default function Dashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const { data: files, isLoading: filesLoading } = useFiles();
  const uploadMutation = useUploadFile();
  const deleteMutation = useDeleteFile();
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);

  const handleUpload = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      uploadMutation.mutate(file, {
        onSuccess: () => toast.success(`"${file.name}" uploaded`),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Upload failed"),
      });
    };
    input.click();
  }, [uploadMutation]);

  const handleDelete = useCallback(
    (file: FileRecord) => {
      deleteMutation.mutate(file.id, {
        onSuccess: () => toast.success(`"${file.originalName}" deleted`),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Delete failed"),
      });
    },
    [deleteMutation],
  );

  const handleDownload = useCallback((file: FileRecord) => {
    const apiBase = import.meta.env.VITE_API_URL ?? "";
    window.open(`${apiBase}/api/files/${file.id}/download`, "_blank");
  }, []);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="mx-auto flex min-h-svh max-w-4xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Files</h1>
          <p className="text-sm text-muted-foreground">{user.username}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleUpload} disabled={uploadMutation.isPending}>
            {uploadMutation.isPending ? "Uploading..." : "Upload file"}
          </Button>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Files</CardTitle>
        </CardHeader>
        <CardContent>
          {filesLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading...
            </p>
          ) : !files?.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No files yet. Upload your first file to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium">
                      {file.originalName}
                    </TableCell>
                    <TableCell>{file.contentType}</TableCell>
                    <TableCell>{formatBytes(file.sizeBytes)}</TableCell>
                    <TableCell>
                      {new Date(file.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {isPreviewable(file.contentType) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewFile(file)}
                          >
                            Preview
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(file)}
                        >
                          Download
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDelete(file)}
                          disabled={deleteMutation.isPending}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={previewFile !== null}
        onOpenChange={(open) => { if (!open) setPreviewFile(null); }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewFile?.originalName}</DialogTitle>
          </DialogHeader>
          {previewFile && <FilePreview file={previewFile} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
