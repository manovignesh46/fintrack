import { useEffect, useState } from 'react';
import { categoriesApi } from '../api/client';
import type { Category, EntityType } from '../api/types';
import { ENTITIES } from '../api/types';

export default function CategoriesPage() {
  const [selectedEntity, setSelectedEntity] = useState<EntityType>('PERSONAL');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState('');
  const [addingSub, setAddingSub] = useState<number | null>(null);
  const [newSubName, setNewSubName] = useState('');

  const load = () => {
    setLoading(true);
    categoriesApi.list(selectedEntity)
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [selectedEntity]);

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await categoriesApi.create({ name: newCatName.trim(), entity: selectedEntity });
      setNewCatName('');
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm('Delete category and all its sub-categories?')) return;
    try {
      await categoriesApi.delete(id);
      load();
    } catch { alert('Failed'); }
  };

  const addSubCategory = async (e: React.FormEvent, categoryId: number) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    try {
      await categoriesApi.createSub(categoryId, { name: newSubName.trim() });
      setNewSubName(''); setAddingSub(null);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  const deleteSubCategory = async (categoryId: number, subId: number) => {
    if (!confirm('Delete this sub-category?')) return;
    try {
      await categoriesApi.deleteSub(categoryId, subId);
      load();
    } catch { alert('Failed'); }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Categories</h2>

      {/* Entity tabs */}
      <div className="flex gap-2">
        {ENTITIES.map((e) => (
          <button
            key={e}
            onClick={() => setSelectedEntity(e)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${
              selectedEntity === e ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600'
            }`}
          >
            {e}
          </button>
        ))}
      </div>

      {/* Add category form */}
      <form onSubmit={addCategory} className="flex gap-2">
        <input
          type="text" placeholder={`New ${selectedEntity} category`}
          value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
          Add
        </button>
      </form>

      {loading ? (
        <p className="text-gray-400 text-center py-4">Loading...</p>
      ) : categories.length === 0 ? (
        <p className="text-gray-400 text-center py-4">No categories yet</p>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex justify-between items-center px-3 py-2.5 bg-gray-50">
                <span className="font-medium text-gray-800 text-sm">{cat.name}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setAddingSub(addingSub === cat.id ? null : cat.id); setNewSubName(''); }}
                    className="text-xs text-blue-500"
                  >
                    + Sub
                  </button>
                  <button onClick={() => deleteCategory(cat.id)} className="text-xs text-red-500">
                    Del
                  </button>
                </div>
              </div>

              {/* Add sub-category inline form */}
              {addingSub === cat.id && (
                <form onSubmit={(e) => addSubCategory(e, cat.id)} className="flex gap-2 px-3 py-2 border-t border-gray-100">
                  <input
                    type="text" placeholder="Sub-category name" value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)} autoFocus
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm outline-none"
                  />
                  <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs">Add</button>
                </form>
              )}

              {/* Sub-categories */}
              {(cat.sub_categories ?? []).map((sc) => (
                <div key={sc.id} className="flex justify-between items-center px-4 py-2 border-t border-gray-100">
                  <span className="text-sm text-gray-600">{sc.name}</span>
                  <button onClick={() => deleteSubCategory(cat.id, sc.id)} className="text-xs text-red-400">
                    Del
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
