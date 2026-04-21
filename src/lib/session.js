// TEMP: Hardcoded session stub for v0.4.1 build.
// Replace body of getCurrentSession() with real Supabase Auth lookup when login ships.
//
// Role switching for testing: append ?role=provider or ?role=customer to URL.
// Default = customer (Bank/Fern).
//
// customer_id / provider_id must match real rows when those tables enforce FK.
// Provider uuid is placeholder — Gift's real uuid TBD when provider table exists.

const STUB_CUSTOMER = {
  role: 'customer',
  customer_id: 'e541b17e-7a83-4fa0-8118-b707bd5ada35',
  display_name: 'วัยรุ่นสกรีน',
};

const STUB_PROVIDER = {
  role: 'provider',
  provider_id: '00000000-0000-0000-0000-000000000001', // placeholder, swap when real
  display_name: 'Gift (Knitspeed)',
};

const getRoleFromURL = () => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('role');
};

export const getCurrentSession = () => {
  const role = getRoleFromURL();
  if (role === 'provider') return STUB_PROVIDER;
  return STUB_CUSTOMER;
};

export const isProvider = () => getCurrentSession().role === 'provider';
export const isCustomer = () => getCurrentSession().role === 'customer';
