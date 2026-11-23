import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { apiFetch } from '../lib/api';
import { UAE_CITIES_BY_EMIRATE, UAE_EMIRATES, type UAEEmirate } from '../lib/uae';
import type { CustomerUser } from '../types';
import { BrandLogo } from '../components/BrandLogo';

export function LoginPage() {
  const { setCustomerSession, showToast } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await apiFetch<{ token: string; user: CustomerUser }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setCustomerSession(res.token, res.user);
      showToast(`Welcome back, ${res.user.name}`);
      navigate('/account');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md w-full mx-auto px-md py-2xl">
      <div className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-xl shadow-sm flex flex-col gap-lg">
        <div className="flex items-start justify-between gap-md">
          <div>
            <span className="font-label text-label-sm text-light-primary uppercase tracking-wider">
              Customer Portal
            </span>
            <h1 className="font-headline text-headline-lg text-light-on-surface mt-xs">Sign In to HYGIENOVO</h1>
            <p className="font-body text-body-md text-light-on-surface-variant mt-xs">
              Manage saved UAE delivery addresses, view invoices, and track orders.
            </p>
          </div>
          <BrandLogo variant="icon" size="md" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          <label className="flex flex-col gap-xs">
            <span className="font-label text-label-md text-light-on-surface">Email Address *</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.ae"
              className="w-full rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md focus:border-light-primary focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-xs">
            <span className="font-label text-label-md text-light-on-surface">Password *</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md focus:border-light-primary focus:outline-none"
            />
          </label>

          {error && (
            <div className="p-sm rounded bg-light-error-container text-light-on-error-container font-body text-body-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded bg-light-primary text-light-on-primary font-label text-label-lg hover:bg-light-secondary disabled:opacity-60 transition-colors"
          >
            {submitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="border-t border-light-outline-variant pt-md flex flex-col gap-xs text-center font-body text-body-sm text-light-on-surface-variant">
          <p>
            New to HYGIENOVO?{' '}
            <Link to="/register" className="text-light-primary font-medium hover:underline">
              Create an Account
            </Link>
          </p>
          <p>
            Checking a guest order?{' '}
            <Link to="/track-order" className="text-light-primary font-medium hover:underline">
              Track Order by Number
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { setCustomerSession, showToast } = useStore();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [customerType, setCustomerType] = useState<'business' | 'individual'>('business');
  const [companyName, setCompanyName] = useState('');
  const [trn, setTrn] = useState('');
  const [emirate, setEmirate] = useState<UAEEmirate>('Dubai');
  const [city, setCity] = useState(UAE_CITIES_BY_EMIRATE.Dubai[0]);
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await apiFetch<{ token: string; user: CustomerUser }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          customerType,
          companyName,
          trn,
          emirate,
          city,
          address,
        }),
      });
      setCustomerSession(res.token, res.user);
      showToast('Account created');
      navigate('/account');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to register');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl w-full mx-auto px-md py-2xl">
      <div className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-xl shadow-sm flex flex-col gap-lg">
        <div className="flex items-start justify-between gap-md">
          <div>
            <span className="font-label text-label-sm text-light-primary uppercase tracking-wider">
              UAE Customer Registration
            </span>
            <h1 className="font-headline text-headline-lg text-light-on-surface mt-xs">
              Create Your HYGIENOVO Account
            </h1>
            <p className="font-body text-body-md text-light-on-surface-variant mt-xs">
              Register as a commercial buyer, facility team, or individual UAE resident.
            </p>
          </div>
          <BrandLogo variant="icon" size="md" />
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div className="md:col-span-2 flex gap-sm">
            {(['business', 'individual'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setCustomerType(type)}
                className={`flex-1 py-2.5 px-md rounded font-label text-label-md border transition-colors ${
                  customerType === type
                    ? 'border-light-primary bg-light-primary-container text-light-on-primary-container'
                    : 'border-light-outline-variant bg-light-surface text-light-on-surface'
                }`}
              >
                {type === 'business' ? 'Commercial / Business Buyer' : 'Residential / Individual Buyer'}
              </button>
            ))}
          </div>

          <label className="flex flex-col gap-xs">
            <span className="font-label text-label-md text-light-on-surface">Full Name *</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md focus:border-light-primary focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-xs">
            <span className="font-label text-label-md text-light-on-surface">Email Address *</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md focus:border-light-primary focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-xs">
            <span className="font-label text-label-md text-light-on-surface">UAE Phone *</span>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+971 50 123 4567"
              className="w-full rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md focus:border-light-primary focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-xs">
            <span className="font-label text-label-md text-light-on-surface">Password (min. 8 chars) *</span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md focus:border-light-primary focus:outline-none"
            />
          </label>

          {customerType === 'business' && (
            <>
              <label className="flex flex-col gap-xs">
                <span className="font-label text-label-md text-light-on-surface">Company Name</span>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md focus:border-light-primary focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-xs">
                <span className="font-label text-label-md text-light-on-surface">UAE TRN (Optional 15-Digit)</span>
                <input
                  type="text"
                  value={trn}
                  onChange={(e) => setTrn(e.target.value)}
                  placeholder="100XXXXXXXXXXXX"
                  className="w-full rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-mono text-mono-sm focus:border-light-primary focus:outline-none"
                />
              </label>
            </>
          )}

          <label className="flex flex-col gap-xs">
            <span className="font-label text-label-md text-light-on-surface">Emirate *</span>
            <select
              value={emirate}
              onChange={(e) => {
                const nextEm = e.target.value as UAEEmirate;
                setEmirate(nextEm);
                setCity(UAE_CITIES_BY_EMIRATE[nextEm]?.[0] || '');
              }}
              className="w-full rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md focus:border-light-primary focus:outline-none"
            >
              {UAE_EMIRATES.map((em) => (
                <option key={em} value={em}>{em}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-xs">
            <span className="font-label text-label-md text-light-on-surface">City / Area *</span>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md focus:border-light-primary focus:outline-none"
            >
              {(UAE_CITIES_BY_EMIRATE[emirate] || []).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className="md:col-span-2 flex flex-col gap-xs">
            <span className="font-label text-label-md text-light-on-surface">Delivery Address</span>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Building, Office / Villa, Street"
              className="w-full rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md focus:border-light-primary focus:outline-none"
            />
          </label>

          {error && (
            <div className="md:col-span-2 p-sm rounded bg-light-error-container text-light-on-error-container font-body text-body-sm">
              {error}
            </div>
          )}

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded bg-light-primary text-light-on-primary font-label text-label-lg hover:bg-light-secondary disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>

        <p className="text-center font-body text-body-sm text-light-on-surface-variant border-t border-light-outline-variant pt-md">
          Already have an account?{' '}
          <Link to="/login" className="text-light-primary font-medium hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
