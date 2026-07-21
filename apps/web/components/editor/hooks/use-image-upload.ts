'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { CodeMirrorEditorRef } from '@/components/editor/codemirror-editor';

interface UseImageUploadOptions {
  editorRef: React.RefObject<CodeMirrorEditorRef | null>;
  viewMode: string;
  onToast?: (toast: { title: string; variant?: string }) => void;
}

export function useImageUpload({ editorRef, viewMode }: UseImageUploadOptions) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        return data.url;
      }
    } catch { /* ignore */ }
    return null;
  }, []);

  // Image paste
  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      if (viewMode === 'preview') return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            setIsUploading(true);
            uploadImage(file).then((url) => {
              if (url && editorRef.current) editorRef.current.insertText(`![image](${url})`);
              setIsUploading(false);
            });
          }
          break;
        }
      }
    }
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [viewMode, uploadImage, editorRef]);

  // Image drag-and-drop
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    for (const file of e.dataTransfer.files) {
      if (file.type.startsWith('image/')) {
        setIsUploading(true);
        const url = await uploadImage(file);
        if (url && editorRef.current) editorRef.current.insertText(`![${file.name}](${url})`);
        setIsUploading(false);
      }
    }
  }, [uploadImage, editorRef]);

  return {
    isDragOver,
    setIsDragOver,
    isUploading,
    setIsUploading,
    imageInputRef,
    handleDrop,
    uploadImage,
  };
}
