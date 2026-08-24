// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Categories from './pages/Categories';
import Products from './pages/Products';
import Offers from './pages/Offers';
import About from './pages/About';
import Contact from './pages/Contact';
import './App.css';
import Trested from './components/trested';
import ProductSection from './components/ProductSection';
import Marquee from './components/Marquee';
import FullWidthBannerCarousel from './components/Banner';
import ReviewSection from './components/ReviewSection';
import OurBrands from './components/OurBrands';
import Fooder from './components/Footer';
import AdminLogin from './pages/Admin/Adminlogin';
import { CartProvider } from './pages/ProductCart';
import AdminLayout from './pages/Admin/AdminLayout';
import UserRegister from './pages/UserRegister';
import { AuthProvider, useAuth } from './context/AuthContext';

// Protected Route Component
const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/admin-login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Public Routes with Header and Footer */}
            <Route path="/*" element={
              <div className="min-h-screen bg-gray-50">
                <Header />
                <Routes>
                  <Route path="/" element={
                    <>
                      <Home />
                      <Trested />
                      <Marquee />
                      <ProductSection />
                      <FullWidthBannerCarousel />
                      <ReviewSection />
                      <OurBrands />
                    </>
                  } />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/offers" element={<Offers />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/register" element={<UserRegister />} />
                </Routes>
                <Fooder />
              </div>
            } />

            {/* Admin Login Route - No Header/Footer */}
            <Route path="/admin-login" element={<AdminLogin />} />

            {/* Protected Admin Routes */}
            <Route path="/admin/*" element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            } />
            
            <Route path="/admin/dashboard" element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            } />
            <Route path="/admin/products" element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            } />
            <Route path="/admin/orders" element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            } />
            <Route path="/admin/categories" element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            } />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;