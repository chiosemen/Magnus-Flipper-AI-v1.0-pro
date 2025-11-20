'use client';

import React from 'react';

interface ConditionSelectorProps {
  selected: string[];
  onChange: (conditions: string[]) => void;
}

const conditions = [
  { id: 'new', label: 'New', icon: '✨' },
  { id: 'like_new', label: 'Like New', icon: '👍' },
  { id: 'used', label: 'Used', icon: '📦' },
  { id: 'any', label: 'Any', icon: '🔄' },
];

export function ConditionSelector({ selected, onChange }: ConditionSelectorProps) {
  const handleSelect = (conditionId: string) => {
    if (conditionId === 'any') {
      onChange(['any']);
    } else {
      const filtered = selected.filter(s => s !== 'any');
      if (filtered.includes(conditionId)) {
        const newSelected = filtered.filter(s => s !== conditionId);
        onChange(newSelected.length === 0 ? ['any'] : newSelected);
      } else {
        onChange([...filtered, conditionId]);
      }
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Condition
      </label>
      <div className="flex flex-wrap gap-2">
        {conditions.map((condition) => (
          <button
            key={condition.id}
            type="button"
            onClick={() => handleSelect(condition.id)}
            className={`
              flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all
              ${selected.includes(condition.id)
                ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500'
                : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
              }
            `}
          >
            <span>{condition.icon}</span>
            <span>{condition.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
