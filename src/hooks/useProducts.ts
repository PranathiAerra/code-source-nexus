
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/components/ProductCard";
import { toast } from "sonner";

interface UseProductsProps {
  searchQuery: string;
  sortOption: string;
  currentPage: number;
  priceRange: {
    min: number | null;
    max: number | null;
  };
}

export const useProducts = ({ searchQuery, sortOption, currentPage, priceRange }: UseProductsProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [lastSearchTime, setLastSearchTime] = useState(Date.now());
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    setLastSearchTime(Date.now());

    try {
      console.log(`Fetching products. Query: "${searchQuery}", Sort: ${sortOption}, Page: ${currentPage}, Price range: ${priceRange.min}-${priceRange.max}`);
      const itemsPerPage = 12;
      const offset = (currentPage - 1) * itemsPerPage;
      
      let sortBy = "Price";
      let sortOrder = "asc";
      
      switch (sortOption) {
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

      if (searchQuery && searchQuery.trim() !== '') {
        queryBuilder = queryBuilder.or(
          `Product Title.ilike.%${searchQuery}%,Product Description.ilike.%${searchQuery}%,Brand.ilike.%${searchQuery}%,Category.ilike.%${searchQuery}%`
        );
      }

      if (priceRange.min !== null) {
        queryBuilder = queryBuilder.gte('Price', priceRange.min);
      }
      if (priceRange.max !== null) {
        queryBuilder = queryBuilder.lte('Price', priceRange.max);
      }

      const { data: products, error: dbError, count } = await queryBuilder;

      if (dbError) throw dbError;

      if (!products || products.length === 0) {
        let similarProducts = [];
        
        if (searchQuery) {
          const { data: categoryData } = await supabase
            .from('amazon_products_2')
            .select('Category')
            .ilike('Product Title', `%${searchQuery}%`)
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

  useEffect(() => {
    fetchProducts();
    
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    refreshIntervalRef.current = setInterval(() => {
      if (Date.now() - lastSearchTime > 5000) {
        console.log("Auto-refreshing search results");
        fetchProducts();
      }
    }, 5000);
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [searchQuery, sortOption, currentPage, priceRange.min, priceRange.max]);

  return {
    products,
    suggestedProducts,
    loading,
    error,
    totalItems,
    fetchProducts
  };
};
