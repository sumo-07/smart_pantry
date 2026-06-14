import React from "react";
import { CheckSquare, Square, ShoppingBag, Plus, Sparkles, ShoppingCart, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";

export default function ShoppingListCard({ items = [], onToggleItem, onAddItem }) {
  const { addToCart } = useCart();
  const [newItemName, setNewItemName] = React.useState("");
  const [newItemQty, setNewItemQty] = React.useState(1);
  const [addedItems, setAddedItems] = React.useState({}); // Visual feedback for added items

  const handleAddToCart = (item) => {
    addToCart({
      name: item.name,
      quantity: Number(item.quantityNeeded) || 1,
      price: 1.99 // Default fallback price for custom scanned items
    });

    setAddedItems((prev) => ({ ...prev, [item.name]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [item.name]: false }));
    }, 1500);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    onAddItem(newItemName.trim(), Number(newItemQty));
    setNewItemName("");
    setNewItemQty(1);
  };

  const checkedCount = items.filter(i => i.checked).length;

  return (
    <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-pink-500/5 blur-2xl pointer-events-none" />

      <div className="flex justify-between items-center mb-5 pb-4 border-b border-brand-border">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-indigo-400" />
            Smart Shopping List
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {checkedCount} of {items.length} items checked
          </p>
        </div>
        
        {items.length > 0 && checkedCount === items.length && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Fully Restocked
          </span>
        )}
      </div>

      {/* Add Item Inline Form */}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          placeholder="Add custom item..."
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          className="flex-1 bg-white/5 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition w-full"
        />
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="number"
            min="1"
            value={newItemQty}
            onChange={(e) => setNewItemQty(e.target.value)}
            className="w-20 bg-white/5 border border-gray-700 rounded-xl px-2 py-2.5 text-sm text-center text-white focus:outline-none focus:border-indigo-500 transition"
          />
          <button
            type="submit"
            className="flex-1 sm:flex-none p-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition shadow-lg shadow-indigo-500/20 flex items-center justify-center cursor-pointer min-h-[42px]"
          >
            <Plus className="h-4 w-4 mr-1.5 sm:mr-0" />
            <span className="sm:hidden text-sm font-semibold">Add Item</span>
          </button>
        </div>
      </form>

      {/* Items Checklist */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {items.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-gray-500 text-center py-6"
            >
              No items in your shopping list yet.
            </motion.p>
          ) : (
            items.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                onClick={() => onToggleItem(index)}
                className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                  item.checked
                    ? "bg-white/1 border-brand-border opacity-50"
                    : "bg-white/4 border-gray-800 hover:border-gray-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.checked ? (
                    <CheckSquare className="h-5 w-5 text-indigo-400 shrink-0" />
                  ) : (
                    <Square className="h-5 w-5 text-gray-500 shrink-0" />
                  )}
                  <span className={`text-sm font-semibold transition ${
                    item.checked ? "line-through text-gray-500" : "text-gray-200"
                  }`}>
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg shrink-0 ${
                    item.checked ? "bg-gray-800 text-gray-650" : "bg-indigo-500/10 text-indigo-400"
                  }`}>
                    Need {item.quantityNeeded}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddToCart(item)}
                    disabled={item.checked}
                    className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center justify-center ${
                      addedItems[item.name]
                        ? "bg-emerald-500 text-brand-dark border-emerald-500"
                        : "bg-white/5 hover:bg-indigo-500 text-gray-400 hover:text-white border-brand-border hover:border-indigo-500 disabled:opacity-40 disabled:pointer-events-none"
                    }`}
                    title="Add to Amazon Now Cart"
                  >
                    {addedItems[item.name] ? (
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    ) : (
                      <ShoppingCart className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
