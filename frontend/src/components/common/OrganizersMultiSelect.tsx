import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Plus, Users } from 'lucide-react';

interface OrganizersMultiSelectProps {
  selected: string[];
  onChange: (items: string[]) => void;
  availableClubs: Array<{ id: number; club: string }>;
  disabled?: boolean;
}

export const OrganizersMultiSelect: React.FC<OrganizersMultiSelectProps> = ({
  selected,
  onChange,
  availableClubs,
  disabled = false
}) => {
  const [customInput, setCustomInput] = useState('');
  const [selectValue, setSelectValue] = useState('');

  const standardOptions = ['ADEI', 'Administration ENSA Fès'];
  const clubOptions = availableClubs.map((c) => c.club);

  const addOrganizer = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
    }
    setCustomInput('');
    setSelectValue('');
  };

  const removeOrganizer = (name: string) => {
    onChange(selected.filter((item) => item !== name));
  };

  return (
    <div className="space-y-2">
      {/* Badges des organisateurs sélectionnés */}
      <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2 rounded-xl border border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50 items-center">
        {selected.length === 0 ? (
          <span className="text-xs text-zinc-400 italic flex items-center gap-1.5 px-1">
            <Users className="h-3.5 w-3.5" /> Aucun organisateur sélectionné (sélectionnez ci-dessous)
          </span>
        ) : (
          selected.map((org) => (
            <Badge
              key={org}
              variant="secondary"
              className="gap-1.5 pl-2.5 pr-1.5 py-1 text-xs font-semibold bg-white border border-zinc-200 shadow-sm dark:bg-zinc-800 dark:border-zinc-700"
            >
              <span>{org}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeOrganizer(org)}
                  className="rounded-full p-0.5 text-zinc-400 hover:text-red-600 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
                  title={`Retirer ${org}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))
        )}
      </div>

      {!disabled && (
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Menu déroulant des clubs & institutions */}
          <div className="flex-1">
            <select
              value={selectValue}
              onChange={(e) => {
                if (e.target.value) {
                  addOrganizer(e.target.value);
                }
              }}
              className="w-full h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs dark:border-zinc-800 dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <option value="">+ Ajouter un club / institution co-organisatrice...</option>
              <optgroup label="Institutions ENSA">
                {standardOptions.filter((o) => !selected.includes(o)).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </optgroup>
              <optgroup label="Clubs Étudiants ENSA Fès">
                {clubOptions.filter((o) => !selected.includes(o)).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Saisie d'un organisateur externe ou partenaire libre */}
          <div className="flex gap-1.5">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addOrganizer(customInput);
                }
              }}
              placeholder="Autre partenaire..."
              className="w-full sm:w-44 h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs dark:border-zinc-800 dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addOrganizer(customInput)}
              disabled={!customInput.trim()}
              className="h-9 px-2.5 rounded-xl text-xs gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
