'use client';
import React from 'react';

type Props = {
  currentPage: number;        // 1-based
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (n: number) => void;
  showPerPage?: boolean;
};

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showPerPage = true,
}: Props) {
  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages || totalPages === 0;

  return (
    <div className="flex items-center justify-between gap-3 py-4">
      <div className="text-sm text-gray-600">
        {totalItems > 0
          ? <>Página <strong>{currentPage}</strong> de <strong>{Math.max(totalPages,1)}</strong> · Mostrando {Math.min((currentPage-1)*itemsPerPage+1, totalItems)}–{Math.min(currentPage*itemsPerPage, totalItems)} de {totalItems}</>
          : <>Sin resultados</>}
      </div>

      <div className="flex items-center gap-2">
        {showPerPage && onItemsPerPageChange && (
          <select
            className="border rounded-md px-2 py-1 text-sm"
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          >
            {[12,24,36,48].map(n => <option key={n} value={n}>{n} / pág.</option>)}
          </select>
        )}
        <button
          className="px-3 py-1 border rounded-md disabled:opacity-50"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={prevDisabled}
          aria-label="Página anterior"
        >
          ← Anterior
        </button>
        <button
          className="px-3 py-1 border rounded-md disabled:opacity-50"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={nextDisabled}
          aria-label="Página siguiente"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}
