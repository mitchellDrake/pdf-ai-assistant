import { FileText, Trash2 } from 'lucide-react';

function truncate(string, max = 20) {
  if (string.length <= max) return string;
  return string.slice(0, max) + '…';
}

export default function Sidebar({
  activeIndex,
  pdfFiles,
  onSelect,
  onRequestDelete,
}) {
  return (
    <div className="bg-white p-4 rounded-lg shadow h-full h-[80vh] overflow-auto">
      <h2 className="font-semibold text-lg mb-4">Uploaded PDFs</h2>
      <ul className="space-y-2">
        {pdfFiles.map((file, idx) => {
          const isActive = activeIndex === idx;
          const itemClass = `flex items-center justify-between gap-2 cursor-pointer hover:text-blue-600 ${
            isActive ? 'text-blue-600 font-semibold' : 'text-gray-600'
          }`;

          return (
            <li key={idx} className={itemClass}>
              <div
                className="flex items-center gap-2 flex-1"
                onClick={() => onSelect(idx)}
              >
                <FileText className="w-4 h-4" /> {truncate(file.fileName, 20)}
              </div>
              <button
                className="text-red-500 hover:text-red-700 p-1"
                onClick={() => onRequestDelete(file)}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
