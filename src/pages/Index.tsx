
import React, { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import ProductGrid from "@/components/ProductGrid";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setHasSearched(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className={`bg-gradient-to-br from-blue-600 to-blue-800 ${hasSearched ? 'py-8' : 'py-32'}`}>
          <div className="container-custom text-center">
            {!hasSearched && (
              <>
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
                  Find the Best Deals Across the Web
                </h1>
                <p className="text-blue-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
                  Compare prices and discover offers from all your favorite stores in one place
                </p>
              </>
            )}
            <SearchBar 
              onSearch={handleSearch} 
              className={hasSearched ? "" : "shadow-lg"}
            />
          </div>
        </section>

        {/* Product Grid Section */}
        {hasSearched ? (
          <section className="py-8">
            <div className="container-custom">
              <ProductGrid searchQuery={searchQuery} />
            </div>
          </section>
        ) : (
          <section className="py-16">
            <div className="container-custom">
              <h2 className="text-2xl font-bold text-center mb-8">Popular Products</h2>
              <ProductGrid />
            </div>
          </section>
        )}
        
        {/* Features Section */}
        {!hasSearched && (
          <section className="py-16 bg-gray-50">
            <div className="container-custom">
              <h2 className="text-2xl font-bold text-center mb-12">Why Choose Nexus?</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                  <div className="rounded-full bg-blue-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M16 12l-4 4-4-4"></path>
                      <path d="M12 8v7"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Save Time</h3>
                  <p className="text-gray-600">
                    Search once and compare prices across all major e-commerce sites instantly.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                  <div className="rounded-full bg-blue-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Find Best Deals</h3>
                  <p className="text-gray-600">
                    Discover hidden discounts, promotions, and best offers available online.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                  <div className="rounded-full bg-blue-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Shop Smarter</h3>
                  <p className="text-gray-600">
                    Compare prices, reviews, and shipping options to make informed decisions.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
