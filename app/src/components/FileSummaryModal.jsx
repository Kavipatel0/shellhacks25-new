import React from 'react';

const FileSummaryModal = ({ isOpen, onClose, fileSummary, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isLoading ? 'Loading...' : fileSummary?.fileName}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {fileSummary?.fileType && `${fileSummary.fileType} • `}
              {fileSummary?.filePath}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Analyzing file...</span>
            </div>
          ) : fileSummary ? (
            <div className="prose prose-sm max-w-none">
              <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  File Summary
                </h3>
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {fileSummary.summary}
                </div>
              </div>
              
              {fileSummary.filePath && (
                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">File Path:</h4>
                  <code className="text-xs text-gray-600 break-all">
                    {fileSummary.filePath}
                  </code>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No summary available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileSummaryModal;
