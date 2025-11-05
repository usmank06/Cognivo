import { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, Edit2, Check, X, Loader2, AlertCircle, CheckCircle2, Clock, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { toast } from 'sonner';

interface DataFile {
  id: string;
  originalFileName: string;
  nickname?: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  processingStage?: string;
  processingProgress?: number;
  errorMessage?: string;
  hasSchema: boolean;
  subsetCount: number;
}

interface SourcesPageProps {
  username: string;
  userId: string;
}

export function SourcesPage({ username, userId }: SourcesPageProps) {
  const [files, setFiles] = useState<DataFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editNickname, setEditNickname] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  // Load files on mount
  useEffect(() => {
    loadFiles();
  }, [username]);

  // Poll for status updates of processing files
  useEffect(() => {
    const processingFiles = files.filter(f => 
      f.status === 'uploading' || f.status === 'processing'
    );

    if (processingFiles.length === 0) return;

    const interval = setInterval(() => {
      loadFiles();
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [files]);

  const loadFiles = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/files/${username}`);
      const data = await response.json();
      
      if (data.success) {
        setFiles(data.files);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
      toast.error('Failed to load files');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('userId', userId);

      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('files', selectedFiles[i]);
      }

      const response = await fetch('http://localhost:3001/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`${selectedFiles.length} file(s) uploaded successfully!`);
        loadFiles();
      } else {
        toast.error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleUpdateNickname = async (fileId: string) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/files/${username}/${fileId}/nickname`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nickname: editNickname }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('Nickname updated!');
        setEditingFileId(null);
        loadFiles();
      }
    } catch (error) {
      toast.error('Failed to update nickname');
    }
  };

  const handleDeleteFile = async () => {
    if (!fileToDelete) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/files/${username}/${fileToDelete}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('File deleted');
        setFiles(files.filter(f => f.id !== fileToDelete));
      }
    } catch (error) {
      toast.error('Failed to delete file');
    } finally {
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    }
  };

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/files/${username}/${fileId}/download`);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }

      // Create blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusBadge = (file: DataFile) => {
    switch (file.status) {
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case 'uploading':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Uploading
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="pt-16 min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">Data Files</h1>
            <p className="text-muted-foreground text-lg">
              Upload and manage your data files
            </p>
          </div>
          
          <label htmlFor="file-upload">
            <Button 
              disabled={isUploading}
              onClick={() => document.getElementById('file-upload')?.click()}
              type="button"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </>
              )}
            </Button>
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".csv,.xlsx,.xls"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Stats */}
        {files.length > 0 && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{files.length}</div>
                <div className="text-sm text-muted-foreground">Total Files</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {files.filter(f => f.status === 'completed').length}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {files.filter(f => f.status === 'processing').length}
                </div>
                <div className="text-sm text-muted-foreground">Processing</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {formatFileSize(files.reduce((sum, f) => sum + f.fileSize, 0))}
                </div>
                <div className="text-sm text-muted-foreground">Total Size</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Files List */}
        {files.length === 0 ? (
          <Card className="p-12">
            <div className="text-center pt-6 pb-6">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-6" />
              <h3 className="text-lg font-medium mb-2">No files uploaded yet</h3>
              <p className="text-muted-foreground mb-6">
                Upload your first CSV or Excel file to get started
              </p>
              <div className="mt-4">
                <label htmlFor="file-upload-empty">
                  <Button onClick={() => document.getElementById('file-upload-empty')?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                </label>
              </div>
              <input
                id="file-upload-empty"
                type="file"
                accept=".csv,.xlsx,.xls"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <Card key={file.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#FFE5D1] to-white rounded-xl flex items-center justify-center flex-shrink-0 border border-primary/20 shadow-sm">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* File name/nickname */}
                        <div className="flex items-center gap-2 mb-1">
                          {editingFileId === file.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editNickname}
                                onChange={(e) => setEditNickname(e.target.value)}
                                placeholder="Enter nickname"
                                className="h-8 w-64"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUpdateNickname(file.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingFileId(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <h3 className="font-medium truncate">
                                {file.nickname || file.originalFileName}
                              </h3>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  setEditingFileId(file.id);
                                  setEditNickname(file.nickname || '');
                                }}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          {getStatusBadge(file)}
                        </div>

                        {file.nickname && (
                          <div className="text-sm text-muted-foreground mb-2">
                            {file.originalFileName}
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{formatFileSize(file.fileSize)}</span>
                          <span>•</span>
                          <span>{formatDate(file.uploadedAt)}</span>
                          {file.status === 'completed' && (
                            <>
                              <span>•</span>
                              <span>{file.subsetCount} subsets</span>
                            </>
                          )}
                        </div>

                        {/* Processing progress */}
                        {(file.status === 'processing' || file.status === 'uploading') && (
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {file.processingStage || 'Processing...'}
                              </span>
                              <span className="text-muted-foreground">
                                {file.processingProgress}%
                              </span>
                            </div>
                            <Progress value={file.processingProgress || 0} />
                          </div>
                        )}

                        {/* Error message */}
                        {file.status === 'error' && file.errorMessage && (
                          <div className="mt-2 text-sm text-red-600">
                            {file.errorMessage}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => handleDownloadFile(file.id, file.nickname || file.originalFileName)}
                        title="Download original file"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setFileToDelete(file.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete File</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this file? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteFile}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
