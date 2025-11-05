import React from 'react';
import Input from './Input';

// PUBLIC_INTERFACE
export default function DateRangePicker({ start, end, onChange }) {
  /** This is a public function. Simple placeholder using two date inputs. */
  const handleStart = (e) => onChange?.({ start: e.target.value, end });
  const handleEnd = (e) => onChange?.({ start, end: e.target.value });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Input type="date" value={start || ''} onChange={handleStart} />
      <span>—</span>
      <Input type="date" value={end || ''} onChange={handleEnd} />
    </div>
  );
}
