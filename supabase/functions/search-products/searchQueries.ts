
import { SearchParams, SearchResult } from "./types.ts";
import { transformProduct } from "./productTransformer.ts";

const productSources = [
  { tableName: 'amazon_products_1', transform: transformProduct.amazon },
  { tableName: 'amazon_products_2', transform: transformProduct.amazon },
  { tableName: 'flipkart_1', transform: transformProduct.flipkart },
  { tableName: 'flipkart_2', transform: transformProduct.flipkart },
  { tableName: 'fashion_1', transform: transformProduct.fashion }
];

export async function handleSearchQueries(
  supabase: any,
  params: SearchParams
): Promise<SearchResult> {
  console.log("Building queries for search params:", JSON.stringify(params, null, 2));
  const queries = buildQueries(supabase, params);
  console.log(`Executing ${queries.length} queries across product sources`);
  const results = await Promise.all(queries);
  
  let allProducts: any[] = [];
  let totalCount = 0;

  console.log("Processing query results...");
  results.forEach((result, index) => {
    if (result.error) {
      console.error(`Error in query for ${productSources[index].tableName}:`, result.error);
      throw result.error;
    }
    
    const sourceProducts = result.data || [];
    console.log(`Found ${sourceProducts.length} products in ${productSources[index].tableName}`);
    
    const transformedProducts = sourceProducts.map((product: any) => {
      try {
        return productSources[index].transform(product);
      } catch (error) {
        console.error(`Error transforming product from ${productSources[index].tableName}:`, error);
        return null;
      }
    }).filter(Boolean);
    
    allProducts = [...allProducts, ...transformedProducts];
    totalCount += result.count || 0;
  });

  console.log(`Combined ${allProducts.length} products from all sources`);

  // Apply price filters
  if (params.minPrice !== null && params.minPrice !== undefined) {
    allProducts = allProducts.filter(p => p.price >= params.minPrice);
  }
  if (params.maxPrice !== null && params.maxPrice !== undefined) {
    allProducts = allProducts.filter(p => p.price <= params.maxPrice);
  }

  // Sort combined results with reduced relevance boost (10%)
  sortProducts(allProducts, params);

  // Slice to match requested limit
  allProducts = allProducts.slice(0, params.limit);
  console.log(`Returning ${allProducts.length} products after filtering and sorting`);

  return { products: allProducts, totalCount };
}

function buildQueries(supabase: any, params: SearchParams) {
  console.log(`Building queries for: ${params.searchTerm || 'empty search'}`);
  
  if (!params.searchTerm || params.searchTerm.trim() === '') {
    return productSources.map(source => {
      console.log(`Creating query for ${source.tableName} without search term`);
      return supabase
        .from(source.tableName)
        .select('*', { count: 'exact' })
        .limit(params.limit / productSources.length);
    });
  }

  return productSources.map(source => {
    console.log(`Creating search query for ${source.tableName} with term: ${params.searchTerm}`);
    const query = supabase
      .from(source.tableName)
      .select('*', { count: 'exact' });

    if (source.tableName.startsWith('amazon')) {
      query.or(`Product Title.ilike.%${params.searchTerm}%,Brand.ilike.%${params.searchTerm}%,Category.ilike.%${params.searchTerm}%`);
    } else if (source.tableName.startsWith('flipkart')) {
      query.or(`product_name.ilike.%${params.searchTerm}%,brand.ilike.%${params.searchTerm}%`);
    } else if (source.tableName === 'fashion_1') {
      query.or(`name.ilike.%${params.searchTerm}%,brand.ilike.%${params.searchTerm}%`);
    }

    return query.range(params.offset, params.offset + params.limit - 1);
  });
}

function sortProducts(products: any[], params: SearchParams) {
  console.log(`Sorting products by: ${params.sortBy || 'relevance'}`);
  
  switch (params.sortBy) {
    case 'price-low':
      products.sort((a, b) => a.price - b.price);
      break;
    case 'price-high':
      products.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      products.sort((a, b) => b.rating - a.rating);
      break;
    default:
      if (params.searchTerm && params.searchTerm.trim() !== '') {
        products.sort((a, b) => {
          const searchTerm = params.searchTerm.toLowerCase();
          const aMatch = a.name.toLowerCase().includes(searchTerm);
          const bMatch = b.name.toLowerCase().includes(searchTerm);
          
          // Reduce relevance boost from 100% to 10%
          if (aMatch && !bMatch) return -0.1;
          if (!aMatch && bMatch) return 0.1;
          return 0;
        });
      }
  }
}
