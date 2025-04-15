
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

type SortOption = "relevance" | "price-low" | "price-high" | "rating";

interface FilterBarProps {
  onSortChange: (option: SortOption) => void;
  onPriceFilterChange?: (min: number | null, max: number | null) => void;
  totalResults: number;
}

const FilterBar = ({ onSortChange, onPriceFilterChange, totalResults }: FilterBarProps) => {
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [priceRange, setPriceRange] = useState<[number]>([1000]);
  const maxPriceValue = 5000;

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
            <Input
              type="number"
              placeholder="Min $"
              className="w-20"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <span className="text-gray-600">to</span>
            <Input
              type="number"
              placeholder="Max $"
              className="w-20"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
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
          <span className="text-xs text-gray-600 mb-1">Max price: ${priceRange[0]}</span>
          <Slider
            defaultValue={[1000]}
            max={maxPriceValue}
            step={100}
            onValueChange={handleSliderChange}
          />
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
