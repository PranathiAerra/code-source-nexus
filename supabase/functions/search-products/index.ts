
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const fallbackImage = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      searchTerm, 
      minPrice, 
      maxPrice, 
      sortBy, 
      sortOrder, 
      limit = 20, 
      offset = 0,
      category = null,
      featured = false,
      discounted = false,
      topRated = false
    } = await req.json();

    console.log("Search parameters:", JSON.stringify({
      searchTerm,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder,
      limit,
      offset,
      category,
      featured,
      discounted,
      topRated
    }, null, 2));

    // Helper function to safely parse price strings
    const parsePrice = (price: string | number | null): number => {
      if (typeof price === 'number') return price;
      if (!price) return 0;
      return parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
    };

    // Transform functions for different data sources
    const transformAmazonProduct = (product: any) => ({
      id: product['Unique ID'] || String(Math.random()),
      name: product['Product Title'] || 'Unknown Product',
      price: typeof product.Price === 'number' ? product.Price : parsePrice(product.Price),
      originalPrice: typeof product.Mrp === 'number' ? product.Mrp : parsePrice(product.Mrp),
      image: product['Image Urls'] || fallbackImage,
      rating: parseFloat(product.rating || '0') || Math.floor(Math.random() * 2) + 3.5,
      store: product['Site Name'] || 'Amazon In',
      storeUrl: 'https://www.amazon.in',
      offer: product.Offers || null
    });

    const transformFlipkartProduct = (product: any) => ({
      id: product.uniq_id || String(Math.random()),
      name: product.product_name || 'Unknown Product',
      price: parsePrice(product.discounted_price),
      originalPrice: parsePrice(product.retail_price),
      image: Array.isArray(product.image) ? product.image[0] : 
             typeof product.image === 'string' ? product.image : 
             fallbackImage,
      rating: parseFloat(product.product_rating || '0') || Math.floor(Math.random() * 2) + 3.5,
      store: 'Flipkart',
      storeUrl: 'https://www.flipkart.com',
      offer: product.discounted_price && product.retail_price 
        ? `${Math.round(((parsePrice(product.retail_price) - parsePrice(product.discounted_price)) / parsePrice(product.retail_price)) * 100)}`
        : null
    });

    const transformFashionProduct = (product: any) => ({
      id: String(product.p_id || Math.random()),
      name: product.name || 'Unknown Product',
      price: parsePrice(product.price),
      originalPrice: parsePrice(product.price), // Fashion table doesn't have original price
      image: product.img || fallbackImage,
      rating: parseFloat(product.avg_rating || '0') || Math.floor(Math.random() * 2) + 3.5,
      store: product.brand || 'Fashion Store',
      storeUrl: 'https://www.myntra.com', // Default to Myntra for fashion products
      offer: null
    });

    // Build search queries for all tables
    let queries = [];
    
    // Amazon Products Queries
    if (searchTerm && searchTerm.trim() !== '') {
      queries.push(
        supabase
          .from('amazon_products_1')
          .select('*', { count: 'exact' })
          .or(`Product Title.ilike.%${searchTerm}%,Brand.ilike.%${searchTerm}%,Category.ilike.%${searchTerm}%`)
          .range(offset, offset + limit - 1),
        supabase
          .from('amazon_products_2')
          .select('*', { count: 'exact' })
          .or(`Product Title.ilike.%${searchTerm}%,Brand.ilike.%${searchTerm}%,Category.ilike.%${searchTerm}%`)
          .range(offset, offset + limit - 1)
      );
    }

    // Flipkart Queries
    if (searchTerm && searchTerm.trim() !== '') {
      queries.push(
        supabase
          .from('flipkart_1')
          .select('*', { count: 'exact' })
          .or(`product_name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`)
          .range(offset, offset + limit - 1),
        supabase
          .from('flipkart_2')
          .select('*', { count: 'exact' })
          .or(`product_name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`)
          .range(offset, offset + limit - 1)
      );
    }

    // Fashion Query
    if (searchTerm && searchTerm.trim() !== '') {
      queries.push(
        supabase
          .from('fashion_1')
          .select('*', { count: 'exact' })
          .or(`name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`)
          .range(offset, offset + limit - 1)
      );
    }

    // If no search term, get random products from each source
    if (!searchTerm || searchTerm.trim() === '') {
      queries = [
        supabase.from('amazon_products_1').select('*', { count: 'exact' }).limit(limit / 3),
        supabase.from('amazon_products_2').select('*', { count: 'exact' }).limit(limit / 3),
        supabase.from('flipkart_1').select('*', { count: 'exact' }).limit(limit / 3),
        supabase.from('flipkart_2').select('*', { count: 'exact' }).limit(limit / 3),
        supabase.from('fashion_1').select('*', { count: 'exact' }).limit(limit / 3)
      ];
    }

    // Execute all queries
    const results = await Promise.all(queries);
    
    // Process results and combine products
    let allProducts = [];
    let totalCount = 0;

    results.forEach(result => {
      if (result.error) throw result.error;
      
      const products = result.data || [];
      totalCount += result.count || 0;

      // Transform products based on their source
      const tableName = result.data?.[0]?.['Product Title'] !== undefined ? 'amazon' :
                       result.data?.[0]?.product_name !== undefined ? 'flipkart' : 'fashion';

      const transformedProducts = products.map(product => {
        switch(tableName) {
          case 'amazon':
            return transformAmazonProduct(product);
          case 'flipkart':
            return transformFlipkartProduct(product);
          case 'fashion':
            return transformFashionProduct(product);
          default:
            return null;
        }
      }).filter(Boolean);

      allProducts = [...allProducts, ...transformedProducts];
    });

    // Apply price filters
    if (minPrice !== null && minPrice !== undefined) {
      allProducts = allProducts.filter(p => p.price >= minPrice);
    }
    if (maxPrice !== null && maxPrice !== undefined) {
      allProducts = allProducts.filter(p => p.price <= maxPrice);
    }

    // Sort combined results
    switch (sortBy) {
      case 'price-low':
        allProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        allProducts.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        allProducts.sort((a, b) => b.rating - a.rating);
        break;
      default:
        if (searchTerm && searchTerm.trim() !== '') {
          allProducts.sort((a, b) => {
            const aContains = a.name.toLowerCase().includes(searchTerm.toLowerCase());
            const bContains = b.name.toLowerCase().includes(searchTerm.toLowerCase());
            if (aContains && !bContains) return -1;
            if (!aContains && bContains) return 1;
            return 0;
          });
        }
    }

    // Slice the results to match the requested limit
    allProducts = allProducts.slice(0, limit);

    console.log(`Found ${allProducts.length} products out of ${totalCount} total`);

    return new Response(
      JSON.stringify({ 
        products: allProducts, 
        total: totalCount 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
