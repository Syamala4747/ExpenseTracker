import React, { useState } from 'react';
import axiosInstance from '../utils/axiosInstance';

const ReceiptUpload = ({ onParsed }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = (e) => {
    const f = e.target.files[0];
    setFile(f);
    setError(null);
    // auto-start upload when a file is chosen
    if (f) handleUpload(f);
  };

  const handleUpload = async (fileArg) => {
    const toUpload = fileArg || file;
    if (!toUpload) return setError('Please select a file');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('receipt', toUpload);
      const res = await axiosInstance.post('/api/v1/parse/receipt', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        // OCR can be slow (first-run WASM downloads); increase timeout
        timeout: 120000,
      });
      if (res.data) onParsed(res.data);
    } catch (err) {
      console.error('Receipt parse error', err);
      setError(err?.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };
  // No sample images displayed — users should upload their own receipts

  return (
    <div className="receipt-upload">
      {/* sample images removed per user request */}
      <input type="file" accept="image/*" onChange={handleFile} />
      <button type="button" onClick={handleUpload} disabled={loading} className="mt-2 btn-primary">
        {loading ? 'Parsing...' : 'Parse Receipt'}
      </button>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
};

export default ReceiptUpload;
