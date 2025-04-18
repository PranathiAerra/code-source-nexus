
const fallbackImage = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e';

export const transformProduct = {
  amazon: (product: any) => ({
    id: product['Unique ID'] || String(Math.random()),
    name: product['Product Title'] || 'Unknown Product',
    price: typeof product.Price === 'number' ? product.Price : parseFloat(product.Price?.replace(/[^0-9.]/g, '')) || 0,
    originalPrice: typeof product.Mrp === 'number' ? product.Mrp : parseFloat(product.Mrp?.replace(/[^0-9.]/g, '')) || 0,
    image: product['Image Urls'] || fallbackImage,
    rating: Math.floor(Math.random() * 2) + 3.5,
    store: product['Site Name'] || 'Amazon In',
    storeUrl: 'https://www.amazon.in',
    offer: product.Offers || null
  }),

  flipkart: (product: any) => ({
    id: product.uniq_id || String(Math.random()),
    name: product.product_name || 'Unknown Product',
    price: parseFloat(product.discounted_price?.replace(/[^0-9.]/g, '')) || 0,
    originalPrice: parseFloat(product.retail_price?.replace(/[^0-9.]/g, '')) || 0,
    image: Array.isArray(product.image) ? product.image[0] : 
           typeof product.image === 'string' ? product.image : 
           fallbackImage,
    rating: parseFloat(product.product_rating || '0') || Math.floor(Math.random() * 2) + 3.5,
    store: 'Flipkart',
    storeUrl: 'https://www.flipkart.com',
    offer: product.discounted_price && product.retail_price ? 
      `${Math.round(((parseFloat(product.retail_price.replace(/[^0-9.]/g, '')) - 
      parseFloat(product.discounted_price.replace(/[^0-9.]/g, ''))) / 
      parseFloat(product.retail_price.replace(/[^0-9.]/g, ''))) * 100)}%` : null
  }),

  fashion: (product: any) => ({
    id: String(product.p_id || Math.random()),
    name: product.name || 'Unknown Product',
    price: product.price || 0,
    originalPrice: product.price || 0,
    image: product.img || fallbackImage,
    rating: parseFloat(product.avg_rating || '0') || Math.floor(Math.random() * 2) + 3.5,
    store: product.brand || 'Fashion Store',
    storeUrl: 'https://www.myntra.com',
    offer: null
  })
};
