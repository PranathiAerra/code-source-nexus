
import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ProductGridEmptyProps {
  onRefresh: () => void;
}

const ProductGridEmpty = ({ onRefresh }: ProductGridEmptyProps) => {
  return (
    <div className="text-center py-10">
      <div className="mb-6">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
      </div>
      <p className="text-xl text-gray-600 mb-2">No products found</p>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        Try adjusting your search or filter settings to find what you're looking for.
      </p>
      <Button onClick={onRefresh} className="flex items-center">
        <RefreshCw className="mr-2 h-4 w-4" />
        Refresh Results
      </Button>
    </div>
  );
};

export default ProductGridEmpty;
