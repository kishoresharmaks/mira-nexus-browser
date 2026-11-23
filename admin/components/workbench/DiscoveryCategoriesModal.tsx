'use client';

import { useState } from 'react';
import type { DiscoveryCategory } from '@/lib/catalog';

const ALLOWLISTED_ICONS = [
  'compass',
  'sparkle',
  'book',
  'code',
  'fileText',
  'archive',
  'newspaper',
  'video',
  'image',
  'globe',
  'grid',
  'bookmark',
  'folder',
  'download',
  'shield',
] as const;

type Props = {
  isOpen: boolean;
  categories: DiscoveryCategory[];
  onClose: () => void;
  onAddCategory: (category: DiscoveryCategory) => void;
  onUpdateCategory: (id: string, patch: Partial<DiscoveryCategory>) => void;
  onDeleteCategory: (id: string) => void;
};

export function DiscoveryCategoriesModal({
  isOpen,
  categories,
  onClose,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // New category form state
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIcon, setNewIcon] = useState<string>('compass');
  const [newOrder, setNewOrder] = useState<number>(categories.length + 1);

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = newId.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (!id || !newName.trim()) return;

    onAddCategory({
      id,
      name: newName.trim(),
      description: newDesc.trim(),
      icon: newIcon,
      order: newOrder,
      enabled: true,
    });

    setNewId('');
    setNewName('');
    setNewDesc('');
    setNewIcon('compass');
    setNewOrder(categories.length + 2);
    setIsAdding(false);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const currentCat = categories[index];
    const targetCat = categories[targetIndex];

    onUpdateCategory(currentCat.id, { order: targetCat.order });
    onUpdateCategory(targetCat.id, { order: currentCat.order });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="categories-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-sheet, #FFFFFF)',
          color: 'var(--color-ink, #1F1F1F)',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          border: '1px solid var(--color-rule, #E5E5E5)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--color-rule, #E5E5E5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 id="categories-modal-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
              Discovery Categories
            </h2>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--color-muted, #737373)' }}>
              Manage dynamic editorial filter pills displayed in the Android app.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-quiet btn-small"
            style={{ fontSize: '1.1rem', padding: '0.25rem 0.6rem' }}
          >
            ✕
          </button>
        </div>

        {/* Content list */}
        <div style={{ overflowY: 'auto', padding: '1.5rem', flex: 1 }}>
          {categories.length === 0 && !isAdding ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-muted)' }}>
              <p style={{ margin: '0 0 1rem' }}>No discovery categories created yet.</p>
              <button
                type="button"
                className="btn btn-primary btn-small"
                onClick={() => setIsAdding(true)}
              >
                Create First Category
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {categories.map((cat, idx) => (
                <div
                  key={cat.id}
                  style={{
                    padding: '0.85rem 1rem',
                    border: '1px solid var(--color-rule, #E5E5E5)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: cat.enabled ? 'var(--color-paper, #F9F9F8)' : 'var(--color-paper-2, #EFEFEF)',
                    opacity: cat.enabled ? 1 : 0.65,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.15rem 0.4rem',
                          borderRadius: '4px',
                          backgroundColor: 'var(--color-rule, #E5E5E5)',
                          fontFamily: 'monospace',
                        }}
                      >
                        {cat.icon}
                      </span>
                      <strong style={{ fontSize: '0.95rem' }}>{cat.name}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontFamily: 'monospace' }}>
                        ({cat.id})
                      </span>
                    </div>
                    {cat.description ? (
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                        {cat.description}
                      </p>
                    ) : null}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      type="button"
                      className="btn btn-quiet btn-small"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, 'up')}
                      title="Move Up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn btn-quiet btn-small"
                      disabled={idx === categories.length - 1}
                      onClick={() => handleMove(idx, 'down')}
                      title="Move Down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className={`btn btn-small ${cat.enabled ? 'btn-quiet' : 'btn-primary'}`}
                      onClick={() => onUpdateCategory(cat.id, { enabled: !cat.enabled })}
                    >
                      {cat.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-small"
                      onClick={() => onDeleteCategory(cat.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Category Form */}
          {isAdding ? (
            <form
              onSubmit={handleAddSubmit}
              style={{
                marginTop: '1.25rem',
                padding: '1.25rem',
                border: '1px solid var(--color-rule, #E5E5E5)',
                borderRadius: '6px',
                backgroundColor: 'var(--color-paper, #F9F9F8)',
              }}
            >
              <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>
                Add New Discovery Category
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                    Display Name *
                  </label>
                  <input
                    className="input"
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      if (!newId) setNewId(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                    }}
                    placeholder="e.g. Web Destinations"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                    Category ID *
                  </label>
                  <input
                    className="input"
                    value={newId}
                    onChange={(e) => setNewId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    placeholder="e.g. destinations"
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                  Description
                </label>
                <input
                  className="input"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Short description of this category"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                    Allowlisted Icon
                  </label>
                  <select
                    className="input"
                    value={newIcon}
                    onChange={(e) => setNewIcon(e.target.value)}
                  >
                    {ALLOWLISTED_ICONS.map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                    Display Order
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={newOrder}
                    onChange={(e) => setNewOrder(Number(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-quiet btn-small"
                  onClick={() => setIsAdding(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-small">
                  Add Category
                </button>
              </div>
            </form>
          ) : (
            <div style={{ marginTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-quiet btn-small"
                onClick={() => setIsAdding(true)}
              >
                + Add Category
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--color-rule, #E5E5E5)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button type="button" className="btn btn-primary btn-small" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
