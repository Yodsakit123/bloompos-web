import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, LogOut, Package, Flower2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  const cartCount = getCartCount();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Flower2 className="h-8 w-8 text-pink-500" />
              <span className="text-2xl font-bold text-gray-800">FloraShop</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-pink-500 transition">
              Home
            </Link>
            <Link to="/products" className="text-gray-700 hover:text-pink-500 transition">
              Products
            </Link>
            
            <Link to="/cart" className="relative text-gray-700 hover:text-pink-500 transition">
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/orders" className="text-gray-700 hover:text-pink-500 transition flex items-center space-x-1">
                  <Package className="h-5 w-5" />
                  <span>Orders</span>
                </Link>
                
                <Link to="/profile" className="text-gray-700 hover:text-pink-500 transition flex items-center space-x-1">
                  <User className="h-5 w-5" />
                  <span>{user.firstName}</span>
                </Link>

                {['ADMIN', 'MANAGER'].includes(user.role) && (
                  <Link to="/admin" className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition">
                    Admin
                  </Link>
                )}
                
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-pink-500 transition"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-gray-700 hover:text-pink-500 transition">
                  Login
                </Link>
                <Link to="/register" className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 pt-2 pb-4 space-y-3">
            <Link to="/" className="block text-gray-700 hover:text-pink-500 py-2" onClick={() => setIsOpen(false)}>
              Home
            </Link>
            <Link to="/products" className="block text-gray-700 hover:text-pink-500 py-2" onClick={() => setIsOpen(false)}>
              Products
            </Link>
            <Link to="/cart" className="block text-gray-700 hover:text-pink-500 py-2 flex items-center justify-between" onClick={() => setIsOpen(false)}>
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="bg-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            
            {user ? (
              <>
                <Link to="/orders" className="block text-gray-700 hover:text-pink-500 py-2" onClick={() => setIsOpen(false)}>
                  My Orders
                </Link>
                <Link to="/profile" className="block text-gray-700 hover:text-pink-500 py-2" onClick={() => setIsOpen(false)}>
                  Profile
                </Link>
                {['ADMIN', 'MANAGER'].includes(user.role) && (
                  <Link to="/admin" className="block text-purple-500 hover:text-purple-600 py-2" onClick={() => setIsOpen(false)}>
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="block w-full text-left text-gray-700 hover:text-pink-500 py-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block text-gray-700 hover:text-pink-500 py-2" onClick={() => setIsOpen(false)}>
                  Login
                </Link>
                <Link to="/register" className="block bg-pink-500 text-white text-center px-4 py-2 rounded-lg hover:bg-pink-600" onClick={() => setIsOpen(false)}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
