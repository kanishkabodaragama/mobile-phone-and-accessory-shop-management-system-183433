import React, { useState } from 'react';

// PUBLIC_INTERFACE
export default function Tabs({ tabs = [], defaultActive = 0 }) {
  /** This is a public function. */
  const [active, setActive] = useState(defaultActive);
  const Active = tabs[active]?.content || null;

  return (
    <div>
      <div className="tabs">
        {tabs.map((t, idx) => (
          <button
            key={t.key || t.label}
            className={['tab', active === idx ? 'active' : ''].join(' ')}
            onClick={() => setActive(idx)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ paddingTop: 12 }}>
        {typeof Active === 'function' ? <Active /> : Active}
      </div>
    </div>
  );
}
