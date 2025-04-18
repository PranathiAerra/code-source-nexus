
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const fallbackImage = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request
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

    // Function to transform Flipkart product to common format
    const transformFlipkartProduct = (product: any) => ({
      id: product.uniq_id || String(Math.random()),
      name: product.product_name || 'Unknown Product',
      price: parseFloat(product.discounted_price?.replace(/[^0-9.]/g, '') || '0'),
      originalPrice: parseFloat(product.retail_price?.replace(/[^0-9.]/g, '') || '0'),
      image: Array.isArray(product.image) ? product.image[0] : product.image || fallbackImage,
      rating: parseFloat(product.product_rating || '0') || Math.floor(Math.random() * 2) + 3.5,
      store: 'Flipkart',
      storeUrl: 'https://www.flipkart.com',
      offer: product.discounted_price && product.retail_price 
        ? `${Math.round(((parseFloat(product.retail_price.replace(/[^0-9.]/g, '')) - parseFloat(product.discounted_price.replace(/[^0-9.]/g, ''))) / parseFloat(product.retail_price.replace(/[^0-9.]/g, '')) * 100)}`
        : null
    });

    // Function to transform Amazon product to common format
    const transformAmazonProduct = (product: any) => ({
      id: product['Unique ID'] || String(Math.random()),
      name: product['Product Title'] || 'Unknown Product',
      price: typeof product.Price === 'number' ? product.Price : parseFloat(product.Price || '0'),
      originalPrice: typeof product.Mrp === 'number' ? product.Mrp : parseFloat(product.Mrp || '0'),
      image: product['Image Urls'] || fallbackImage,
      rating: Math.floor(Math.random() * 2) + 3.5,
      store: product['Site Name'] || 'Amazon In',
      storeUrl: 'https://www.amazon.in',
      offer: product.Offers || null
    });

    // Build search conditions for Amazon products
    let amazonQuery = supabase
      .from('amazon_products_2')
      .select('*', { count: 'exact' });

    // Build search conditions for Flipkart products
    let flipkartQuery = supabase
      .from('flipkart_1')
      .select('*', { count: 'exact' });

    // Apply search filters to both queries
    if (searchTerm && searchTerm.trim() !== '') {
      amazonQuery = amazonQuery.or(`Product Title.ilike.%${searchTerm}%,Brand.ilike.%${searchTerm}%,Category.ilike.%${searchTerm}%`);
      flipkartQuery = flipkartQuery.or(`product_name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`);
    }

    // Apply price filters
    if (minPrice !== undefined && minPrice !== null) {
      amazonQuery = amazonQuery.gte('Price', minPrice);
      flipkartQuery = flipkartQuery.filter('discounted_price', 'gte', minPrice.toString());
    }
    if (maxPrice !== undefined && maxPrice !== null) {
      amazonQuery = amazonQuery.lte('Price', maxPrice);
      flipkartQuery = flipkartQuery.filter('discounted_price', 'lte', maxPrice.toString());
    }

    // Apply category filter
    if (category) {
      amazonQuery = amazonQuery.eq('Category', category);
      // For Flipkart, we might need to search in the product_category_tree JSON
      // This is a simplified approach
      flipkartQuery = flipkartQuery.ilike('product_category_tree', `%${category}%`);
    }

    // Apply discount filter
    if (discounted) {
      amazonQuery = amazonQuery.not('Mrp', 'is', null).gt('Mrp', 'Price');
      flipkartQuery = flipkartQuery.not('retail_price', 'is', null);
    }

    // Apply pagination
    amazonQuery = amazonQuery.range(offset, offset + limit - 1);
    flipkartQuery = flipkartQuery.range(offset, offset + limit - 1);

    // Execute both queries
    const [amazonResult, flipkartResult] = await Promise.all([
      amazonQuery,
      flipkartQuery
    ]);

    if (amazonResult.error) throw amazonResult.error;
    if (flipkartResult.error) throw flipkartResult.error;

    // Transform and combine results
    const amazonProducts = (amazonResult.data || []).map(transformAmazonProduct);
    const flipkartProducts = (flipkartResult.data || []).map(transformFlipkartProduct);
    
    let allProducts = [...amazonProducts, ...flipkartProducts];

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
        // For relevance sorting, prioritize exact name matches if there's a search term
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

    // Slice the combined and sorted results to match the requested limit
    allProducts = allProducts.slice(0, limit);

    const totalCount = (amazonResult.count || 0) + (flipkartResult.count || 0);

    console.log(`Found ${allProducts.length} products out of ${totalCount} total`);

    if (!allProducts || allProducts.length === 0) {
      // If no products found with current search, try to find similar products
      let similarProducts = [];
      
      if (searchTerm) {
        // Try to find products with similar categories or brands
        const [amazonSimilar, flipkartSimilar] = await Promise.all([
          supabase.from('amazon_products_2').select('*').limit(4),
          supabase.from('flipkart_1').select('*').limit(4)
        ]);
          
        const amazonSuggestions = (amazonSimilar.data || []).map(transformAmazonProduct);
        const flipkartSuggestions = (flipkartSimilar.data || []).map(transformFlipkartProduct);
        
        similarProducts = [...amazonSuggestions, ...flipkartSuggestions];
        console.log(`Found ${similarProducts.length} similar products as suggestions`);
      }
      
      return new Response(
        JSON.stringify({ 
          products: [], 
          total: 0, 
          suggestedProducts: similarProducts
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    console.log(`Returning ${allProducts.length} products with total count ${totalCount}`);

    return new Response(
      JSON.stringify({ products: allProducts, total: totalCount }),
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
