/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { StoreProvider } from './context/StoreContext';
import { AccountPage, TrackOrderPage } from './pages/AccountPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { B2BQuotePage } from './pages/B2BQuotePage';
import { CartPage } from './pages/CartPage';
import { CataloguePage } from './pages/CataloguePage';
import { CheckoutPage } from './pages/CheckoutPage';
import { HomePage } from './pages/HomePage';
import {
  AboutPage,
  ContactPage,
  DeliveryReturnsPage,
  FaqPage,
  PrivacyPolicyPage,
  TermsPage,
} from './pages/InfoPages';
import { ProductDetailPage } from './pages/ProductDetailPage';

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname, search]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}>
      <StoreProvider>
        <ScrollToTop />
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalogue" element={<CataloguePage />} />
            <Route path="/category/:slug" element={<CataloguePage />} />
            <Route path="/search" element={<CataloguePage />} />
            <Route path="/product/:slug" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/b2b-quote" element={<B2BQuotePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/track-order" element={<TrackOrderPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/delivery-returns" element={<DeliveryReturnsPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </StoreProvider>
    </BrowserRouter>
  );
}
