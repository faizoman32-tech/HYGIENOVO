import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { buildWhatsAppLink } from '../lib/uae';
import { BrandLogo } from './BrandLogo';

export function Layout({ children }: { children: React.ReactNode }) {
  const { cart, wishlist, customer, storeConfig, toastMessage } = useStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const totalCartItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const whatsappUrl = buildWhatsAppLink(
    storeConfig.whatsappNumber,
    'Hello HYGIENOVO Procurement Team, I would like to enquire about commercial cleaning & hygiene supplies in the UAE.'
  );

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    setSearchOpen(false);
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/catalogue');
  }

  return (
    <div className="min-h-screen flex flex-col bg-light-background text-light-on-background">
      {/* Top Announcement Bar */}
      <div className="bg-deep-forest text-light-inverse-on-surface py-2 px-md text-center">
        <p className="font-body text-body-sm">
          Dubai &amp; UAE Commercial Supply • All prices in AED (Free UAE delivery over AED{' '}
          {storeConfig.freeDeliveryThreshold.toFixed(0)})
        </p>
      </div>

      {/* Sticky Navigation Bar */}
      <header className="sticky top-0 z-40 bg-light-surface-container-lowest border-b border-light-outline-variant shadow-sm">
        <div className="max-w-[1280px] mx-auto px-md lg:px-xl h-20 flex items-center justify-between gap-md">
          {/* Left: Brand Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-sm shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded text-light-on-surface hover:bg-light-surface-container"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <Link to="/" aria-label="HYGIENOVO Home" className="flex items-center shrink-0">
              <BrandLogo variant="horizontal" surface="light" size="md" />
            </Link>
          </div>

          {/* Center: Primary Navigation + Mega Menu */}
          <nav aria-label="Primary" className="hidden lg:flex items-center gap-3.5 xl:gap-5">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `font-label text-label-md whitespace-nowrap transition-colors ${
                  isActive ? 'text-light-primary font-semibold' : 'text-light-on-surface hover:text-light-primary'
                }`
              }
            >
              Home
            </NavLink>

            <div className="relative group">
              <NavLink
                to="/catalogue"
                className={({ isActive }) =>
                  `inline-flex items-center gap-1 font-label text-label-md whitespace-nowrap py-2 transition-colors ${
                    isActive ? 'text-light-primary font-semibold' : 'text-light-on-surface hover:text-light-primary'
                  }`
                }
              >
                <span>Shop</span>
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                  expand_more
                </span>
              </NavLink>
              <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 top-full pt-2 w-[680px] z-50">
                <div className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant shadow-lg p-lg grid grid-cols-3 gap-lg">
                  <div>
                    <p className="font-label text-label-sm text-light-primary uppercase tracking-wider mb-sm">
                      Core Categories
                    </p>
                    <ul className="flex flex-col gap-xs">
                      <li>
                        <Link
                          to="/category/chemicals"
                          className="font-body text-body-sm text-light-on-surface hover:text-light-primary"
                        >
                          Cleaning Chemicals
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/category/equipment"
                          className="font-body text-body-sm text-light-on-surface hover:text-light-primary"
                        >
                          Cleaning Equipment
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/category/washroom"
                          className="font-body text-body-sm text-light-on-surface hover:text-light-primary"
                        >
                          Washroom Hygiene
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-label text-label-sm text-light-primary uppercase tracking-wider mb-sm">
                      Consumables &amp; PPE
                    </p>
                    <ul className="flex flex-col gap-xs">
                      <li>
                        <Link
                          to="/category/paper"
                          className="font-body text-body-sm text-light-on-surface hover:text-light-primary"
                        >
                          Paper Products
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/category/janitorial"
                          className="font-body text-body-sm text-light-on-surface hover:text-light-primary"
                        >
                          Janitorial Supplies
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/category/safety"
                          className="font-body text-body-sm text-light-on-surface hover:text-light-primary"
                        >
                          Safety &amp; Protection
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-light-primary-container rounded-md p-md flex flex-col justify-between">
                    <div>
                      <p className="font-title text-title-sm text-light-on-primary-container mb-xs">
                        B2B Bulk Supply
                      </p>
                      <p className="font-body text-body-sm text-light-on-primary-container">
                        Custom quotes for multi-site UAE contracts.
                      </p>
                    </div>
                    <Link
                      to="/b2b-quote"
                      className="mt-sm inline-flex items-center gap-1 font-label text-label-sm text-light-secondary font-semibold hover:underline"
                    >
                      <span>Request Quote</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <NavLink
              to="/category/chemicals"
              className={({ isActive }) =>
                `font-label text-label-md whitespace-nowrap transition-colors ${
                  isActive ? 'text-light-primary font-semibold' : 'text-light-on-surface hover:text-light-primary'
                }`
              }
            >
              Cleaning Chemicals
            </NavLink>
            <NavLink
              to="/category/equipment"
              className={({ isActive }) =>
                `font-label text-label-md whitespace-nowrap transition-colors ${
                  isActive ? 'text-light-primary font-semibold' : 'text-light-on-surface hover:text-light-primary'
                }`
              }
            >
              Cleaning Equipment
            </NavLink>
            <NavLink
              to="/category/washroom"
              className={({ isActive }) =>
                `font-label text-label-md whitespace-nowrap transition-colors ${
                  isActive ? 'text-light-primary font-semibold' : 'text-light-on-surface hover:text-light-primary'
                }`
              }
            >
              Washroom Hygiene
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `font-label text-label-md whitespace-nowrap transition-colors ${
                  isActive ? 'text-light-primary font-semibold' : 'text-light-on-surface hover:text-light-primary'
                }`
              }
            >
              About Us
            </NavLink>
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `font-label text-label-md whitespace-nowrap transition-colors ${
                  isActive ? 'text-light-primary font-semibold' : 'text-light-on-surface hover:text-light-primary'
                }`
              }
            >
              Contact
            </NavLink>
          </nav>

          {/* Right: Utility Icons + Quote CTA */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search products"
              className="inline-flex items-center justify-center w-9 h-9 rounded-full text-light-on-surface hover:bg-light-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
            </button>
            <Link
              to={customer ? '/account' : '/login'}
              aria-label={customer ? 'My account' : 'Sign in'}
              className="relative hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-full text-light-on-surface hover:bg-light-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">person</span>
              {customer && (
                <span className="sr-only">Signed in as {customer.name}</span>
              )}
            </Link>
            <Link
              to="/account?tab=wishlist"
              aria-label={`Saved wishlist (${wishlist.length})`}
              className="relative hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-full text-light-on-surface hover:bg-light-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">favorite</span>
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-light-secondary text-light-on-secondary font-label text-label-sm tabular-nums">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <Link
              to="/cart"
              aria-label={`Shopping cart with ${totalCartItems} items`}
              className="relative inline-flex items-center justify-center w-9 h-9 rounded-full text-light-on-surface hover:bg-light-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
              <span
                id="header-cart-count"
                className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-light-primary text-light-on-primary font-label text-label-sm tabular-nums"
              >
                {totalCartItems}
              </span>
            </Link>
            <Link
              to="/b2b-quote"
              className="hidden sm:inline-flex items-center justify-center px-md py-2.5 rounded bg-light-primary text-light-on-primary font-label text-label-md hover:bg-light-secondary transition-colors whitespace-nowrap"
            >
              Request a Quote
            </Link>
          </div>
        </div>

        {/* Expandable Global Search Bar */}
        {searchOpen && (
          <div className="border-t border-light-outline-variant bg-light-surface-container-low px-md lg:px-xl py-sm">
            <form onSubmit={handleSearchSubmit} className="max-w-[1280px] mx-auto flex items-center gap-sm">
              <span className="material-symbols-outlined text-light-on-surface-variant text-[20px]">
                search
              </span>
              <input
                type="search"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 5L chemicals, microfiber cloths, mop sets, or SKU..."
                className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none font-body text-body-md text-light-on-surface placeholder:text-light-outline"
              />
              <button
                type="submit"
                className="px-md py-1.5 rounded bg-light-primary text-light-on-primary font-label text-label-md"
              >
                Search
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-charcoal/40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-80 max-w-full min-h-screen bg-light-surface-container-lowest p-lg flex flex-col gap-lg shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-sm">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} aria-label="HYGIENOVO Home">
                <BrandLogo variant="horizontal" surface="light" size="sm" />
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-light-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <nav className="flex flex-col gap-sm">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="py-2 font-label text-label-lg text-light-primary">
                Home
              </Link>
              <Link to="/catalogue" onClick={() => setMobileMenuOpen(false)} className="py-2 font-label text-label-lg text-light-on-surface">
                Shop All Products
              </Link>
              <Link to="/category/chemicals" onClick={() => setMobileMenuOpen(false)} className="py-2 font-label text-label-lg text-light-on-surface">
                Cleaning Chemicals
              </Link>
              <Link to="/category/equipment" onClick={() => setMobileMenuOpen(false)} className="py-2 font-label text-label-lg text-light-on-surface">
                Cleaning Equipment
              </Link>
              <Link to="/category/washroom" onClick={() => setMobileMenuOpen(false)} className="py-2 font-label text-label-lg text-light-on-surface">
                Washroom Hygiene
              </Link>
              <Link to="/category/paper" onClick={() => setMobileMenuOpen(false)} className="py-2 font-label text-label-lg text-light-on-surface">
                Paper Products
              </Link>
              <Link to="/b2b-quote" onClick={() => setMobileMenuOpen(false)} className="py-2 font-label text-label-lg text-light-on-surface">
                Request a Quote
              </Link>
              <Link to="/cart" onClick={() => setMobileMenuOpen(false)} className="py-2 font-label text-label-lg text-light-on-surface">
                Cart &amp; Checkout ({totalCartItems})
              </Link>
              <Link to={customer ? '/account' : '/login'} onClick={() => setMobileMenuOpen(false)} className="py-2 font-label text-label-lg text-light-on-surface">
                {customer ? 'My Account & Orders' : 'Customer Login / Register'}
              </Link>
              <Link to="/track-order" onClick={() => setMobileMenuOpen(false)} className="py-2 font-label text-label-lg text-light-on-surface">
                Track Order
              </Link>
              <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="py-2 font-label text-label-lg text-light-on-surface">
                About Us
              </Link>
              <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="py-2 font-label text-label-lg text-light-on-surface">
                Contact Us
              </Link>
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="py-2 font-label text-label-lg text-light-on-surface-variant">
                Admin Dashboard
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* Page Body */}
      <main className="flex-1 flex flex-col">{children}</main>

      {/* Footer */}
      <footer id="footer" className="bg-deep-forest text-light-inverse-on-surface border-t border-pure-white/10">
        <div className="max-w-[1280px] mx-auto px-md lg:px-xl py-2xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-xl">
          <div className="flex flex-col gap-md">
            <Link to="/" aria-label="HYGIENOVO Home" className="w-fit">
              <BrandLogo variant="horizontal" surface="dark" size="sm" />
            </Link>
            <p className="font-body text-body-sm text-fresh-mint">
              A Cleaner Standard for Every Space. UAE-based online supplier of commercial cleaning chemicals, washroom hygiene, and janitorial equipment.
            </p>
            <p className="font-body text-body-sm text-fresh-mint/80">Dubai, United Arab Emirates</p>
          </div>

          <div>
            <h3 className="font-title text-title-sm text-pure-white mb-md">Product Categories</h3>
            <ul className="flex flex-col gap-xs font-body text-body-sm text-fresh-mint">
              <li><Link to="/category/chemicals" className="hover:text-pure-white">Cleaning Chemicals</Link></li>
              <li><Link to="/category/equipment" className="hover:text-pure-white">Cleaning Equipment</Link></li>
              <li><Link to="/category/washroom" className="hover:text-pure-white">Washroom Hygiene</Link></li>
              <li><Link to="/category/paper" className="hover:text-pure-white">Paper Products</Link></li>
              <li><Link to="/category/janitorial" className="hover:text-pure-white">Janitorial Supplies</Link></li>
              <li><Link to="/category/safety" className="hover:text-pure-white">Safety &amp; Protection</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-title text-title-sm text-pure-white mb-md">Customer Support</h3>
            <ul className="flex flex-col gap-xs font-body text-body-sm text-fresh-mint">
              <li><Link to="/about" className="hover:text-pure-white">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-pure-white">Contact Us</Link></li>
              <li><Link to="/faq" className="hover:text-pure-white">FAQ</Link></li>
              <li><Link to="/track-order" className="hover:text-pure-white">Track Your Order</Link></li>
              <li><Link to="/delivery-returns" className="hover:text-pure-white">Delivery &amp; Returns Policy</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-pure-white">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-pure-white">Terms &amp; Conditions</Link></li>
            </ul>
          </div>

          <div className="flex flex-col gap-md">
            <h3 className="font-title text-title-sm text-pure-white">Direct B2B Desk</h3>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-md py-2.5 rounded bg-light-primary text-pure-white font-label text-label-md hover:bg-pure-white hover:text-deep-forest transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                chat
              </span>
              <span>WhatsApp Procurement</span>
            </a>
            <div className="flex flex-col gap-xs font-body text-body-sm text-fresh-mint">
              <Link to="/b2b-quote" className="hover:text-pure-white">Request a B2B Quote</Link>
              <Link to={customer ? '/account' : '/login'} className="hover:text-pure-white">
                {customer ? 'My Account & Order History' : 'Customer Sign In / Register'}
              </Link>
              <Link to="/admin" className="hover:text-pure-white">Admin Portal</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-pure-white/10 py-md px-md lg:px-xl text-center">
          <p className="font-body text-body-sm text-fresh-mint/80">
            © 2026 HYGIENOVO Commercial Supply • Dubai, United Arab Emirates • AED Pricing &amp; 5% UAE VAT
          </p>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 bg-deep-forest text-pure-white px-lg py-3 rounded-md shadow-lg font-label text-label-md"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
