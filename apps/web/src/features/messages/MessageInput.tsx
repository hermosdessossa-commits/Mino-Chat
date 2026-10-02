import React, { useRef, useState, useCallback } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { cn } from '@mino-chat/shared/utils';
import { useUpload } from '@/features/uploads/hooks/useUpload';

interface MessageInputProps {
  onSend: (content: string, attachmentIds?: string[]) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Array<{ id: string; file: File; preview?: string }>>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFiles, isUploading } = useUpload();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!content.trim() && !selectedFiles.length) return;
    onSend(content, selectedFiles.map(f => f.id));
    setContent('');
    setSelectedFiles([]);
    textareaRef.current?.focus();
  };

  const handleFileSelect = async (files: FileList) => {
    const newFiles = Array.from(files).map(file => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setSelectedFiles(prev => [...prev, ...newFiles]);
    // Upload files
    const results = await uploadFiles.mutateAsync(files);
    // Results will have fileIds
    setSelectedFiles(prev => prev.map((f, i) => ({ ...f, id: results[i]?.fileId || f.id })));
  };

  const removeFile = (id: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== id));
  };

  const autoResize = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
  }, []);

  const handleEmojiSelect = (emoji: string) => {
    setContent(prev => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="border-t border-surface-200 dark:border-surface-700 bg-white/50 dark:bg-surface-900/50 backdrop-blur-sm p-4">
      {/* Selected files preview */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedFiles.map((file) => (
            <div key={file.id} className="relative flex items-center gap-2 px-3 py-1.5 bg-surface-100 dark:bg-surface-800 rounded-lg">
              {file.preview && (
                <img src={file.preview} alt="" className="h-8 w-8 rounded object-cover" />
              )}
              <span className="text-sm truncate max-w-[150px]">{file.file.name}</span>
              <span className="text-xs text-surface-500">{formatFileSize(file.file.size)}</span>
              <button onClick={() => removeFile(file.id)} className="text-surface-500 hover:text-red-500" aria-label="Supprimer">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <div className="flex items-center gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl">
            <button
              onClick={() => setShowAttachments(!showAttachments)}
              className={cn('btn-ghost btn-icon p-2', showAttachments && 'bg-primary-100 dark:bg-primary-900/30')}
              aria-label="Pièces jointes"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              className="hidden"
              id="file-input"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.zip"
            />
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="btn-ghost btn-icon p-2"
              aria-label="Emojis"
            >
              <Smile className="h-5 w-5" />
            </button>
          </div>

          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={autoResize}
            placeholder="Écrire un message..."
            className="w-full bg-transparent border-none resize-none outline-none px-4 py-2.5 text-sm text-surface-900 dark:text-surface-50 placeholder:text-surface-400 min-h-[2.5rem] max-h-[150px]"
            disabled={disabled}
            rows={1}
          />
        </div>

        <Button
          onClick={handleSend}
          disabled={disabled || (!content.trim() && selectedFiles.length === 0) || isUploading}
          variant="primary"
          className="h-10"
          aria-label="Envoyer"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>

      {/* Emoji picker */}
      {showEmojiPicker && (
        <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
      )}
    </div>
  );
}

const emojis = ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','💀','☠️','👻','👽','👾','🤖','💩','😺','😸','😹','😻','😼','😽','🙀','😿','😾','🙌','👏','👋','🤝','👍','👎','👊','✊','🤛','🤜','🤞','✌️','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👌','🤌','🤏','✋','🤚','🖐️','🖖','👋','🤙','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠','🦷','🦴','👀','👁️','👅','👄','💋','🩸','🫀','🫁'];

function EmojiPicker({ onSelect, onClose }: { onSelect: (emoji: string) => void; onClose: () => void }) {
  return (
    <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl shadow-lg p-2 z-50">
      <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => { onSelect(emoji); onClose(); }}
            className="p-1.5 text-2xl hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}