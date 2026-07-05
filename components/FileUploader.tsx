'use client';

import { useRef, useState, DragEvent } from 'react';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export default function FileUploader({ onFilesSelected, disabled = false }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.currentTarget.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${
        isDragging
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-400 bg-gray-50 dark:bg-gray-800'
      }`}
      onClick={() => !disabled && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        disabled={disabled}
        className="hidden"
      />
      <div className="text-4xl mb-2">📁</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Drag & Drop Files Here
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        or click to browse your computer
      </p>
    </div>
  );
}
