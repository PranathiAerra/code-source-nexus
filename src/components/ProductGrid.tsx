import React, { useState, useEffect, useRef } from "react";
import ProductCard, { Product } from "./ProductCard";
import FilterBar from "./FilterBar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader, AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ProductGridProps {
  searchQuery?: string;
}

const ProductGrid = ({ searchQuery = "" }: ProductGridProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<{ min: number | null; max: number | null }>({
    min: null,
    max: null
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortOption, setSortOption] = useState("relevance");
  const [lastSearchTime, setLastSearchTime] = useState(Date.now());
  const itemsPerPage = 12;
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchProducts = async (
    query: string, 
    sortOpt = sortOption, 
    page = currentPage,
    minPrice = priceRange.min, 
    maxPrice = priceRange.max
  ) => {
    setLoading(true);
    setError(null);
    setLastSearchTime(Date.now());

    try {
      console.log(`Fetching products. Query: "${query}", Sort: ${sortOpt}, Page: ${page}, Price range: ${minPrice}-${maxPrice}`);
      const offset = (page - 1) * itemsPerPage;
      
      let sortBy = "Price";
      let sortOrder = "asc";
      
      switch (sortOpt) {
        case "price-low":
          sortBy = "Price";
          sortOrder = "asc";
          break;
        case "price-high":
          sortBy = "Price";
          sortOrder = "desc";
          break;
        case "rating":
          sortBy = "rating";
          sortOrder = "desc";
          break;
        default:
          sortBy = "Price";
          sortOrder = "asc";
      }

      let queryBuilder = supabase
        .from('amazon_products_2')
        .select('*', { count: 'exact' })
        .range(offset, offset + itemsPerPage - 1)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      if (query && query.trim() !== '') {
        queryBuilder = queryBuilder.or(
          `Product Title.ilike.%${query}%,Product Description.ilike.%${query}%,Brand.ilike.%${query}%,Category.ilike.%${query}%`
        );
      }

      if (minPrice !== null) {
        queryBuilder = queryBuilder.gte('Price', minPrice);
      }
      if (maxPrice !== null) {
        queryBuilder = queryBuilder.lte('Price', maxPrice);
      }

      const { data: products, error: dbError, count } = await queryBuilder;

      if (dbError) throw dbError;

      if (!products || products.length === 0) {
        let similarProducts = [];
        
        if (query) {
          const { data: categoryData } = await supabase
            .from('amazon_products_2')
            .select('Category')
            .ilike('Product Title', `%${query}%`)
            .limit(1);
            
          if (categoryData && categoryData.length > 0 && categoryData[0].Category) {
            const { data: similarData } = await supabase
              .from('amazon_products_2')
              .select('*')
              .eq('Category', categoryData[0].Category)
              .limit(4);
              
            similarProducts = similarData || [];
          }
        }

        setProducts([]);
        setSuggestedProducts(similarProducts.map(product => transformProductData(product)));
        setTotalItems(0);
      } else {
        setProducts(products.map(product => transformProductData(product)));
        setTotalItems(count || products.length);
        setSuggestedProducts([]);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to fetch products. Please try again later.");
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const transformProductData = (dbProduct: any): Product => ({
    id: dbProduct['Unique ID'] || String(Math.random()),
    name: dbProduct['Product Title'] || 'Unknown Product',
    price: dbProduct['Price'] || 0,
    originalPrice: dbProduct['Mrp'] || null,
    image: dbProduct['Image Urls'] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
    rating: Math.floor(Math.random() * 2) + 3.5,
    store: dbProduct['Site Name'] || 'Unknown Store',
    storeUrl: '#',
    offer: dbProduct['Offers'] || null
  });

  useEffect(() => {
    setCurrentPage(1);
    fetchProducts(searchQuery);
    
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    refreshIntervalRef.current = setInterval(() => {
      if (Date.now() - lastSearchTime > 5000) {
        console.log("Auto-refreshing search results");
        fetchProducts(searchQuery, sortOption, currentPage, priceRange.min, priceRange.max);
      }
    }, 5000);
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [searchQuery]);

  const handleSortChange = (sortOpt: string) => {
    setSortOption(sortOpt);
    fetchProducts(searchQuery, sortOpt, currentPage);
  };

  const handlePriceFilterChange = (min: number | null, max: number | null) => {
    setPriceRange({ min, max });
    fetchProducts(searchQuery, sortOption, 1, min, max);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchProducts(searchQuery, sortOption, page, priceRange.min, priceRange.max);
  };

  const handleRefresh = () => {
    fetchProducts(searchQuery, sortOption, currentPage, priceRange.min, priceRange.max);
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (start === 2) end = Math.min(totalPages - 1, start + 2);
      if (end === totalPages - 1) start = Math.max(2, end - 2);
      
      if (start > 2) pages.push(-1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages - 1) pages.push(-2);
      
      if (totalPages > 1) pages.push(totalPages);
    }
    
    return pages;
  };

  const renderSkeletons = () => {
    return Array(itemsPerPage).fill(0).map((_, i) => (
      <div key={i} className="flex flex-col h-full">
        <Skeleton className="w-full aspect-square rounded-t-lg" />
        <div className="p-4">
          <Skeleton className="h-4 w-1/4 mb-2" />
          <Skeleton className="h-5 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3 mb-6" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    ));
  };

  return (
    <div>
      <FilterBar 
        onSortChange={handleSortChange} 
        totalResults={loading ? 0 : products.length} 
        onPriceFilterChange={handlePriceFilterChange}
      />
      
      {error && (
        <Alert variant="destructive" className="my-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <div className="mt-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} className="flex items-center">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {loading ? (
        <div>
          <div className="flex justify-center my-4">
            <Loader className="h-6 w-6 animate-spin text-blue-600" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {renderSkeletons()}
          </div>
        </div>
      ) : products.length === 0 && suggestedProducts.length === 0 ? (
        <div className="text-center py-10">
          <div className="mb-6">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          </div>
          <p className="text-xl text-gray-600 mb-2">No products found</p>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Try adjusting your search or filter settings to find what you're looking for.
          </p>
          <Button onClick={handleRefresh} className="flex items-center">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Results
          </Button>
        </div>
      ) : (
        <>
          {products.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          
          {products.length === 0 && suggestedProducts.length > 0 && (
            <div>
              <div className="text-center py-6">
                <p className="text-xl text-gray-600 mb-2">No exact matches found</p>
                <p className="text-gray-500 mb-6">
                  Here are some similar products you might be interested in:
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {suggestedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}
          
          {products.length > 0 && totalPages > 1 && (
            <Pagination className="my-10">
              <PaginationContent>
                {currentPage > 1 && (
                  <PaginationItem>
                    <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} />
                  </PaginationItem>
                )}
                
                {getPageNumbers().map((page, index) => (
                  <PaginationItem key={index}>
                    {page === -1 || page === -2 ? (
                      <span className="flex h-9 w-9 items-center justify-center">...</span>
                    ) : (
                      <PaginationLink 
                        isActive={page === currentPage}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                
                {currentPage < totalPages && (
                  <PaginationItem>
                    <PaginationNext onClick={() => handlePageChange(currentPage + 1)} />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
};

export default ProductGrid;
