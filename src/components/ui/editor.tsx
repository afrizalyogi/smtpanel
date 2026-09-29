"use client";

import dynamic from 'next/dynamic';
import React from 'react';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic<any>(() => import('react-quill-new'), { 
  ssr: false,
  loading: () => <div className="h-[300px] w-full flex items-center justify-center text-muted text-sm">Loading Editor...</div>
});

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function Editor({ value, onChange, placeholder, disabled }: EditorProps) {
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'clean']
    ],
  };

  return (
    <div className={`editor-container ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <ReactQuill 
        theme="snow" 
        value={value} 
        onChange={onChange} 
        modules={modules}
        placeholder={placeholder}
      />
    </div>
  );
}
