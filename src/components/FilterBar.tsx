
import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { IndianRupee, SlidersHorizontal } from "lucide-react";

type SortOption = "relevance" | "price-low" | "price-high" | "rating";

interface FilterBarProps {
  onSortChange: (option: SortOption) => void;
  onPriceFilterChange?: (min: number | null, max: number | null) => void;
  totalResults: number;
}

const FilterBar = ({ onSortChange, onPriceFilterChange, totalResults }: FilterBarProps) => {
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [priceRange, setPriceRange] = useState<[number]>([10000]);
  const maxPriceValue = 50000;

  const handlePriceFilter = () => {
    if (onPriceFilterChange) {
      const min = minPrice ? parseFloat(minPrice) : null;
      const max = maxPrice ? parseFloat(maxPrice) : null;
      onPriceFilterChange(min, max);
    }
  };

  const handleSliderChange = (value: number[]) => {
    setPriceRange([value[0]]);
    setMaxPrice(String(value[0]));
    if (onPriceFilterChange) {
      onPriceFilterChange(0, value[0]);
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-4 mb-6 border-b">
      <div className="mb-4 md:mb-0">
        <p className="text-gray-600">
          <span className="font-medium">{totalResults}</span> results found
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:items-center gap-4 w-full md:w-auto">
        <div className="flex items-center space-x-2">
          <span className="text-gray-600 whitespace-nowrap">Sort by:</span>
          <Select
            onValueChange={(value) => onSortChange(value as SortOption)}
            defaultValue="relevance"
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Relevance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-2 gap-2 items-center">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="number"
                placeholder="Min"
                className="pl-8 w-24"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>
            <span className="text-gray-600">to</span>
            <div className="relative">
              <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="number"
                placeholder="Max"
                className="pl-8 w-24"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>
          
          <Button 
            onClick={handlePriceFilter}
            variant="outline"
            className="whitespace-nowrap"
            size="sm"
          >
            Apply
          </Button>
        </div>

        <div className="flex flex-col w-full md:w-48 lg:w-36">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Max price:</span>
            <div className="flex items-center text-xs font-medium">
              <IndianRupee className="h-3 w-3 mr-0.5" />
              <span>{priceRange[0].toLocaleString('en-IN')}</span>
            </div>
          </div>
          <Slider
            defaultValue={[10000]}
            max={maxPriceValue}
            step={1000}
            onValueChange={handleSliderChange}
          />
        </div>

        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center"
          onClick={() => {
            setMinPrice("");
            setMaxPrice("");
            setPriceRange([10000]);
            if (onPriceFilterChange) {
              onPriceFilterChange(null, null);
            }
          }}
        >
          <SlidersHorizontal className="h-4 w-4 mr-1" />
          Reset
        </Button>
      </div>
    </div>
  );
};

export default FilterBar;
