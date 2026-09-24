import React, { useState, useEffect } from 'react';
import {
  X,
  HardDrive,
  Cloud,
  CloudUpload,
  ExternalLink,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  Check,
  LogOut,
  FolderOpen,
  ArrowRight,
  Database,
  Lock,
} from 'lucide-react';
import { BusinessProfile, Client, DriveFile, Invoice } from '../types';
import {
  deleteDriveFile,
  fetchDriveFileContent,
  listDriveFiles,
  uploadBackupToDrive,
  uploadInvoiceToDrive,
} from '../utils/googleDrive';
import {
  googleLogout,
  googleSignIn,
  getCurrentUser,
} from '../utils/googleAuth';
import { User } from 'firebase/auth';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  clients: Client[];
  profile: BusinessProfile;
  currentUser: User | null;
  accessToken: string | null;
  onAuthSuccess: (user: User, token: string) => void;
  onAuthLogout: () => void;
  onRestoreData?: (invoices: Invoice[], clients: Client[]) => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  invoices,
  clients,
  profile,
  currentUser,
  accessToken,
  onAuthSuccess,
  onAuthLogout,
  onRestoreData,
}) => {
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [folderLink, setFolderLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Destructive Confirmation Dialog State
  const [fileToDelete, setFileToDelete] = useState<DriveFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Restore Confirmation Dialog State
  const [fileToRestore, setFileToRestore] = useState<DriveFile | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const fetchFiles = async (token: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const result = await listDriveFiles(token);
      setDriveFiles(result.files);
      if (result.folderLink) setFolderLink(result.folderLink);
    } catch (err: unknown) {
      console.error('Error fetching drive files:', err);
      const msg = err instanceof Error ? err.message : 'Failed to load files from Google Drive.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && accessToken) {
      fetchFiles(accessToken);
    }
  }, [isOpen, accessToken]);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await googleSignIn();
      if (res) {
        onAuthSuccess(res.user, res.accessToken);
        fetchFiles(res.accessToken);
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      const msg = err instanceof Error ? err.message : 'Sign in failed. Please try again.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await googleLogout();
      onAuthLogout();
      setDriveFiles([]);
      setFolderLink(null);
    } catch (err: unknown) {
      console.error('Logout error:', err);
    }
  };

  const handleBackupAll = async () => {
    if (!accessToken) return;
    setIsBackingUp(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const file = await uploadBackupToDrive(accessToken, invoices, clients, profile);
      setSuccessMsg(`Backup successfully created: ${file.name}`);
      await fetchFiles(accessToken);
    } catch (err: unknown) {
      console.error('Backup error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to backup to Google Drive.';
      setErrorMsg(msg);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleSyncAllInvoices = async () => {
    if (!accessToken) return;
    setIsSyncingAll(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      let count = 0;
      for (const inv of invoices) {
        await uploadInvoiceToDrive(accessToken, inv, profile);
        count++;
      }
      setSuccessMsg(`Uploaded ${count} invoice(s) to your 'Seal Invoices' folder on Google Drive!`);
      await fetchFiles(accessToken);
    } catch (err: unknown) {
      console.error('Sync error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to upload all invoices to Drive.';
      setErrorMsg(msg);
    } finally {
      setIsSyncingAll(false);
    }
  };

  const confirmDeleteFile = async () => {
    if (!accessToken || !fileToDelete) return;
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      await deleteDriveFile(accessToken, fileToDelete.id);
      setDriveFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      setSuccessMsg(`File "${fileToDelete.name}" permanently deleted from Google Drive.`);
      setFileToDelete(null);
    } catch (err: unknown) {
      console.error('Delete error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to delete file from Google Drive.';
      setErrorMsg(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmRestoreBackup = async () => {
    if (!accessToken || !fileToRestore || !onRestoreData) return;
    setIsRestoring(true);
    setErrorMsg(null);
    try {
      const raw = await fetchDriveFileContent(accessToken, fileToRestore.id);
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.invoices)) {
        onRestoreData(parsed.invoices, parsed.clients || []);
        setSuccessMsg(
          `Restored ${parsed.invoices.length} invoices and ${parsed.clients?.length || 0} clients from backup!`
        );
        setFileToRestore(null);
      } else {
        throw new Error('Invalid backup file format: missing invoices array.');
      }
    } catch (err: unknown) {
      console.error('Restore error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to restore backup from Google Drive.';
      setErrorMsg(msg);
    } finally {
      setIsRestoring(false);
    }
  };

  const formatFileSize = (bytesStr?: string) => {
    if (!bytesStr) return '—';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-white">
                  Google Drive Cloud Hub
                </h3>
                {currentUser && (
                  <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Connected
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                Automatic cloud backup & standalone invoice files for South African hustlers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1">{successMsg}</div>
            </div>
          )}

          {/* User connection state */}
          {!currentUser || !accessToken ? (
            /* Disconnected state: Sign In with Google Prompt */
            <div className="p-6 text-center bg-neutral-950 border border-neutral-800 rounded-xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-blue-400">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-bold text-base text-white">
                  Connect Google Drive
                </h4>
                <p className="text-xs text-neutral-400 max-w-md mx-auto mt-1">
                  Connect your Google Drive with permission to safely back up invoices, generate
                  standalone cloud copies, and restore your client records anytime.
                </p>
              </div>

              {/* Official Google Sign-In Button */}
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isLoading}
                  className="inline-flex items-center gap-3 px-5 py-2.5 bg-white hover:bg-neutral-100 text-neutral-800 font-semibold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] border border-neutral-200 cursor-pointer disabled:opacity-60"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>{isLoading ? 'Connecting...' : 'Sign in with Google'}</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-4 text-[11px] text-neutral-500 pt-2">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  Your tokens are cached in-memory only
                </span>
                <span>•</span>
                <span>Folders created in your own Google Drive</span>
              </div>
            </div>
          ) : (
            /* Connected state */
            <div className="space-y-4">
              {/* Account Bar */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'Google User'}
                      className="w-10 h-10 rounded-full border border-neutral-700 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-neutral-800 text-neutral-300 font-bold flex items-center justify-center text-sm border border-neutral-700">
                      {(currentUser.displayName || currentUser.email || 'G')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{currentUser.displayName || 'Google Drive User'}</span>
                      <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
                        Google Account
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400 font-mono">
                      {currentUser.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {folderLink && (
                    <a
                      href={folderLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-blue-400 border border-neutral-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Open Drive Folder</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="p-1.5 text-neutral-400 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition-colors"
                    title="Disconnect Google Drive"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3.5 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Database className="w-4 h-4 text-emerald-400" />
                      <span>Full Backup to Drive</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Save complete snapshot of {invoices.length} invoices and {clients.length} clients as a secure JSON backup.
                    </p>
                  </div>
                  <button
                    onClick={handleBackupAll}
                    disabled={isBackingUp}
                    className="w-full py-2 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isBackingUp ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CloudUpload className="w-3.5 h-3.5" />
                    )}
                    <span>{isBackingUp ? 'Backing up...' : 'Create Cloud Backup'}</span>
                  </button>
                </div>

                <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3.5 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span>Sync All Invoice HTML Files</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Generate standalone, printable HTML slips for all your invoices in Google Drive.
                    </p>
                  </div>
                  <button
                    onClick={handleSyncAllInvoices}
                    disabled={isSyncingAll}
                    className="w-full py-2 px-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isSyncingAll ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CloudUpload className="w-3.5 h-3.5" />
                    )}
                    <span>{isSyncingAll ? 'Syncing...' : 'Upload All Invoices'}</span>
                  </button>
                </div>
              </div>

              {/* Files in 'Seal Invoices' Folder */}
              <div className="space-y-2">
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-300">
                      Files in "Seal Invoices" Folder ({driveFiles.length})
                    </span>
                  </div>
                  <button
                    onClick={() => accessToken && fetchFiles(accessToken)}
                    disabled={isLoading}
                    className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {isLoading && driveFiles.length === 0 ? (
                  <div className="py-8 text-center text-xs text-neutral-500 flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-neutral-400" />
                    <span>Loading Drive files...</span>
                  </div>
                ) : driveFiles.length === 0 ? (
                  <div className="py-8 text-center bg-neutral-950 border border-neutral-800/80 rounded-xl p-4">
                    <Cloud className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                    <p className="text-xs text-neutral-400 font-medium">
                      No files yet in your "Seal Invoices" Drive folder.
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Click "Create Cloud Backup" or save an invoice to Drive to get started.
                    </p>
                  </div>
                ) : (
                  <div className="border border-neutral-800 rounded-xl overflow-hidden divide-y divide-neutral-800/80 bg-neutral-950">
                    {driveFiles.map((file) => {
                      const isJson = file.name.endsWith('.json');
                      const isHtml = file.name.endsWith('.html');
                      return (
                        <div
                          key={file.id}
                          className="p-3 flex items-center justify-between gap-3 hover:bg-neutral-900/50 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                isJson
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : isHtml
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : 'bg-neutral-800 text-neutral-300'
                              }`}
                            >
                              {isJson ? (
                                <Database className="w-3.5 h-3.5" />
                              ) : (
                                <FileText className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-white truncate max-w-[220px] sm:max-w-xs">
                                {file.name}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                                <span>{formatFileSize(file.size)}</span>
                                <span>•</span>
                                <span>
                                  {file.createdTime
                                    ? new Date(file.createdTime).toLocaleDateString('en-ZA', {
                                        day: 'numeric',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                    : 'Saved'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* View in Drive */}
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                                title="Open in Google Drive"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {/* If JSON backup, allow restore */}
                            {isJson && onRestoreData && (
                              <button
                                type="button"
                                onClick={() => setFileToRestore(file)}
                                className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded border border-amber-500/30 text-[11px] font-semibold transition-colors flex items-center gap-1"
                                title="Restore invoices from this backup"
                              >
                                <Download className="w-3 h-3" />
                                <span className="hidden sm:inline">Restore</span>
                              </button>
                            )}

                            {/* Delete button (Triggers custom confirmation dialog) */}
                            <button
                              type="button"
                              onClick={() => setFileToDelete(file)}
                              className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition-colors"
                              title="Delete from Google Drive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between text-xs text-neutral-400">
          <span className="flex items-center gap-1.5">
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span>Google Drive v3 API Integration</span>
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* MANDATORY DESTRUCTIVE CONFIRMATION MODAL */}
      {fileToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-neutral-950/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-neutral-900 border border-red-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display font-bold text-base text-white">
                  Delete from Google Drive?
                </h4>
                <p className="text-xs text-neutral-400">
                  This destructive operation cannot be undone.
                </p>
              </div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs space-y-1">
              <div className="text-neutral-400">File to be permanently deleted:</div>
              <div className="font-mono font-bold text-white break-all">{fileToDelete.name}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="px-3 py-1.5 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteFile}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete File'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESTORE CONFIRMATION MODAL */}
      {fileToRestore && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-neutral-950/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-neutral-900 border border-amber-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display font-bold text-base text-white">
                  Restore Backup from Drive?
                </h4>
                <p className="text-xs text-neutral-400">
                  Import data from this cloud snapshot.
                </p>
              </div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs space-y-1">
              <div className="text-neutral-400">Snapshot file:</div>
              <div className="font-mono font-bold text-white break-all">{fileToRestore.name}</div>
            </div>

            <p className="text-xs text-neutral-400">
              This will load the invoices and clients stored inside this Google Drive backup file into your application.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFileToRestore(null)}
                disabled={isRestoring}
                className="px-3 py-1.5 rounded-lg border border-neutral-700 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRestoreBackup}
                disabled={isRestoring}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                {isRestoring ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>{isRestoring ? 'Restoring...' : 'Confirm Restore'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
