import { useRef, useState } from "react";
import { UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SERVER_URL } from "@/constants";

type FileUploadState = {
  id: string;
  filename: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  key?: string;
  error?: string;
};

const STATUS_LABEL: Record<FileUploadState["status"], string> = {
  pending: "Pending",
  uploading: "",
  success: "Done",
  error: "Failed",
};

const STATUS_CLASS: Record<FileUploadState["status"], string> = {
  pending: "text-muted-foreground",
  uploading: "text-muted-foreground",
  success: "text-green-600 dark:text-green-400",
  error: "text-red-600 dark:text-red-400",
};

function UploadItem({ u }: { u: FileUploadState }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium">{u.filename}</span>
        <span className={`shrink-0 text-xs ${STATUS_CLASS[u.status]}`}>
          {u.status === "uploading" ? `${u.progress}%` : STATUS_LABEL[u.status]}
        </span>
      </div>
      {u.status === "uploading" && (
        <Progress value={u.progress} className="mt-2 h-1.5" />
      )}
      {u.status === "error" && (
        <p className="mt-1 text-xs text-red-500">{u.error}</p>
      )}
    </div>
  );
}

const CONCURRENCY_LIMIT = 3;

export const ReceiptsPage = () => {
  const [uploads, setUploads] = useState<FileUploadState[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateUpload = (id: string, update: Partial<FileUploadState>) => {
    setUploads((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...update } : u)),
    );
  };

  const uploadFile = async (id: string, file: File) => {
    updateUpload(id, { status: "uploading", progress: 0 });

    const presignRes = await fetch(`${SERVER_URL}/api/v1/uploads/presign`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name }),
    });

    if (!presignRes.ok) {
      const err = await presignRes.json().catch(() => ({}));
      updateUpload(id, {
        status: "error",
        error:
          (err as { error?: string }).error ?? "Failed to get upload URL.",
      });
      return;
    }

    const { url, key } = (await presignRes.json()) as {
      url: string;
      key: string;
    };

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          updateUpload(id, {
            status: "uploading",
            progress: Math.round((e.loaded / e.total) * 100),
          });
        }
      });
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Upload failed: ${xhr.status}`));
      });
      xhr.addEventListener("error", () =>
        reject(new Error("Network error during upload.")),
      );
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", "application/pdf");
      xhr.send(file);
    }).then(
      () => updateUpload(id, { status: "success", key }),
      (err: Error) => updateUpload(id, { status: "error", error: err.message }),
    );
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles: { id: string; file: File }[] = [];
    const newUploads: FileUploadState[] = [];

    for (const file of Array.from(files)) {
      if (file.type !== "application/pdf") continue;
      const id = crypto.randomUUID();
      validFiles.push({ id, file });
      newUploads.push({
        id,
        filename: file.name,
        status: "pending",
        progress: 0,
      });
    }

    if (newUploads.length === 0) return;
    setUploads((prev) => [...prev, ...newUploads]);

    const executing: Promise<void>[] = [];
    for (const { id, file } of validFiles) {
      const p: Promise<void> = uploadFile(id, file).finally(() => {
        executing.splice(executing.indexOf(p), 1);
      });
      executing.push(p);
      if (executing.length >= CONCURRENCY_LIMIT) {
        await Promise.race(executing);
      }
    }
    await Promise.all(executing);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Upload Receipts</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            PDF files only. Files are stored securely in R2.
          </p>
        </div>

        <button
          type="button"
          className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <UploadIcon className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium">
            Drop your PDFs here or click to browse
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            PDF files only, multiple allowed
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </button>

        {uploads.length > 0 && (
          <div className="space-y-2">
            {uploads.map((u) => (
              <UploadItem key={u.id} u={u} />
            ))}
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => {
                setUploads([]);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              Clear
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
