// TEMP: Hardcoded session stub for v0.4 buyer-side build.
// Replace body of getCurrentSession() with real Supabase Auth lookup when login ships.
//
// To test Gift's view later: change role to 'provider'.
// customer_id must match a real row in customers table (Bank/Fern = วัยรุ่นสกรีน).

const STUB_SESSION = {
  role: 'customer',
  customer_id: e541b17e-7a83-4fa0-8118-b707bd5ada35,           // TODO: paste วัยรุ่นสกรีน's customers.id here before testing submit
  display_name: 'วัยรุ่นสกรีน',
};

export const getCurrentSession = () => STUB_SESSION;

export const isProvider = () => getCurrentSession().role === 'provider';
export const isCustomer = () => getCurrentSession().role === 'customer';
