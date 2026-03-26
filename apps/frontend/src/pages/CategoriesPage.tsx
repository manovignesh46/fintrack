import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoriesApi } from '../api/client';
import type { Category, EntityType, TxNature } from '../api/types';
import { ENTITIES } from '../api/types';

export default function CategoriesPage() {
  const navigate = useNavigate();
  const [selectedEntity, setSelectedEntity] = useState<EntityType>('PERSONAL');
  const [selectedNature, setSelectedNature] = useState<TxNature>('EXPENSE');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    categoriesApi.list({ entity: selectedEntity, nature: selectedNature })
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [selectedEntity, selectedNature]);

  const deleteCategory = async (id: number) => {
    if (!confirm('Delete category and all its sub-categories?')) return;
    try {
      await categoriesApi.delete(id);
      load();
    } catch { alert('Failed'); }
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
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium ${
              selectedEntity === e ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600'
            }`}
          >
            {e}
          </button>
        ))}
      </div>

      {/* Nature tabs */}
      <div className="flex gap-2">
        {(['EXPENSE', 'INCOME'] as TxNature[]).map((n) => (
          <button
            key={n}
            onClick={() => setSelectedNature(n)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium ${
              selectedNature === n ? 'bg-orange-600 text-white' : 'bg-white border border-gray-300 text-gray-600'
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-4">Loading...</p>
      ) : categories.length === 0 ? (
        <p className="text-gray-400 text-center py-4">No categories yet</p>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-100">
                <span className="font-bold text-gray-800 text-sm italic">{cat.name}</span>
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate(`/categories/${cat.id}/sub/new`)}
                    className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-md font-semibold border border-blue-100"
                  >
                    + Sub
                  </button>
                  <button onClick={() => deleteCategory(cat.id)} className="text-xs text-red-500 font-medium">
                    Delete
                  </button>
                </div>
              </div>

              {/* Sub-categories */}
              <div className="divide-y divide-gray-50">
                {(cat.sub_categories ?? []).length === 0 ? (
                  <p className="px-5 py-3 text-xs text-gray-400 italic">No sub-categories</p>
                ) : (
                  (cat.sub_categories ?? []).map((sc) => (
                    <div key={sc.id} className="flex justify-between items-center px-5 py-2.5 hover:bg-gray-50 transition-colors">
                      <span className="text-sm text-gray-600 font-medium">{sc.name}</span>
                      <button onClick={() => deleteSubCategory(cat.id, sc.id)} className="text-red-300 hover:text-red-500 transition-colors p-1">
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => navigate('/categories/new')}
        className="fixed bottom-20 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center text-3xl hover:bg-blue-700 transition-all active:scale-95 z-40"
      >
        +
      </button>
    </div>
  );
}

