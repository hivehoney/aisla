'use client';

import { useEffect, useState } from 'react';

export default function MapSearchModal({ 
  isOpen, 
  onClose, 
  results, 
  onSelectLocation,
  isLoading 
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      <div className={`relative w-full max-w-2xl max-h-[80vh] bg-white rounded-lg shadow-lg transform transition-transform duration-300 ${isOpen ? 'scale-100' : 'scale-95'}`}>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">검색 결과</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              검색 결과가 없습니다.
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[60vh]">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="p-3 border-b cursor-pointer hover:bg-gray-50"
                  onClick={() => onSelectLocation(result)}
                >
                  <h3 
                    className="font-bold"
                    dangerouslySetInnerHTML={{ __html: result.title }}
                  />
                  <p 
                    className="text-sm text-gray-600"
                    dangerouslySetInnerHTML={{ __html: result.address }}
                  />
                  {result.telephone && (
                    <p className="text-sm text-gray-600">{result.telephone}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 