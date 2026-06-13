import React from "react";
import ShoppingListCard from "../components/ShoppingListCard";
import LoadingSkeleton from "../components/LoadingSkeleton";
import EmptyState from "../components/EmptyState";
import { ShoppingBag } from "lucide-react";

export default function ShoppingList({ 
  shoppingList = [], 
  onToggleItem, 
  onAddItem, 
  isLoading,
  scansExist
}) {

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!scansExist) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState 
          title="No Shopping List Yet" 
          description="Your shopping list is automatically generated based on items that are running low in your pantry scans."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header bar */}
      <div className="border-b border-brand-border pb-5">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <ShoppingBag className="h-7 w-7 text-indigo-400" />
          Shopping List
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Review restocks calculated by AI scans or add custom entries.
        </p>
      </div>

      <ShoppingListCard 
        items={shoppingList} 
        onToggleItem={onToggleItem} 
        onAddItem={onAddItem} 
      />
    </div>
  );
}
