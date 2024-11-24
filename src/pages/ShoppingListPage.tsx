import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Trash2, Check, ShoppingCart } from 'lucide-react';
import { useStore } from '../store';
import toast from 'react-hot-toast';

export function ShoppingListPage() {
  const navigate = useNavigate();
  const { 
    shoppingList, 
    toggleShoppingItem, 
    removeFromShoppingList, 
    clearCompletedItems,
    clearShoppingList 
  } = useStore();
  
  const pendingItems = shoppingList.filter(item => !item.completed).length;

  const handleClearAll = () => {
    clearShoppingList();
    toast.success('Shopping list cleared');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 border-b border-gray-100 bg-white px-8 py-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold">Shopping List</h1>
            {pendingItems > 0 && (
              <span className="bg-[#FF6B6B] text-white text-sm px-3 py-1 rounded-full">
                {pendingItems} items
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={clearCompletedItems}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear Completed
            </button>
            {shoppingList.length > 0 && (
              <button
                onClick={handleClearAll}
                className="btn btn-secondary flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        {shoppingList.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Your shopping list is empty</p>
          </div>
        ) : (
          <div className="space-y-2">
            {shoppingList.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-4 rounded-xl bg-white shadow-sm transition-all ${
                  item.completed ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleShoppingItem(item.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      item.completed
                        ? 'border-[#FF6B6B] bg-[#FF6B6B]'
                        : 'border-gray-300 hover:border-[#FF6B6B]'
                    }`}
                  >
                    {item.completed && <Check className="w-4 h-4 text-white" />}
                  </button>
                  <span className={item.completed ? 'line-through text-gray-500' : ''}>
                    {item.name}
                  </span>
                </div>
                <button
                  onClick={() => removeFromShoppingList(item.id)}
                  className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}