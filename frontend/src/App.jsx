import React, { useState, useEffect } from 'react';
import { 
  Users, 
  User as UserIcon, 
  Plus, 
  ArrowLeft, 
  Settings, 
  LogOut, 
  Check, 
  DollarSign, 
  Info, 
  ChevronRight,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Layers
} from 'lucide-react';

const API_BASE = `http://${window.location.hostname}:5000/api`;

export default function App() {
  // Navigation and Session State
  const [user, setUser] = useState(null); // Current user
  const [page, setPage] = useState('landing'); // 'landing', 'login', 'signup', 'dashboard', 'group-details'
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [activeTab, setActiveTab] = useState('groups'); // 'groups', 'friends', 'activity', 'account'

  // Application Data State
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [dashboardBalances, setDashboardBalances] = useState({ totalOwe: 0, totalOwed: 0, netBalance: 0, text: '' });
  const [selectedGroupDetails, setSelectedGroupDetails] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);

  // Modals
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSettleUp, setShowSettleUp] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [termsBackPage, setTermsBackPage] = useState('landing');

  // Form Inputs
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Add Expense Form Inputs
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expensePayer, setExpensePayer] = useState('');
  const [expenseSplits, setExpenseSplits] = useState([]); // Array of userIds selected

  // Settle Up Form Inputs
  const [settleFrom, setSettleFrom] = useState('');
  const [settleTo, setSettleTo] = useState('');
  const [settleAmount, setSettleAmount] = useState('');

  // Add Group Form Inputs
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupMembers, setGroupMembers] = useState([]); // Array of userIds

  // Fetch initial users list
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch groups and dashboard balances when logged-in user changes
  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      // 1. Fetch groups with statuses relative to user
      const resGroups = await fetch(`${API_BASE}/groups?userId=${user._id}`);
      if (resGroups.ok) {
        const data = await resGroups.json();
        setGroups(data);
      }

      // 2. Fetch dashboard summary
      const resBal = await fetch(`${API_BASE}/dashboard/balances?userId=${user._id}`);
      if (resBal.ok) {
        const data = await resBal.json();
        setDashboardBalances(data);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Fetch specific group details
  const fetchGroupDetails = async (groupId) => {
    if (!user || !groupId) return;
    try {
      const resDetails = await fetch(`${API_BASE}/groups/${groupId}?userId=${user._id}`);
      if (resDetails.ok) {
        const data = await resDetails.json();
        setSelectedGroupDetails(data);
      }

      const resExpenses = await fetch(`${API_BASE}/expenses?groupId=${groupId}`);
      if (resExpenses.ok) {
        const data = await resExpenses.json();
        setExpenses(data);
      }

      const resSettlements = await fetch(`${API_BASE}/settlements?groupId=${groupId}`);
      if (resSettlements.ok) {
        const data = await resSettlements.json();
        setSettlements(data);
      }
    } catch (err) {
      console.error("Error fetching group details:", err);
    }
  };

  useEffect(() => {
    if (selectedGroupId) {
      fetchGroupDetails(selectedGroupId);
    }
  }, [selectedGroupId]);

  // Handle Authentication Actions
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!authEmail || !authPassword) {
      setAuthError("Email and password are required");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        setPage('dashboard');
        setAuthPassword('');
        setAuthEmail('');
      } else {
        setAuthError(data.error || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setAuthError("Error connecting to server");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!signupName || !signupEmail || !signupPassword) {
      setAuthError("Name, email, and password are required");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: signupName, email: signupEmail, password: signupPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        setPage('dashboard');
        setSignupName('');
        setSignupEmail('');
        setSignupPassword('');
        fetchUsers();
      } else {
        setAuthError(data.error || "Signup failed");
      }
    } catch (err) {
      console.error(err);
      setAuthError("Error connecting to server");
    }
  };

  const handleGoogleCredentialResponse = async (response) => {
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        setPage('dashboard');
        fetchUsers();
      } else {
        alert(data.error || "Google authentication failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to server for Google authentication");
    }
  };

  // Trigger Google OAuth 2.0 redirect flow (Implicit Grant)
  const handleGoogleLoginClick = () => {
    const clientId = "204315747168-hjteb1ojmu55qmu7a364nppf4c76tuo9.apps.googleusercontent.com";
    const redirectUri = window.location.origin + '/';
    const responseType = "id_token";
    const scope = "openid email profile";
    const state = "google_login";
    const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36);

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=${encodeURIComponent(responseType)}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&state=${encodeURIComponent(state)}` +
      `&nonce=${encodeURIComponent(nonce)}`;

    window.location.href = authUrl;
  };

  // Parse Google OAuth redirect hash fragment on app load or hash change
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const idToken = params.get('id_token');
        const state = params.get('state');

        if (state === 'google_login' && idToken) {
          // Clear hash immediately for a clean URL address bar
          window.history.replaceState(null, null, window.location.origin + window.location.pathname);
          // Authenticate user with backend
          handleGoogleCredentialResponse({ credential: idToken });
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const selectMockUser = (mockUser) => {
    setUser(mockUser);
    setShowAccountSelector(false);
    setPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setPage('landing');
  };

  // Create Group Action
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName) return;

    // Make sure current user is added to group members
    const finalMembers = Array.from(new Set([...groupMembers, user._id]));

    try {
      const res = await fetch(`${API_BASE}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName,
          description: groupDesc,
          members: finalMembers
        })
      });
      if (res.ok) {
        setShowAddGroup(false);
        setGroupName('');
        setGroupDesc('');
        setGroupMembers([]);
        await fetchDashboardData();
      } else {
        alert("Failed to create group");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Expense Action
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseDesc || !expenseAmount || !expensePayer || expenseSplits.length === 0) {
      alert("Please fill all fields and select split participants");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: expenseDesc,
          amount: parseFloat(expenseAmount),
          paidBy: expensePayer,
          group: selectedGroupId,
          splitUserIds: expenseSplits
        })
      });
      if (res.ok) {
        setShowAddExpense(false);
        setExpenseDesc('');
        setExpenseAmount('');
        // Refresh details
        await fetchGroupDetails(selectedGroupId);
        await fetchDashboardData();
      } else {
        alert("Failed to add expense");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Settle Up Action
  const handleSettleUp = async (e) => {
    e.preventDefault();
    if (!settleFrom || !settleTo || !settleAmount) {
      alert("Please fill all fields");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/settlements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group: selectedGroupId,
          fromUser: settleFrom,
          toUser: settleTo,
          amount: parseFloat(settleAmount)
        })
      });
      if (res.ok) {
        setShowSettleUp(false);
        setSettleFrom('');
        setSettleTo('');
        setSettleAmount('');
        // Refresh details
        await fetchGroupDetails(selectedGroupId);
        await fetchDashboardData();
      } else {
        alert("Failed to record settlement");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to get group icon
  const getGroupIcon = (name) => {
    if (!name || typeof name !== 'string') {
      return (
        <div style={{ backgroundColor: '#fff0eb', color: '#ff652f', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '24px' }}>🏠</span>
        </div>
      );
    }
    const lname = name.toLowerCase();
    if (lname.includes('beach') || lname.includes('trip') || lname.includes('travel')) {
      return (
        <div style={{ backgroundColor: '#e2f4f1', color: '#1cc29f', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '24px' }}>✈️</span>
        </div>
      );
    }
    return (
      <div style={{ backgroundColor: '#fff0eb', color: '#ff652f', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '24px' }}>🏠</span>
      </div>
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', width: '100%', overflow: 'hidden' }}>
      
      {/* 1. LANDING PAGE */}
      {page === 'landing' && (
        <div className="theme-dark animate-fade-in" style={{ flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: 'auto 0', gap: '30px' }}>
            {/* Splitwise Custom 3D Logo */}
            <div style={{ position: 'relative', width: '120px', height: '120px' }}>
              <svg viewBox="0 0 117 117" style={{ width: '100%', height: '100%' }}>
                <g fill="none" fillRule="evenodd">
                  <path fill="#1CC29F" d="M48.746 66.556l9.133-5.272L19.872 39.34v21.67c2.848-1.535 6.437-2.334 10.546-2.334 8.946 0 14.608 3.8 18.328 7.88M31.977 96.803c3.807 0 6.678-1.123 6.678-3.994 0-2.932-3.682-4.056-8.238-5.179-3.39-.869-7.283-1.74-10.545-3.384v5.568c2.746 4.43 7.301 6.989 12.105 6.989" />
                  <path fill="#52595F" d="M95.887 83.227V39.34L57.879 61.284z" />
                  <path fill="#ACE4D6" d="M95.886 39.34L57.88 17.397 19.872 39.34l38.007 21.943z" />
                  <path fill="#373B3F" d="M57.879 61.283l-9.133 5.273-9.79 5.653c-2.501-1.99-5.683-3.424-8.6-3.424-3.558 0-5.368 1.185-5.368 3.37 0 2.527 2.476 3.732 5.906 4.708.72.205 1.48.4 2.27.596 7.55 1.81 17.66 4.118 17.66 14.476 0 2.175-.459 4.342-1.462 6.32h46.524V83.227L57.879 61.283z" />
                  <path fill="#FFF" d="M33.163 77.459c-.79-.195-1.549-.39-2.269-.596-3.43-.976-5.906-2.18-5.906-4.708 0-2.185 1.81-3.37 5.367-3.37 2.918 0 6.1 1.435 8.601 3.424l9.79-5.653c-3.72-4.08-9.382-7.88-18.329-7.88-4.109 0-7.697.799-10.545 2.334v23.237c3.262 1.643 7.154 2.514 10.545 3.383 4.555 1.123 8.238 2.246 8.238 5.18 0 2.87-2.871 3.993-6.678 3.993-4.804 0-9.36-2.558-12.105-6.989v8.44h29.49c1.003-1.977 1.461-4.144 1.461-6.319 0-10.358-10.109-12.667-17.66-14.476" />
                </g>
              </svg>
            </div>
            
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '34px', color: 'white', letterSpacing: '-0.5px', marginTop: '-5px' }}>
              Splitwise
            </h1>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', marginBottom: '65px' }}>
            <button className="btn-primary" onClick={() => { setAuthError(''); setPage('signup'); }}>
              Sign up
            </button>
            
             <button 
              className="btn-secondary" 
              style={{ color: 'white', borderColor: '#3c434a', background: 'transparent' }}
              onClick={() => { setAuthError(''); setPage('login'); }}
            >
              Log in
            </button>

            <button 
              className="btn-secondary" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                position: 'relative', 
                color: 'white', 
                borderColor: '#3c434a', 
                background: 'transparent',
                marginTop: '4px',
                width: '100%',
                padding: '14px 24px'
              }}
              onClick={handleGoogleLoginClick}
            >
              <div style={{ position: 'absolute', left: '16px', display: 'flex', alignItems: 'center' }}>
                <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
              </div>
              Sign in with Google
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', fontSize: '11px', color: 'var(--dark-text-secondary)', fontFamily: 'var(--font-body)' }}>
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setTermsBackPage('landing'); setPage('terms'); }}>Terms</span>
            <span>|</span>
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setTermsBackPage('landing'); setPage('privacy'); }}>Privacy Policy</span>
            <span>|</span>
            <span style={{ cursor: 'pointer' }}>
              <a 
                href="mailto:jaish6553@gmail.com?subject=Contact%20Splitwise%20Support&body=Hi%20Jaish%2C%0A%0AThis%20is%20a%20demo%20message%20sent%20from%20the%20Splitwise%20Clone%20application.%0A%0ARegards%2C%0A[Demo%20User]" 
                style={{ color: 'inherit', textDecoration: 'underline' }}
              >
                Contact us
              </a>
            </span>
          </div>
        </div>
      )}

      {/* 2. LOG IN PAGE */}
      {page === 'login' && (
        <div className="theme-dark animate-slide-in" style={{ flex: 1, justifyContent: 'flex-start', padding: '24px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
            <button style={{ background: 'none', color: 'white' }} onClick={() => { setAuthError(''); setPage('landing'); }}>
              <ArrowLeft size={24} />
            </button>
            <h2 style={{ fontFamily: 'var(--font-display)', marginLeft: '16px', fontSize: '20px', fontWeight: 600 }}>Log in</h2>
          </div>

          {authError && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              animation: 'fadeIn 0.3s ease'
            }}>
              <Info size={16} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="input-group">
              <label className="input-label">Email address</label>
              <input 
                type="email" 
                className="input-field" 
                placeholder="Enter email"
                value={authEmail} 
                onChange={(e) => setAuthEmail(e.target.value)} 
                required 
              />
            </div>
            
            <div className="input-group">
              <label className="input-label">Password</label>
              <input 
                type="password" 
                className="input-field" 
                placeholder="Enter password"
                value={authPassword} 
                onChange={(e) => setAuthPassword(e.target.value)} 
              />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '20px' }}>
              Log in
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <span style={{ color: 'var(--primary-teal)', fontSize: '14px', cursor: 'pointer', fontWeight: 500 }}>
              Forgot your password?
            </span>
          </div>
        </div>
      )}

      {/* 3. SIGN UP PAGE */}
      {page === 'signup' && (
        <div className="theme-dark animate-slide-in" style={{ flex: 1, justifyContent: 'flex-start', padding: '24px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
            <button style={{ background: 'none', color: 'white' }} onClick={() => { setAuthError(''); setPage('landing'); }}>
              <ArrowLeft size={24} />
            </button>
            <h2 style={{ fontFamily: 'var(--font-display)', marginLeft: '16px', fontSize: '20px', fontWeight: 600 }}>Welcome to Splitwise!</h2>
          </div>
          
          <p style={{ color: 'var(--dark-text-secondary)', marginBottom: '24px', fontSize: '15px' }}>
            Let's create your account.
          </p>

          {authError && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              animation: 'fadeIn 0.3s ease'
            }}>
              <Info size={16} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="input-group">
              <label className="input-label">Full name</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. John Doe"
                value={signupName} 
                onChange={(e) => setSignupName(e.target.value)} 
                required 
              />
            </div>

            <div className="input-group">
              <label className="input-label">Email address</label>
              <input 
                type="email" 
                className="input-field" 
                placeholder="e.g. john@example.com"
                value={signupEmail} 
                onChange={(e) => setSignupEmail(e.target.value)} 
                required 
              />
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <input 
                type="password" 
                className="input-field" 
                placeholder="Choose a password"
                value={signupPassword} 
                onChange={(e) => setSignupPassword(e.target.value)} 
                required 
              />
            </div>

            <p style={{ fontSize: '11px', color: 'var(--dark-text-secondary)', lineHeight: '1.6' }}>
              By signing up, you accept the Splitwise <span style={{ color: 'var(--primary-teal)', cursor: 'pointer' }} onClick={() => { setTermsBackPage('signup'); setPage('terms'); }}>Terms of Service</span> and <span style={{ color: 'var(--primary-teal)', cursor: 'pointer' }} onClick={() => { setTermsBackPage('signup'); setPage('privacy'); }}>Privacy Policy</span>.
            </p>

            <button type="submit" className="btn-primary" style={{ marginTop: '20px' }}>
              Done
            </button>
          </form>
        </div>
      )}

      {/* 4. MOCK ACCOUNT SELECTOR MODAL (Google Login Simulator) */}
      {showAccountSelector && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          zIndex: 100,
          transition: 'all 0.3s ease'
        }} onClick={() => setShowAccountSelector(false)}>
          <div 
            className="animate-fade-in"
            style={{
              width: '100%',
              backgroundColor: '#2d3035',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              padding: '24px',
              maxHeight: '85%',
              overflowY: 'auto',
              color: 'white',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.3)'
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#383d44', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '24px' }}>❇️</span>
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600 }}>Choose an account</h3>
              <p style={{ fontSize: '14px', color: 'var(--dark-text-secondary)' }}>to continue to Splitwise</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {users.map(u => (
                <div 
                  key={u._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    transition: 'var(--transition)'
                  }}
                  onClick={() => selectMockUser(u)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)'}
                >
                  <img 
                    src={u.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.name}`}
                    alt={u.name}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '16px', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--dark-text-secondary)' }}>{u.email}</div>
                  </div>
                  <ChevronRight size={18} style={{ color: 'var(--dark-text-secondary)' }} />
                </div>
              ))}

              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                  border: '1px dashed rgba(255, 255, 255, 0.15)',
                  marginTop: '10px',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onClick={() => {
                  setShowAccountSelector(false);
                  setPage('signup');
                }}
              >
                <Plus size={16} />
                <span style={{ fontSize: '14px', fontWeight: 500 }}>Add another account</span>
              </div>
            </div>

            <p style={{ fontSize: '11px', color: 'var(--dark-text-secondary)', marginTop: '24px', textAlign: 'center', lineHeight: '1.6' }}>
              To continue, Google will share your name, email address and profile picture with Splitwise. Before using this app, review its <span style={{ color: 'var(--primary-teal)', cursor: 'pointer' }}>privacy policy</span> and <span style={{ color: 'var(--primary-teal)', cursor: 'pointer' }}>terms of service</span>.
            </p>
          </div>
        </div>
      )}

      {/* 5. DASHBOARD PAGE */}
      {page === 'dashboard' && user && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #fef0ea 0%, #ffffff 100%)',
          padding: '20px',
          paddingBottom: '80px',
          overflowY: 'auto',
          position: 'relative'
        }} className="animate-fade-in">
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color: '#2d3135' }}>
              Welcome to Splitwise, <span style={{ color: 'var(--primary-teal)' }}>{user.name.split(' ')[0]}</span>!
            </h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
                onClick={() => setShowAddGroup(true)}
                title="Create Group"
              >
                <Plus size={18} />
              </button>
              <button 
                style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>

          {/* Owed/Owe Banner Card */}
          <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#64748b', fontFamily: 'var(--font-display)' }}>
                {dashboardBalances.netBalance > 0 ? "Overall, you are owed" : dashboardBalances.netBalance < 0 ? "Overall, you owe" : "Overall balances"}
              </span>
              <Settings size={18} style={{ color: '#94a3b8', cursor: 'pointer' }} />
            </div>

            <div style={{ 
              fontSize: '32px', 
              fontWeight: 800, 
              color: dashboardBalances.netBalance > 0 ? 'var(--color-owed)' : dashboardBalances.netBalance < 0 ? 'var(--color-owe)' : '#475569',
              fontFamily: 'var(--font-display)',
              marginBottom: '4px'
            }}>
              ${Math.abs(dashboardBalances.netBalance).toFixed(2)}
            </div>

            <p style={{ fontSize: '12px', color: '#94a3b8' }}>
              {dashboardBalances.netBalance > 0 
                ? "Excellent! You are in the green." 
                : dashboardBalances.netBalance < 0 
                  ? "Remember to settle up with your friends!" 
                  : "All debts are cleared!"}
            </p>
          </div>

          {/* Groups List Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, zIndex: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, color: '#475569' }}>Active Splits</h3>
              <span style={{ fontSize: '12px', color: 'var(--primary-teal)', cursor: 'pointer', fontWeight: 600 }}>Filter list</span>
            </div>

            {groups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '12px' }}>You aren't in any groups yet.</p>
                <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px', width: 'auto' }} onClick={() => setShowAddGroup(true)}>
                  Create a Group
                </button>
              </div>
            ) : (
              groups.map(g => {
                const status = g.currentUserStatus;
                const type = status ? status.type : 'settled';
                const amount = status ? status.amount : 0;
                
                return (
                  <div 
                    key={g._id}
                    className="glass-card animate-fade-in"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '16px',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                    onClick={() => {
                      setSelectedGroupId(g._id);
                      setPage('group-details');
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                  >
                    {getGroupIcon(g.name)}
                    
                    <div style={{ flex: 1, marginLeft: '16px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>{g.name}</h4>
                      
                      {/* Sub-details of who owes what */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {status && status.owesTo && status.owesTo.filter(d => d && d.user).map(d => (
                          <span key={d.user._id} style={{ fontSize: '11px', color: 'var(--color-owe)' }}>
                            You owe {d.user.name} ${d.amount.toFixed(2)}
                          </span>
                        ))}
                        {status && status.owedBy && status.owedBy.filter(d => d && d.user).map(d => (
                          <span key={d.user._id} style={{ fontSize: '11px', color: 'var(--color-owed)' }}>
                            {d.user.name} owes you ${d.amount.toFixed(2)}
                          </span>
                        ))}
                        {(!status || (status.owesTo.length === 0 && status.owedBy.length === 0)) && (
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            No active balances
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: 600, 
                        color: type === 'owed' ? 'var(--color-owed)' : type === 'owe' ? 'var(--color-owe)' : 'var(--text-secondary)',
                        display: 'block',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {type === 'owed' ? 'you are owed' : type === 'owe' ? 'you owe' : 'settled up'}
                      </span>
                      {amount > 0 && (
                        <span style={{ 
                          fontSize: '16px', 
                          fontWeight: 800, 
                          color: type === 'owed' ? 'var(--color-owed)' : 'var(--color-owe)'
                        }}>
                          ${amount.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Carousel Dots & Bottom Illustration Spacer */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', margin: '24px 0 100px 0', zIndex: 2 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary-teal)' }}></span>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#cbd5e1' }}></span>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#cbd5e1' }}></span>
          </div>

          {/* Beach Landscape Vector Illustration (matching screenshot 5) */}
          <div style={{
            position: 'absolute',
            bottom: '70px',
            left: 0,
            right: 0,
            height: '160px',
            pointerEvents: 'none',
            zIndex: 1,
            overflow: 'hidden'
          }}>
            <svg viewBox="0 0 450 160" width="100%" height="100%" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0 }}>
              {/* Sunset Sky / Mountains */}
              <path d="M 0,160 Q 150,110 225,120 Q 300,130 450,110 L 450,160 Z" fill="#fde0d5" opacity="0.6" />
              {/* Sun rising/setting */}
              <circle cx="225" cy="115" r="35" fill="#f97316" opacity="0.8" />
              {/* Beach Sand Layer 1 */}
              <path d="M 0,160 Q 120,120 225,130 Q 330,140 450,125 L 450,160 Z" fill="#fef3c7" />
              {/* Sea Water */}
              <path d="M 0,160 Q 150,140 225,148 Q 300,155 450,140 L 450,160 Z" fill="#93c5fd" opacity="0.7" />
              {/* Beach Sand Layer 2 (Foreground) */}
              <path d="M 0,160 Q 90,145 225,150 Q 360,155 450,148 L 450,160 Z" fill="#fffbeb" />
              
              {/* People silhouette */}
              <g transform="translate(205, 120) scale(0.65)" opacity="0.8">
                {/* Person 1 */}
                <circle cx="10" cy="20" r="5" fill="#334155" />
                <rect x="7" y="27" width="6" height="15" rx="2" fill="#334155" />
                {/* Person 2 */}
                <circle cx="25" cy="16" r="5.5" fill="#334155" />
                <rect x="21" y="23" width="8" height="20" rx="2" fill="#334155" />
                {/* Person 3 */}
                <circle cx="40" cy="20" r="5" fill="#334155" />
                <rect x="37" y="27" width="6" height="15" rx="2" fill="#334155" />
                {/* Pier outline */}
                <rect x="-10" y="42" width="70" height="3" fill="#334155" />
              </g>

              {/* Beach Parasol / Umbrella */}
              <g transform="translate(50, 105) scale(0.6)">
                <line x1="20" y1="20" x2="20" y2="70" stroke="#78350f" strokeWidth="2.5" />
                <path d="M -5,25 Q 20,-10 45,25 Z" fill="#a855f7" />
                <path d="M 5,22 Q 20,2 35,22 Z" fill="#f43f5e" />
                <path d="M 12,20 Q 20,10 28,20 Z" fill="#3b82f6" />
              </g>

              {/* Surfboards */}
              <g transform="translate(340, 110) scale(0.55)">
                {/* Board 1 */}
                <path d="M 15,10 Q 22,30 22,70 L 8,70 Q 8,30 15,10 Z" fill="#ec4899" />
                <rect x="14" y="20" width="2" height="40" fill="white" />
                {/* Board 2 */}
                <path d="M 35,5 Q 42,25 42,65 L 28,65 Q 28,25 35,5 Z" fill="#06b6d4" />
                <rect x="34" y="15" width="2" height="40" fill="white" />
              </g>

              {/* Beach Ball */}
              <circle cx="310" cy="148" r="8" fill="#eab308" />
              <path d="M 302,148 Q 310,140 318,148 Z" fill="#ef4444" />
              <circle cx="310" cy="148" r="3" fill="white" />

              {/* Leaping Dolphin in background */}
              <path d="M 290,115 Q 300,100 310,112 Q 303,108 290,115" fill="#3b82f6" opacity="0.6" />
            </svg>
          </div>

          {/* Bottom Nav Bar */}
          <div className="bottom-nav">
            <button className={`nav-item ${activeTab === 'groups' ? 'active' : ''}`} onClick={() => setActiveTab('groups')}>
              <Users />
              <span>Groups</span>
            </button>
            <button className={`nav-item ${activeTab === 'friends' ? 'active' : ''}`} onClick={() => setActiveTab('friends')}>
              <UserIcon />
              <span>Friends</span>
            </button>
            <button className={`nav-item ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}>
              <Layers />
              <span>Activity</span>
            </button>
            <button className={`nav-item ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')}>
              <CreditCard />
              <span>Account</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. GROUP DETAILS PAGE */}
      {page === 'group-details' && selectedGroupDetails && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#f8fafc',
          height: '100%',
          overflow: 'hidden'
        }} className="animate-slide-in">
          
          {/* Header */}
          <div style={{
            backgroundColor: 'white',
            borderBottom: '1px solid var(--border-color)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <button style={{ background: 'none', color: '#1e293b' }} onClick={() => {
                setSelectedGroupId(null);
                setPage('dashboard');
              }}>
                <ArrowLeft size={24} />
              </button>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>
                  {selectedGroupDetails.group.name}
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  {selectedGroupDetails.group.description || 'No description'}
                </span>
              </div>
            </div>
            <Settings size={20} style={{ color: '#64748b', cursor: 'pointer' }} />
          </div>

          {/* Group Action Sub-header */}
          <div style={{
            backgroundColor: '#e8f8f5',
            padding: '14px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(28, 194, 159, 0.1)'
          }}>
            <span style={{ 
              fontSize: '13px', 
              fontWeight: 700, 
              color: selectedGroupDetails.currentUserStatus.type === 'owed' ? 'var(--color-owed)' : selectedGroupDetails.currentUserStatus.type === 'owe' ? 'var(--color-owe)' : '#475569'
            }}>
              {selectedGroupDetails.currentUserStatus.text.toUpperCase()}
            </span>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn-primary" 
                style={{ width: 'auto', padding: '8px 14px', fontSize: '12px', borderRadius: '8px' }}
                onClick={() => {
                  setExpensePayer(user._id);
                  setExpenseSplits(selectedGroupDetails.group.members.map(m => m._id));
                  setShowAddExpense(true);
                }}
              >
                Add expense
              </button>
              
              {selectedGroupDetails.currentUserStatus.amount > 0 && (
                <button 
                  className="btn-primary" 
                  style={{ width: 'auto', padding: '8px 14px', fontSize: '12px', borderRadius: '8px', backgroundColor: '#e2f4f1', color: '#1cc29f', boxShadow: 'none' }}
                  onClick={() => {
                    // Populate default settle values
                    if (selectedGroupDetails.currentUserStatus.type === 'owe') {
                      setSettleFrom(user._id);
                      const primaryOwed = selectedGroupDetails.currentUserStatus.owesTo[0];
                      if (primaryOwed) {
                        setSettleTo(primaryOwed.user._id);
                        setSettleAmount(primaryOwed.amount.toFixed(2));
                      }
                    } else {
                      const primaryOwer = selectedGroupDetails.currentUserStatus.owedBy[0];
                      if (primaryOwer) {
                        setSettleFrom(primaryOwer.user._id);
                        setSettleTo(user._id);
                        setSettleAmount(primaryOwer.amount.toFixed(2));
                      }
                    }
                    setShowSettleUp(true);
                  }}
                >
                  Settle up
                </button>
              )}
            </div>
          </div>

          {/* View Toggle Tabs */}
          <div style={{ display: 'flex', backgroundColor: 'white', borderBottom: '1px solid var(--border-color)' }}>
            <button 
              style={{ flex: 1, padding: '14px', fontSize: '13px', fontWeight: 600, color: '#1e293b', borderBottom: '2px solid var(--primary-teal)', background: 'none' }}
            >
              Expenses & Activity
            </button>
          </div>

          {/* Expenses & Activity Scroll */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Net Balances Summary */}
            <div className="glass-card" style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'white' }}>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}>
                Balances Breakdown
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedGroupDetails.netDebts.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', padding: '10px' }}>
                    Everyone is settled up!
                  </p>
                ) : (
                  selectedGroupDetails.netDebts.filter(d => d && d.from && d.to).map((d, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600 }}>{d.from.name}</span>
                        <span style={{ color: '#94a3b8' }}>owes</span>
                        <span style={{ fontWeight: 600 }}>{d.to.name}</span>
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--color-owe)' }}>
                        ${d.amount.toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Expenses List */}
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: '#475569', marginTop: '10px' }}>
              Transaction Log
            </h4>

            {expenses.length === 0 && settlements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                <p style={{ fontSize: '14px' }}>No transactions recorded yet in this group.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Show Settlements first, then Expenses, sorted by date (or as loaded) */}
                {settlements.map(s => (
                  <div 
                    key={s._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 16px',
                      backgroundColor: '#f1f5f9',
                      borderRadius: '12px',
                      borderLeft: '4px solid #64748b'
                    }}
                  >
                    <div style={{ marginRight: '12px', fontSize: '20px' }}>💸</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                        {s.fromUser.name} paid {s.toUser.name}
                      </p>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {new Date(s.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '15px', color: '#475569' }}>
                      ${s.amount.toFixed(2)}
                    </div>
                  </div>
                ))}

                {expenses.map(e => {
                  const wasPaidByMe = e.paidBy._id.toString() === user._id.toString();
                  const mySplit = e.splits.find(s => s.user._id.toString() === user._id.toString());
                  const myOwedShare = mySplit ? mySplit.owedAmount : 0;
                  
                  let shareText = '';
                  let shareColor = '';

                  if (wasPaidByMe) {
                    const totalLent = e.amount - myOwedShare;
                    shareText = `you lent $${totalLent.toFixed(2)}`;
                    shareColor = 'var(--color-owed)';
                  } else {
                    shareText = myOwedShare > 0 ? `you borrowed $${myOwedShare.toFixed(2)}` : "you didn't split";
                    shareColor = myOwedShare > 0 ? 'var(--color-owe)' : 'var(--text-secondary)';
                  }

                  return (
                    <div 
                      key={e._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '14px 16px',
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <div style={{ marginRight: '14px', fontSize: '22px' }}>🍔</div>
                      
                      <div style={{ flex: 1 }}>
                        <h5 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '2px' }}>
                          {e.description}
                        </h5>
                        <p style={{ fontSize: '11px', color: '#64748b' }}>
                          Paid by {e.paidBy.name} • {new Date(e.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>
                          Total Expense
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', display: 'block' }}>
                          ${e.amount.toFixed(2)}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: shareColor }}>
                          {shareText}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODALS (Add Expense, Settle Up, Create Group) --- */}

      {/* A. ADD EXPENSE MODAL */}
      {showAddExpense && selectedGroupDetails && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="glass-card animate-fade-in" style={{
            width: '100%',
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '20px',
            boxShadow: 'var(--shadow-lg)',
            maxHeight: '90%',
            overflowY: 'auto'
          }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, marginBottom: '20px', color: '#1e293b' }}>
              Add an expense
            </h3>

            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">With you and</label>
                <div style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', backgroundColor: '#f8fafc', fontWeight: 600 }}>
                  {selectedGroupDetails.group.name}
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Description</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Dinner or Groceries"
                  value={expenseDesc} 
                  onChange={(e) => setExpenseDesc(e.target.value)} 
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label">Amount ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="input-field" 
                  placeholder="0.00"
                  value={expenseAmount} 
                  onChange={(e) => setExpenseAmount(e.target.value)} 
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label">Paid by</label>
                <select 
                  className="input-field" 
                  value={expensePayer} 
                  onChange={(e) => setExpensePayer(e.target.value)}
                  required
                >
                  {selectedGroupDetails.group.members.map(m => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Split equally among</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '120px', overflowY: 'auto', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  {selectedGroupDetails.group.members.map(m => {
                    const isChecked = expenseSplits.includes(m._id);
                    return (
                      <label key={m._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setExpenseSplits(expenseSplits.filter(id => id !== m._id));
                            } else {
                              setExpenseSplits([...expenseSplits, m._id]);
                            }
                          }}
                        />
                        {m.name}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddExpense(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B. SETTLE UP MODAL */}
      {showSettleUp && selectedGroupDetails && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="glass-card animate-fade-in" style={{
            width: '100%',
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '20px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, marginBottom: '20px', color: '#1e293b' }}>
              Record a payment
            </h3>

            <form onSubmit={handleSettleUp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">Payer (Who Paid)</label>
                <select 
                  className="input-field" 
                  value={settleFrom} 
                  onChange={(e) => setSettleFrom(e.target.value)}
                  required
                >
                  <option value="">Select payer</option>
                  {selectedGroupDetails.group.members.map(m => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Recipient (Who Received)</label>
                <select 
                  className="input-field" 
                  value={settleTo} 
                  onChange={(e) => setSettleTo(e.target.value)}
                  required
                >
                  <option value="">Select recipient</option>
                  {selectedGroupDetails.group.members.map(m => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Amount Paid ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="input-field" 
                  placeholder="0.00"
                  value={settleAmount} 
                  onChange={(e) => setSettleAmount(e.target.value)} 
                  required 
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowSettleUp(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* C. CREATE GROUP MODAL */}
      {showAddGroup && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="glass-card animate-fade-in" style={{
            width: '100%',
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '20px',
            boxShadow: 'var(--shadow-lg)',
            maxHeight: '90%',
            overflowY: 'auto'
          }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, marginBottom: '20px', color: '#1e293b' }}>
              Create a group
            </h3>

            <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">Group Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Ski Trip or Roommates"
                  value={groupName} 
                  onChange={(e) => setGroupName(e.target.value)} 
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label">Description (Optional)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="What is this group for?"
                  value={groupDesc} 
                  onChange={(e) => setGroupDesc(e.target.value)} 
                />
              </div>

              <div className="input-group">
                <label className="input-label">Add members</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                  {users.filter(u => u._id !== user._id).map(u => {
                    const isChecked = groupMembers.includes(u._id);
                    return (
                      <label key={u._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setGroupMembers(groupMembers.filter(id => id !== u._id));
                            } else {
                              setGroupMembers([...groupMembers, u._id]);
                            }
                          }}
                        />
                        {u.name} ({u.email})
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddGroup(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. TERMS OF SERVICE PAGE */}
      {page === 'terms' && (
        <div className="theme-dark animate-slide-in" style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#18191b', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', backgroundColor: '#131415', borderBottom: '1px solid #2e333d', gap: '16px' }}>
            <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }} onClick={() => setPage(termsBackPage)}>
              <ArrowLeft size={24} />
            </button>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600, color: 'white', margin: 0 }}>
              Terms of Service :: Splitwise
            </h2>
          </div>

          {/* Content */}
          <div style={{ flex: 1, padding: '24px 20px', overflowY: 'auto', backgroundColor: '#1c1e21', fontFamily: 'var(--font-body)', color: '#cfd2d6' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700, color: 'white', marginBottom: '8px', lineHeight: '1.2' }}>
              Splitwise Terms of Service
            </h1>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px' }}>
              Last updated: February 8th, 2024
            </p>

            <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
              Splitwise is a shared ledger for friends, colleagues and family to keep track of expenses. Bills, IOUs, debts and payments recorded on Splitwise are informal records, and not legally binding contracts of some kind. We offer the Splitwise service "as-is" without a warranty. Splitwise® is a work-in-progress, so some features of our website and apps may not work exactly as planned. We may stop offering or restrict certain services or features at any time. Please be patient with us and we'll always do our best to support you.
            </p>

            <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
              We will modify our Terms Of Use and <span style={{ color: '#1CC29F', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setPage('privacy')}>Privacy Policy</span> periodically and post the most current version on this webpage, <a href="https://www.splitwise.com/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#1CC29F', textDecoration: 'underline' }}>https://www.splitwise.com/terms</a>. Here are the policies:
            </p>

            <hr style={{ border: 'none', borderTop: '1px solid #2e333d', marginBottom: '24px' }} />

            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'white', marginBottom: '16px' }}>
              Terms Of Use
            </h3>

            <p style={{ fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              <strong>Who can use Splitwise:</strong> You may use our services only if you agree to these Terms of Service and to the processing of you
            </p>
          </div>
        </div>
      )}

      {/* 6. PRIVACY POLICY PAGE */}
      {page === 'privacy' && (
        <div className="theme-dark animate-slide-in" style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#18191b', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', backgroundColor: '#131415', borderBottom: '1px solid #2e333d', gap: '16px' }}>
            <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }} onClick={() => setPage(termsBackPage)}>
              <ArrowLeft size={24} />
            </button>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600, color: 'white', margin: 0 }}>
              Privacy Policy :: Splitwise
            </h2>
          </div>

          {/* Content */}
          <div style={{ flex: 1, padding: '24px 20px', overflowY: 'auto', backgroundColor: '#1c1e21', fontFamily: 'var(--font-body)', color: '#cfd2d6' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700, color: 'white', marginBottom: '8px', lineHeight: '1.2' }}>
              Splitwise Inc. Privacy Statement
            </h1>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px' }}>
              Last updated: May 26th, 2026
            </p>

            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'white', marginBottom: '12px' }}>
              Scope
            </h3>

            <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
              Welcome to Splitwise’s Privacy Statement. Your right to privacy and online security is important. This Privacy Statement describes Splitwise’s collection, protection, disclosure, and use of the personal information provided to or collected through our service. This Privacy Statement applies to all of Splitwise’s websites, mobile applications, and online services that link to or reference this Privacy Statement.
            </p>

            <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
              If you do not agree with any of the practices described in this Privacy Statement, please do not use our services.
            </p>

            <hr style={{ border: 'none', borderTop: '1px solid #2e333d', margin: '24px 0' }} />

            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'white', marginBottom: '12px' }}>
              Here's a quick overview
            </h3>

            <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
              Splitwise is a shared ledger for friends. You choose who you share your expenses with and what kind of expenses you want to share. When you share an expense, the details of those transactions are visible to those you share them with, whether an individual friend or a group. Anyone shared on an expense or seeing the expense in the group has the ability to edit, delete, and undelete the expenses that have been shared with them. Expenses you add in Splitwise are not made public.
            </p>

            <p style={{ fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              In order to use Splitwise, you will need to create an account, which requires providing some registration information such as name, email address and phone number. We use this information to manage your account including contacting you when necessary. The information can also be used so that your friends can find you and so you can access your account from anywhere.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
