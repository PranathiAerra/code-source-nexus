
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, IndianRupee } from "lucide-react";

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  store: string;
  storeUrl: string;
  offer?: string;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [imageError, setImageError] = useState(false);
  
  const handleImageError = () => {
    setImageError(true);
  };

  const getValidImageUrl = (imageUrl: string): string => {
    try {
      if (imageUrl.startsWith('[')) {
        const urls = JSON.parse(imageUrl);
        return Array.isArray(urls) && urls.length > 0 ? urls[0] : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e';
      }
      
      if (imageUrl.includes('|')) {
        return imageUrl.split('|')[0];
      }
      
      return imageUrl;
    } catch (e) {
      return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e';
    }
  };

  const fallbackImage = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e';
  const imageUrl = imageError ? fallbackImage : getValidImageUrl(product.image);

  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const renderRating = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={16}
          className={`${
            i <= product.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
        />
      );
    }
    return stars;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <Card className="overflow-hidden h-full flex flex-col transition-shadow hover:shadow-lg">
      <div className="aspect-square relative overflow-hidden bg-gray-100">
        <img
          src={imageUrl}
          alt={product.name}
          className="object-contain h-full w-full p-4"
          onError={handleImageError}
          loading="lazy"
        />
        {product.offer && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            {product.offer}
          </div>
        )}
      </div>
      <div className="p-4 flex-grow flex flex-col">
        <div className="text-sm text-gray-500 mb-1">{product.store}</div>
        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
        
        <div className="flex items-center mb-3">{renderRating()}</div>
        
        <div className="flex items-baseline mb-4 mt-auto">
          <div className="font-bold text-lg flex items-center">
            <IndianRupee className="h-4 w-4 mr-1" />
            {formatPrice(product.price)}
          </div>
          {product.originalPrice && product.originalPrice > product.price && (
            <>
              <div className="text-gray-500 text-sm line-through ml-2 flex items-center">
                <IndianRupee className="h-3 w-3 mr-1" />
                {formatPrice(product.originalPrice)}
              </div>
              <div className="text-green-600 text-sm font-semibold ml-2">
                {discount}% off
              </div>
            </>
          )}
        </div>
        
        <Button
          asChild
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <a href={product.storeUrl} target="_blank" rel="noopener noreferrer">
            View Deal
          </a>
        </Button>
      </div>
    </Card>
  );
};

export default ProductCard;
