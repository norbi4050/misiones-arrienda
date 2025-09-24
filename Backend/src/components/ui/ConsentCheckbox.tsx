"use client";

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';

interface ConsentCheckboxProps {
  checkedTerms: boolean;
  checkedPrivacy: boolean;
  onChangeTerms: (checked: boolean) => void;
  onChangePrivacy: (checked: boolean) => void;
  error?: string | null;
  className?: string;
}

export function ConsentCheckbox({
  checkedTerms,
  checkedPrivacy,
  onChangeTerms,
  onChangePrivacy,
  error,
  className = ""
}: ConsentCheckboxProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-start space-x-3">
        <Checkbox
          id="terms-consent"
          checked={checkedTerms}
          onCheckedChange={onChangeTerms}
          className="mt-1"
        />
        <label 
          htmlFor="terms-consent" 
          className="text-sm text-gray-700 cursor-pointer leading-5"
        >
          Acepto los{' '}
          <a 
            href="/terms" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-500 underline"
          >
            Términos y Condiciones
          </a>
          {' '}de Misiones Arrienda
        </label>
      </div>

      <div className="flex items-start space-x-3">
        <Checkbox
          id="privacy-consent"
          checked={checkedPrivacy}
          onCheckedChange={onChangePrivacy}
          className="mt-1"
        />
        <label 
          htmlFor="privacy-consent" 
          className="text-sm text-gray-700 cursor-pointer leading-5"
        >
          Acepto la{' '}
          <a 
            href="/privacy" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-500 underline"
          >
            Política de Privacidad
          </a>
          {' '}de Misiones Arrienda
        </label>
      </div>

      {error && (
        <div className="text-sm text-red-600 mt-2">
          {error}
        </div>
      )}

      <div className="text-xs text-gray-500 mt-2">
        * Ambos campos son requeridos para continuar
      </div>
    </div>
  );
}
