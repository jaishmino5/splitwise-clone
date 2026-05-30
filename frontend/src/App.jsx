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
  Layers,
  Image as ImageIcon
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const formatDate = (dateVal) => {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  const today = new Date(2026, 4, 29); // May 29, 2026
  if (d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()) {
    return "Today";
  }
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

const initialSimulatedContacts = [
  { name: ". Pranab Roy", phone: "+919433800260" },
  { name: "9413594618", phone: "+919413594618" },
  { name: "9413594618", phone: "+919413594618" },
  { name: "Aarav", phone: "+919829961643" },
  { name: "Aasha Bhatia", phone: "+919635028757" },
  { name: "Aau", phone: "+9111161205590" },
  { name: "Abhiram", phone: "+919852099774" },
  { name: "Aditi Sharma", phone: "+919876543210" },
  { name: "Ananya Iyer", phone: "+919123456789" },
  { name: "Divya Patel", phone: "+919871234567" },
  { name: "Ishaan Gupta", phone: "+919812345678" },
  { name: "Kabir Kapoor", phone: "+919567890123" },
  { name: "Meera Sen", phone: "+919456789012" },
  { name: "Rohan Verma", phone: "+919345678901" },
  { name: "Siddharth Malhotra", phone: "+919234567890" }
];

export default function App() {
  // Navigation and Session State
  const [user, setUser] = useState(null); // Current user
  const [page, setPage] = useState('landing'); // 'landing', 'login', 'signup', 'dashboard', 'group-details'
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [activeTab, setActiveTab] = useState('groups'); // 'groups', 'friends', 'activity', 'account'
  const [tutorialStep, setTutorialStep] = useState(1);

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
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [termsBackPage, setTermsBackPage] = useState('landing');

  // Friends & Search State
  const [friends, setFriends] = useState([]);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [isFriendSearchActive, setIsFriendSearchActive] = useState(false);

  // Contact Picker & Friends Screen States
  const [contactsPermission, setContactsPermission] = useState(() => localStorage.getItem('splitwise_contacts_permission') || 'prompt');
  const [searchContactQuery, setSearchContactQuery] = useState('');
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);

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
  const [groupType, setGroupType] = useState('trip'); // 'trip', 'home', 'couple', 'other'
  const [groupMembers, setGroupMembers] = useState([]); // Array of userIds
  const [showTripDates, setShowTripDates] = useState(true);
  const [tripStartDate, setTripStartDate] = useState(new Date(2026, 4, 29)); // Default to today's local time: May 29, 2026
  const [tripEndDate, setTripEndDate] = useState(null);
  const [showSettleUpReminders, setShowSettleUpReminders] = useState(false);
  const [showBalanceAlert, setShowBalanceAlert] = useState(false);
  const [activeDatePicker, setActiveDatePicker] = useState(null); // 'start', 'end', or null
  const [pickerMonth, setPickerMonth] = useState(4); // May (0-indexed 4)
  const [pickerYear, setPickerYear] = useState(2026);

  // Add Friend Form Inputs
  const [friendName, setFriendName] = useState('');
  const [friendEmail, setFriendEmail] = useState('');

  // Edit Profile Form Inputs & Modals State
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showProCheckout, setShowProCheckout] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');

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

      // 3. Fetch friends list
      const resFriends = await fetch(`${API_BASE}/users/${user._id}/friends`);
      if (resFriends.ok) {
        const data = await resFriends.json();
        setFriends(data);
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
        setPage('tutorial');
        setTutorialStep(1);
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
        setPage('tutorial');
        setTutorialStep(1);
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
    const redirectUri = window.location.origin;
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
    if (e && e.preventDefault) e.preventDefault();
    if (!groupName) return;

    // Make sure current user is added to group members
    const finalMembers = Array.from(new Set([...groupMembers, user._id]));

    let finalDesc = groupDesc || groupType;
    if (groupType === 'trip' && showTripDates) {
      const startStr = formatDate(tripStartDate);
      const endStr = tripEndDate ? formatDate(tripEndDate) : '';
      finalDesc = endStr ? `Trip • ${startStr} - ${endStr}` : `Trip • Starting ${startStr}`;
    } else if (groupType === 'home') {
      finalDesc = showSettleUpReminders ? "Home • Reminders Enabled" : "Home";
    } else if (groupType === 'couple') {
      finalDesc = showBalanceAlert ? "Couple • Balance Alert Enabled" : "Couple";
    }

    try {
      const res = await fetch(`${API_BASE}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName,
          description: finalDesc,
          members: finalMembers
        })
      });
      if (res.ok) {
        setShowAddGroup(false);
        setGroupName('');
        setGroupDesc('');
        setGroupType('trip');
        setGroupMembers([]);
        setTripStartDate(new Date(2026, 4, 29));
        setTripEndDate(null);
        setShowTripDates(true);
        setShowSettleUpReminders(false);
        setShowBalanceAlert(false);
        await fetchDashboardData();
      } else {
        alert("Failed to create group");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Friend Action
  const handleAddFriend = async (e) => {
    e.preventDefault();
    if (!friendName) return;
    try {
      const res = await fetch(`${API_BASE}/users/${user._id}/friends`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: friendName,
          email: friendEmail
        })
      });
      if (res.ok) {
        setShowAddFriend(false);
        setFriendName('');
        setFriendEmail('');
        await fetchDashboardData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add friend");
      }
    } catch (err) {
      console.error("Error adding friend:", err);
    }
  };

  const handleOpenAddFriend = async () => {
    // If Contact Picker API is supported natively, immediately trigger it!
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'tel'];
        const opts = { multiple: true };
        const picked = await navigator.contacts.select(props, opts);
        if (picked && picked.length > 0) {
          for (const contact of picked) {
            const name = contact.name?.[0] || 'Unknown';
            const phone = contact.tel?.[0] || '';
            const email = `phone_${phone.replace(/\s+/g, '')}@splitwise.demo`;
            
            await fetch(`${API_BASE}/users/${user._id}/friends`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, email })
            });
          }
          await fetchDashboardData();
          alert(`Successfully imported ${picked.length} friends from your phone!`);
          return; // Done, no need to open fallback screen!
        }
      } catch (err) {
        console.log("Native Contact Picker closed/failed, showing fallback view:", err);
      }
    }

    // Fallback path (Desktop or unsupported or closed picker):
    setShowAddFriend(true);
    if (contactsPermission === 'prompt') {
      setShowPermissionDialog(true);
    }
  };

  const handleAllowContacts = async () => {
    localStorage.setItem('splitwise_contacts_permission', 'granted');
    setContactsPermission('granted');
    setShowPermissionDialog(false);
    
    // Check if real navigator.contacts is supported
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'tel'];
        const opts = { multiple: true };
        const picked = await navigator.contacts.select(props, opts);
        if (picked && picked.length > 0) {
          for (const contact of picked) {
            const name = contact.name?.[0] || 'Unknown';
            const phone = contact.tel?.[0] || '';
            const email = `phone_${phone.replace(/\s+/g, '')}@splitwise.demo`;
            
            await fetch(`${API_BASE}/users/${user._id}/friends`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, email })
            });
          }
          await fetchDashboardData();
          setShowAddFriend(false);
          alert(`Successfully imported ${picked.length} contacts!`);
        }
      } catch (err) {
        console.error("Contacts API error:", err);
      }
    }
  };

  const handleDenyContacts = () => {
    localStorage.setItem('splitwise_contacts_permission', 'denied');
    setContactsPermission('denied');
    setShowPermissionDialog(false);
  };

  const handleCreateFriendDirect = async (name, phone = '') => {
    try {
      const emailToUse = phone ? `phone_${phone.replace(/\s+/g, '')}@splitwise.demo` : `contact_${Date.now()}_${Math.random().toString(36).substring(2,7)}@splitwise.demo`;
      const res = await fetch(`${API_BASE}/users/${user._id}/friends`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          email: emailToUse
        })
      });
      if (res.ok) {
        setShowAddFriend(false);
        setSearchContactQuery('');
        await fetchDashboardData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add friend");
      }
    } catch (err) {
      console.error("Error creating friend directly:", err);
    }
  };

  const handleGeneralAddExpenseClick = () => {
    if (groups.length > 0) {
      const defaultGroup = groups[0];
      setSelectedGroupId(defaultGroup._id);
      fetchGroupDetails(defaultGroup._id);
      setExpensePayer(user._id);
      if (defaultGroup.members) {
        setExpenseSplits(defaultGroup.members.map(m => m._id || m));
      } else {
        setExpenseSplits([user._id]);
      }
      setShowAddExpense(true);
    } else {
      // Create a default group first
      alert("Please add a group first before splitting expenses.");
      setShowAddGroup(true);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!editName) return;
    try {
      const res = await fetch(`${API_BASE}/users/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          avatarUrl: editAvatarUrl
        })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        setShowEditProfile(false);
        await fetchDashboardData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
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
        <div style={{
          background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
          width: '54px',
          height: '54px',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
      );
    }
    const lname = name.toLowerCase();
    
    // Non-group expenses geometric icon matching screenshot exactly
    if (lname.includes('non-group') || lname.includes('non group')) {
      return (
        <div style={{ width: '54px', height: '54px', borderRadius: '14px', overflow: 'hidden', flexShrink: 0 }}>
          <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="54" height="54" fill="#0d9488" />
            <polygon points="12,32 27,14 42,32" fill="#ea580c" />
            <polygon points="27,32 54,32 54,54 36,54" fill="#7c3aed" />
            <polygon points="0,32 27,32 18,54 0,54" fill="#10b981" />
          </svg>
        </div>
      );
    }

    // Plane icon for trips, travel, manali, jaish (matches user screenshot with beautiful crimson red gradient)
    if (lname.includes('manali') || lname.includes('jaish') || lname.includes('beach') || lname.includes('trip') || lname.includes('travel') || lname.includes('vacation')) {
      return (
        <div style={{
          background: 'linear-gradient(135deg, #a8203c 0%, #5d0f1e 100%)',
          width: '54px',
          height: '54px',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3.5S19 4 17.5 5.5L14 9 5.8 7.2 4.2 8.8l8 4.7-4 4-2.8-.7L4 18.2l3.5 1.3 1.3 3.5 1.4-1.4-.7-2.8 4-4 4.7 8 1.6-1.6z" />
          </svg>
        </div>
      );
    }

    // Couple icon with premium violet gradient
    if (lname.includes('couple') || lname.includes('partner') || lname.includes('love') || lname.includes('relationship')) {
      return (
        <div style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
          width: '54px',
          height: '54px',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>
      );
    }

    // Default household / home icon
    return (
      <div style={{
        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        width: '54px',
        height: '54px',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>
    );
  };

  const filteredContacts = initialSimulatedContacts.filter(c => 
    c.name.toLowerCase().includes(searchContactQuery.toLowerCase()) ||
    c.phone.toLowerCase().includes(searchContactQuery.toLowerCase())
  );

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


      {/* 4. ONBOARDING TOUR / TUTORIAL PAGE */}
      {page === 'tutorial' && user && (
        <div 
          onClick={() => {
            if (tutorialStep < 4) {
              setTutorialStep(tutorialStep + 1);
            }
          }}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '24px 24px 16px 24px',
            background: 
              tutorialStep === 1 ? 'linear-gradient(to bottom, #ffe1d5 0%, #ffe1d5 60%, #ffffff 85%)' : 
              tutorialStep === 2 ? 'linear-gradient(to bottom, #e5f6f3 0%, #e5f6f3 60%, #ffffff 85%)' : 
              tutorialStep === 3 ? 'linear-gradient(to bottom, #e8ecf1 0%, #e8ecf1 60%, #ffffff 85%)' : '#ebf5f3',
            transition: 'background 0.4s ease',
            cursor: tutorialStep < 4 ? 'pointer' : 'default',
            userSelect: 'none',
            height: '100%',
            overflow: 'hidden',
            position: 'relative'
          }}
          className="animate-fade-in"
        >
          {/* STEP 1: WELCOME SCREEN */}
          {tutorialStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }} className="animate-fade-in">
              <div style={{ textAlign: 'left' }}>
                <h1 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '36px',
                  fontWeight: 700,
                  color: '#2e333d',
                  lineHeight: '1.15',
                  letterSpacing: '-0.5px',
                  marginTop: '10px'
                }}>
                  Welcome to<br />Splitwise,<br />{user.name ? user.name.split(' ')[0] : 'Jaish'}!
                </h1>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '18px',
                  color: '#4e5664',
                  marginTop: '12px',
                  lineHeight: '1.3'
                }}>
                  Splitwise keeps track of<br />balances between friends.
                </p>

                {/* Mock Balance Summary Card */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '24px',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)',
                  padding: '20px',
                  marginTop: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: '#2e333d' }}>
                      Overall, you are owed <span style={{ color: '#108573' }}>$64.64</span>
                    </span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#718096" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="4" y1="21" x2="4" y2="14" />
                      <line x1="4" y1="10" x2="4" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12" y2="3" />
                      <line x1="20" y1="21" x2="20" y2="16" />
                      <line x1="20" y1="12" x2="20" y2="3" />
                      <line x1="1" y1="14" x2="7" y2="14" />
                      <line x1="9" y1="8" x2="15" y2="8" />
                      <line x1="17" y1="16" x2="23" y2="16" />
                    </svg>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Item 1 */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ backgroundColor: '#108573', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3.5S19 4 17.5 5.5L14 9 5.8 7.2 4.2 8.8l8 4.7-4 4-2.8-.7L4 18.2l3.5 1.3 1.3 3.5 1.4-1.4-.7-2.8 4-4 4.7 8 1.6-1.6z" />
                          </svg>
                        </div>
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '15px', fontWeight: 600, color: '#2e333d' }}>Beach trip</span>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontSize: '11px', color: '#108573' }}>you are owed</span>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#108573' }}>$100.00</span>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ position: 'relative', paddingLeft: '38px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', padding: '6px 0 6px 12px', position: 'relative' }}>
                          <svg style={{ position: 'absolute', left: '-19px', top: '-10px', width: '20px', height: '26px' }}>
                            <path d="M 0 0 L 0 16 L 12 16" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                          <span style={{ fontSize: '13px', color: '#718096' }}>
                            David owes you <span style={{ color: '#108573', fontWeight: 500 }}>$100.00</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Item 2 */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          backgroundImage: 'linear-gradient(to bottom, #e0f2fe, #f0f9ff)',
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          border: '1px solid #bae6fd',
                          overflow: 'hidden'
                        }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                          </svg>
                        </div>
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '15px', fontWeight: 600, color: '#2e333d' }}>House stuff</span>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontSize: '11px', color: '#ff652f' }}>you owe</span>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#ff652f' }}>$35.36</span>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ position: 'relative', paddingLeft: '38px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', padding: '6px 0 6px 12px', position: 'relative' }}>
                          <svg style={{ position: 'absolute', left: '-19px', top: '-10px', width: '20px', height: '40px' }}>
                            <line x1="0" y1="0" x2="0" y2="40" stroke="#cbd5e1" strokeWidth="1.5" />
                            <line x1="0" y1="16" x2="12" y2="16" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                          <span style={{ fontSize: '13px', color: '#718096' }}>
                            You owe Brooklyn S. <span style={{ color: '#ff652f', fontWeight: 500 }}>$105.36</span>
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', padding: '6px 0 6px 12px', position: 'relative' }}>
                          <svg style={{ position: 'absolute', left: '-19px', top: '-14px', width: '20px', height: '30px' }}>
                            <path d="M 0 0 L 0 16 L 12 16" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                          <span style={{ fontSize: '13px', color: '#718096' }}>
                            Earl E. owes you <span style={{ color: '#108573', fontWeight: 500 }}>$70.00</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Beach scene SVG */}
              <div style={{ width: 'calc(100% + 48px)', height: '28vh', margin: 'auto -24px -16px -24px', position: 'relative', zIndex: 1 }}>
                <svg viewBox="0 0 400 240" width="100%" height="100%" preserveAspectRatio="xMidYMax slice" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
                  {/* Sky background is transparent to show page gradient */}
                  <circle cx="200" cy="140" r="40" fill="#ff5a36" />
                  
                  <path d="M200 140 L140 0 L160 0 Z" fill="#ffe1d6" opacity="0.3" />
                  <path d="M200 140 L185 0 L215 0 Z" fill="#ffe1d6" opacity="0.3" />
                  <path d="M200 140 L240 0 L260 0 Z" fill="#ffe1d6" opacity="0.3" />
                  
                  <path d="M50 30 Q53 26 56 30 Q59 26 62 30" stroke="#ff7a5c" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M90 45 Q92 42 94 45 Q96 42 98 45" stroke="#ff7a5c" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M320 40 Q322 37 324 40 Q326 37 328 40" stroke="#ff7a5c" strokeWidth="1.2" strokeLinecap="round" />
                  
                  <rect x="0" y="140" width="400" height="100" fill="url(#waterGrad)" />
                  <ellipse cx="200" cy="144" rx="90" ry="3" fill="#ff7a5c" opacity="0.5" />
                  <ellipse cx="180" cy="152" rx="60" ry="2" fill="#ffffff" opacity="0.4" />
                  
                  <path d="M190 140 L170 240 L230 240 L210 140 Z" fill="#ffffff" />
                  <path d="M190 140 L188 240 M210 140 L212 240" stroke="#e2f0ed" strokeWidth="1.5" />
                  <line x1="189" y1="148" x2="211" y2="148" stroke="#e2f0ed" strokeWidth="1" />
                  <line x1="187" y1="160" x2="213" y2="160" stroke="#e2f0ed" strokeWidth="1" />
                  <line x1="184" y1="178" x2="216" y2="178" stroke="#e2f0ed" strokeWidth="1.5" />
                  <line x1="180" y1="202" x2="220" y2="202" stroke="#e2f0ed" strokeWidth="2" />
                  <line x1="174" y1="230" x2="226" y2="230" stroke="#e2f0ed" strokeWidth="2.5" />
                  
                  <path d="M194 140 L200 128 L206 140 Z" fill="#0d6e5f" />
                  <rect x="196" y="140" width="8" height="5" fill="#0d6e5f" />
                  
                  <circle cx="198" cy="138" r="1.2" fill="#0c564b" />
                  <line x1="198" y1="139" x2="198" y2="142" stroke="#0c564b" strokeWidth="0.8" />
                  <circle cx="201" cy="137" r="1.2" fill="#0c564b" />
                  <line x1="201" y1="138" x2="201" y2="141" stroke="#0c564b" strokeWidth="0.8" />
                  <circle cx="204" cy="138" r="1.2" fill="#0c564b" />
                  <line x1="204" y1="139" x2="204" y2="142" stroke="#0c564b" strokeWidth="0.8" />

                  <path d="M265 160 Q275 140 290 144 Q282 152 272 164" fill="#1cc29f" />
                  <path d="M283 143 L287 138 L285 143 Z" fill="#1cc29f" />
                  <path d="M288 144 L293 142 L291 146 Z" fill="#1cc29f" />
                  <ellipse cx="267" cy="161" rx="5" ry="1.2" fill="#e5f6f3" transform="rotate(-30 267 161)" opacity="0.5" />

                  <path d="M55 220 L70 145" stroke="#48245a" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M20 162 C28 145, 92 145, 100 162 C92 166, 80 166, 68 162 C56 166, 44 166, 32 162 C25 164, 22 164, 20 162 Z" fill="#a855f7" />
                  <path d="M20 162 C28 145, 92 145, 100 162 Z" fill="#c084fc" opacity="0.3" />
                  <path d="M62 145 L62 142" stroke="#48245a" strokeWidth="1.5" />
                  
                  <g transform="translate(295, 150)">
                    <path d="M0 80 C-10 55, -10 15, 10 0 C30 15, 30 55, 20 80 Z" fill="#c084fc" />
                    <path d="M6 0 C16 15, 16 55, 10 80 Z" fill="#e9d5ff" opacity="0.4" />
                  </g>

                  <circle cx="280" cy="225" r="11" fill="#1cc29f" />
                  <path d="M269 225 Q280 217 291 225" stroke="#ffffff" strokeWidth="1.5" />
                  <path d="M280 214 Q272 225 280 236" stroke="#ffffff" strokeWidth="1.5" />

                  <g transform="translate(340, 215)">
                    <rect x="0" y="0" width="8" height="18" rx="4" fill="#5ad0b6" transform="rotate(-5)" />
                    <path d="M1 8 L4 3 L7 8" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
                    <rect x="11" y="0" width="8" height="18" rx="4" fill="#5ad0b6" transform="rotate(5)" />
                    <path d="M12 8 L15 3 L18 8" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
                  </g>

                  <g transform="translate(15, 225)">
                    <rect x="0" y="0" width="8" height="12" rx="1" fill="#108573" />
                    <ellipse cx="4" cy="0" rx="4" ry="1.2" fill="#cbd5e1" />
                    <rect x="9" y="0" width="8" height="12" rx="1" fill="#108573" />
                    <ellipse cx="13" cy="0" rx="4" ry="1.2" fill="#cbd5e1" />
                    <rect x="18" y="0" width="8" height="12" rx="1" fill="#108573" />
                    <ellipse cx="22" cy="0" rx="4" ry="1.2" fill="#cbd5e1" />
                    <rect x="4" y="4" width="8" height="12" rx="1" fill="#108573" stroke="#ffd9cb" strokeWidth="0.4" />
                    <ellipse cx="8" cy="4" rx="4" ry="1.2" fill="#cbd5e1" />
                    <rect x="13" y="4" width="8" height="12" rx="1" fill="#108573" stroke="#ffd9cb" strokeWidth="0.4" />
                    <ellipse cx="17" cy="4" rx="4" ry="1.2" fill="#cbd5e1" />
                  </g>

                  <defs>
                    <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="140">
                      <stop offset="0%" stopColor="#ffd9cb" />
                      <stop offset="100%" stopColor="#ffe6de" />
                    </linearGradient>
                    <linearGradient id="waterGrad" x1="0" y1="140" x2="0" y2="240">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#e5f6f3" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          )}

          {/* STEP 2: ADD EXPENSES SCREEN */}
          {tutorialStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }} className="animate-fade-in">
              <div style={{ textAlign: 'left' }}>
                <h1 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '36px',
                  fontWeight: 700,
                  color: '#2e333d',
                  lineHeight: '1.15',
                  letterSpacing: '-0.5px',
                  marginTop: '10px'
                }}>
                  Add expenses
                </h1>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '18px',
                  color: '#4e5664',
                  marginTop: '12px',
                  lineHeight: '1.3'
                }}>
                  You can split expenses with<br />groups or with individuals.
                </p>

                {/* Groceries card */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '24px',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)',
                  padding: '24px',
                  marginTop: '36px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid #cbd5e1', paddingBottom: '12px' }}>
                    <div style={{ backgroundColor: '#e2f4f1', width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#108573" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                      </svg>
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: 600, color: '#2e333d' }}>Groceries</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ border: '1px solid #cbd5e1', width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#64748b' }}>$</span>
                    </div>
                    <div style={{ flex: 1, borderBottom: '2.5px solid #108573', paddingBottom: '4px' }}>
                      <span style={{ fontSize: '28px', fontWeight: 600, color: '#2e333d', letterSpacing: '0.5px' }}>94.50</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* House/Grocery SVG */}
              <div style={{ width: 'calc(100% + 48px)', height: '26vh', margin: 'auto -24px -16px -24px', position: 'relative', zIndex: 1 }}>
                <svg viewBox="0 0 400 220" width="100%" height="100%" preserveAspectRatio="xMidYMax slice" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
                  {/* Background is transparent to show page gradient */}
                  
                  <path d="M-50 220 Q150 140 450 220 Z" fill="#9cdbc8" />
                  <path d="M-50 220 Q250 170 450 220 Z" fill="#cbece2" opacity="0.6" />

                  <g transform="translate(180, 90)">
                    <rect x="0" y="25" width="80" height="55" fill="#ffd0b7" />
                    <path d="M-10 25 L40 -15 L90 25 Z" fill="#f87171" />
                    <rect x="15" y="45" width="18" height="35" rx="2" fill="#991b1b" />
                    <rect x="45" y="35" width="20" height="20" rx="2" fill="#fef08a" />
                    <line x1="55" y1="35" x2="55" y2="55" stroke="#f87171" strokeWidth="1" />
                    <line x1="45" y1="45" x2="65" y2="45" stroke="#f87171" strokeWidth="1" />
                    
                    <path d="M5 25 Q3 17 0 17 L2 25 Z M7 25 Q9 17 12 17 L10 25 Z" fill="#1e293b" />
                    <ellipse cx="6" cy="25" rx="5" ry="4" fill="#1e293b" />
                    <path d="M2 28 Q-3 30 -5 25" stroke="#1e293b" strokeWidth="1.2" strokeLinecap="round" />
                  </g>

                  <g transform="translate(320, 90)">
                    <path d="M20 70 L0 45 L10 45 L-5 20 L5 20 L-10 0 L15 -20 L40 0 L25 20 L35 20 L20 45 L30 45 Z" fill="#0d6e5f" />
                    <rect x="15" y="70" width="10" height="15" fill="#78350f" />
                  </g>
                  
                  <path d="M260 105 Q290 125 320 110" stroke="#fef08a" strokeWidth="1.2" fill="none" strokeDasharray="1 4" strokeLinecap="round" />
                  <circle cx="270" cy="110" r="2" fill="#fef08a" />
                  <circle cx="282" cy="115" r="2" fill="#fef08a" />
                  <circle cx="295" cy="117" r="2" fill="#fef08a" />
                  <circle cx="308" cy="115" r="2" fill="#fef08a" />

                  <path d="M200 220 Q180 180 195 160 T200 135" stroke="#e5f6f3" strokeWidth="14" fill="none" strokeLinecap="round" />

                  <g transform="translate(185, 130)">
                    <circle cx="10" cy="0" r="2.5" fill="#0f172a" />
                    <path d="M7 3.5 Q10 3.5 13 3.5 L13 14 L11 14 L11 22 L9 22 L9 14 L7 14 Z" fill="#0f172a" />
                    <rect x="12" y="8" width="4" height="6" fill="#b45309" />
                    <path d="M13 8 Q14 5 15 8" stroke="#0f172a" strokeWidth="0.8" fill="none" />

                    <circle cx="22" cy="4" r="2" fill="#0f172a" />
                    <path d="M19 7 Q22 7 25 7 L24 16 L22 16 L22 22 L20 22 L20 16 L18 16 Z" fill="#0f172a" />
                    <rect x="16" y="11" width="3" height="5" fill="#b45309" />
                    <path d="M17 11 Q17.5 8 18 11" stroke="#0f172a" strokeWidth="0.8" fill="none" />
                  </g>

                  <g transform="translate(-10, 90)">
                    <path d="M0 130 C20 130, 40 120, 50 100 C60 80, 60 45, 30 35 C10 32, -10 35, -25 35 Z" fill="#0d6e5f" />
                    <circle cx="35" cy="130" r="18" fill="#1e293b" />
                    <circle cx="35" cy="130" r="8" fill="#cbd5e1" />
                    <path d="M45 45 C70 45, 100 70, 100 110" stroke="#108573" strokeWidth="3" fill="none" strokeLinecap="round" />
                    <path d="M56 85 C56 80, 52 75, 48 75 Z" fill="#ef4444" />

                    <rect x="0" y="80" width="16" height="22" fill="#d97706" rx="1" />
                    <rect x="3" y="64" width="5" height="18" rx="2" fill="#f59e0b" transform="rotate(-15 3 64)" />
                    <line x1="2" y1="72" x2="5" y2="69" stroke="#b45309" strokeWidth="0.8" />
                    <line x1="3" y1="76" x2="6" y2="73" stroke="#b45309" strokeWidth="0.8" />
                    <path d="M12 75 Q14 67 13 62" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round" />
                    <path d="M14 77 Q17 70 19 66" stroke="#22c55e" strokeWidth="1.5" fill="none" strokeLinecap="round" />

                    <rect x="12" y="86" width="18" height="22" fill="#b45309" rx="1" stroke="#0d6e5f" strokeWidth="0.4" />
                    <path d="M15 80 Q13 70 11 65 M18 80 Q18 72 17 67" stroke="#4ade80" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    <circle cx="26" cy="85" r="3.5" fill="#f97316" />
                    <ellipse cx="21" cy="84" rx="3.5" ry="2.5" fill="#fbbf24" />
                  </g>

                  <g transform="translate(340, 185)">
                    <path d="M0 10 Q4 0 8 10 M4 10 Q8 2 12 10 M-4 10 Q0 -2 4 10" stroke="#0d6e5f" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  </g>
                </svg>
              </div>
            </div>
          )}

          {/* STEP 3: SETTLE UP SCREEN */}
          {tutorialStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }} className="animate-fade-in">
              <div style={{ textAlign: 'left' }}>
                <h1 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '36px',
                  fontWeight: 700,
                  color: '#2e333d',
                  lineHeight: '1.15',
                  letterSpacing: '-0.5px',
                  marginTop: '10px'
                }}>
                  Settle up
                </h1>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '18px',
                  color: '#4e5664',
                  marginTop: '12px',
                  lineHeight: '1.3'
                }}>
                  Pay your friends back any time
                </p>
              </div>

              {/* Table SVG area with overlay card */}
              <div style={{ width: 'calc(100% + 48px)', height: '28vh', minHeight: '260px', margin: '20px -24px -16px -24px', position: 'relative', zIndex: 1 }}>
                <svg viewBox="0 0 400 240" width="100%" height="100%" preserveAspectRatio="xMidYMax slice" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block', zIndex: 1 }}>
                  {/* Background is transparent to show page gradient */}

                  <g opacity="0.12">
                    <rect x="250" y="30" width="45" height="35" rx="4" fill="#000000" transform="rotate(25 250 30)" />
                    <rect x="40" y="110" width="35" height="45" rx="4" fill="#000000" transform="rotate(-35 40 110)" />
                  </g>

                  <circle cx="150" cy="130" r="90" fill="#b0d6eb" />
                  <circle cx="150" cy="130" r="87" fill="#c3e4f6" />

                  <g transform="translate(230, 50) rotate(35)">
                    <rect x="0" y="0" width="35" height="6" rx="2" fill="#8cb7cf" />
                    <line x1="6" y1="6" x2="6" y2="18" stroke="#8cb7cf" strokeWidth="3" />
                    <line x1="29" y1="6" x2="29" y2="18" stroke="#8cb7cf" strokeWidth="3" />
                  </g>
                  <g transform="translate(35, 100) rotate(-55)">
                    <rect x="0" y="0" width="35" height="6" rx="2" fill="#8cb7cf" />
                    <line x1="6" y1="6" x2="6" y2="18" stroke="#8cb7cf" strokeWidth="3" />
                    <line x1="29" y1="6" x2="29" y2="18" stroke="#8cb7cf" strokeWidth="3" />
                  </g>

                  <circle cx="90" cy="90" r="22" fill="#ffffff" />
                  <circle cx="90" cy="90" r="18" fill="#f8fafc" />
                  
                  <circle cx="205" cy="165" r="22" fill="#ffffff" />
                  <circle cx="205" cy="165" r="18" fill="#f8fafc" />
                  
                  <circle cx="180" cy="95" r="25" fill="#ffffff" />
                  <circle cx="180" cy="95" r="21" fill="#f1f5f9" />

                  <g transform="translate(180, 95)">
                    <path d="M 0 0 L 14 -14 A 20 20 0 1 1 -14 -14 Z" fill="#d97706" />
                    <path d="M 0 0 L 12 -12 A 17 17 0 1 1 -12 -12 Z" fill="#fcd34d" />
                    <circle cx="5" cy="10" r="2.5" fill="#ef4444" />
                    <circle cx="-8" cy="6" r="2.5" fill="#ef4444" />
                    <circle cx="-3" cy="-7" r="2.5" fill="#ef4444" />
                    <circle cx="8" cy="-5" r="2.5" fill="#ef4444" />
                    <circle cx="-10" cy="-4" r="2" fill="#ef4444" />
                  </g>

                  <circle cx="94" cy="88" r="1" fill="#d97706" />
                  <circle cx="85" cy="94" r="1.5" fill="#ef4444" />
                  <circle cx="208" cy="160" r="1" fill="#d97706" />
                  <circle cx="200" cy="168" r="1.2" fill="#d97706" />

                  <circle cx="98" cy="145" r="11" fill="#ffffff" />
                  <circle cx="98" cy="145" r="8" fill="#ef4444" />
                  <circle cx="98" cy="145" r="6" fill="#991b1b" />
                  
                  <circle cx="142" cy="68" r="11" fill="#ffffff" />
                  <circle cx="142" cy="68" r="8" fill="#ef4444" />
                  <circle cx="142" cy="68" r="6" fill="#991b1b" />
                  
                  <circle cx="222" cy="120" r="11" fill="#ffffff" />
                  <circle cx="222" cy="120" r="9" fill="#e2e8f0" />
                </svg>

                {/* Settle Up Overlay Card */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '20px',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
                  padding: '16px',
                  width: '210px',
                  position: 'absolute',
                  bottom: '10px',
                  right: '34px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  textAlign: 'center',
                  zIndex: 5
                }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#fbcfe8', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', border: '1px solid #f472b6' }}>
                      <span style={{ fontSize: '20px' }}>🐘</span>
                      <span style={{ position: 'absolute', top: '-4px', right: '-4px', fontSize: '10px' }}>🎀</span>
                    </div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: '#991b1b',
                      border: '1px solid #7f1d1d',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: '18px' }}>👤</span>
                    </div>
                  </div>

                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>You paid Brooklyn S.</span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ border: '1px solid #cbd5e1', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#64748b' }}>$</span>
                    </div>
                    <div style={{ flex: 1, borderBottom: '2px solid #108573', paddingBottom: '2px', textAlign: 'left' }}>
                      <span style={{ fontSize: '20px', fontWeight: 600, color: '#2e333d' }}>105.36</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: LET'S GET STARTED */}
          {tutorialStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }} className="animate-fade-in">
              <div style={{ textAlign: 'left', marginTop: '20px' }}>
                {/* Party Popper SVG */}
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '24px' }}>
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 52 L28 44 L20 28 Z" fill="#108573" />
                    <path d="M12 52 L20 48 L16 38 Z" fill="#0d6e5f" />
                    <path d="M30 38 Q42 30 50 18" stroke="#108573" strokeWidth="2" strokeLinecap="round" strokeDasharray="1 3" />
                    <path d="M26 30 Q38 18 40 8" stroke="#ff652f" strokeWidth="2" strokeLinecap="round" strokeDasharray="1 3" />
                    <path d="M34 44 Q50 42 54 30" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeDasharray="1 3" />
                    <circle cx="48" cy="12" r="3" fill="#ff652f" />
                    <circle cx="38" cy="24" r="2.5" fill="#f59e0b" />
                    <circle cx="56" cy="28" r="3" fill="#108573" />
                    <circle cx="42" cy="6" r="2" fill="#3b82f6" />
                    <path d="M46 20 Q48 16 52 18" stroke="#3b82f6" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    <path d="M32 15 Q34 10 38 12" stroke="#108573" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  </svg>
                </div>

                <h1 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '36px',
                  fontWeight: 700,
                  color: '#2e333d',
                  lineHeight: '1.15',
                  letterSpacing: '-0.5px'
                }}>
                  Let's get started
                </h1>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '18px',
                  color: '#4e5664',
                  marginTop: '12px',
                  lineHeight: '1.3'
                }}>
                  What would you like to do first?
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                <button 
                  onClick={() => {
                    setGroupName('Group Trip');
                    setShowAddGroup(true);
                    setPage('dashboard');
                  }}
                  className="btn-primary" 
                  style={{
                    backgroundColor: '#108573',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    padding: '16px'
                  }}
                >
                  <span>✈️</span> Add a group trip
                </button>

                <button 
                  onClick={() => {
                    setGroupName('Household');
                    setShowAddGroup(true);
                    setPage('dashboard');
                  }}
                  className="btn-primary" 
                  style={{
                    backgroundColor: '#108573',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    padding: '16px'
                  }}
                >
                  <span>🏠</span> Add your household
                </button>

                <span 
                  onClick={() => setPage('dashboard')}
                  style={{
                    color: '#108573',
                    fontSize: '16px',
                    fontWeight: 600,
                    textAlign: 'center',
                    display: 'block',
                    marginTop: '10px',
                    cursor: 'pointer',
                    textDecoration: 'none'
                  }}
                >
                  Skip setup for now
                </span>
              </div>
            </div>
          )}

          {/* Navigation Dots & Skip Tour Link (only steps 1-3) */}
          {tutorialStep < 4 && (
            <div style={{ 
              position: 'absolute', 
              bottom: '16px', 
              left: 0, 
              right: 0, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              zIndex: 20 
            }}>
              {/* Dots */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <div 
                  onClick={(e) => { e.stopPropagation(); setTutorialStep(1); }} 
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: tutorialStep === 1 ? '#1cc29f' : '#bce8e1',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease'
                  }} 
                />
                <div 
                  onClick={(e) => { e.stopPropagation(); setTutorialStep(2); }} 
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: tutorialStep === 2 ? '#1cc29f' : '#bce8e1',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease'
                  }} 
                />
                <div 
                  onClick={(e) => { e.stopPropagation(); setTutorialStep(3); }} 
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: tutorialStep === 3 ? '#1cc29f' : '#bce8e1',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease'
                  }} 
                />
              </div>

              {/* Skip Tour Link */}
              <span 
                onClick={(e) => { e.stopPropagation(); setTutorialStep(4); }}
                style={{
                  color: '#108573',
                  fontSize: '15px',
                  fontWeight: 600,
                  marginTop: '16px',
                  cursor: 'pointer',
                  display: 'block',
                  textDecoration: 'none'
                }}
              >
                Skip tour
              </span>
            </div>
          )}
        </div>
      )}

      {/* 5. DASHBOARD PAGE */}
      {page === 'dashboard' && user && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#18191b',
          position: 'relative',
          height: '100%',
          overflow: 'hidden'
        }} className="animate-fade-in">
          
          {/* Scrollable Content Container */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 20px 80px 20px',
            display: 'flex',
            flexDirection: 'column'
          }}>
          
          {/* Header Actions (Search & Add Group / Friend) */}
          {(activeTab === 'groups' || activeTab === 'friends') && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
              {isFriendSearchActive && activeTab === 'friends' && (
                <input 
                  type="text" 
                  placeholder="Search friends..." 
                  value={friendSearchQuery}
                  onChange={(e) => setFriendSearchQuery(e.target.value)}
                  style={{
                    backgroundColor: '#22252a',
                    border: '1px solid #3c434a',
                    borderRadius: '10px',
                    color: 'white',
                    padding: '6px 12px',
                    fontSize: '14px',
                    flex: 1,
                    outline: 'none'
                  }}
                />
              )}
              
              {/* Search Icon */}
              <svg 
                width="22" 
                height="22" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#cbd5e1" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  if (activeTab === 'friends') {
                    setIsFriendSearchActive(!isFriendSearchActive);
                    if (isFriendSearchActive) setFriendSearchQuery('');
                  }
                }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              
              {/* Add Icon (Add Friend or Add Group based on tab) */}
              {activeTab === 'friends' ? (
                /* Add Friend Icon */
                <svg 
                  width="22" 
                  height="22" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="#cbd5e1" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  style={{ cursor: 'pointer' }}
                  onClick={handleOpenAddFriend}
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="17" y1="11" x2="23" y2="11" />
                </svg>
              ) : (
                /* Add Group Icon */
                <svg 
                  width="22" 
                  height="22" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="#cbd5e1" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  style={{ cursor: 'pointer' }} 
                  onClick={() => setShowAddGroup(true)}
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="17" y1="11" x2="23" y2="11" />
                </svg>
              )}
            </div>
          )}

          {/* Status Header Bar */}
          {(activeTab === 'groups' || activeTab === 'friends') && !(activeTab === 'groups' && groups.length === 0) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600, color: 'white', margin: 0 }}>
                {dashboardBalances.netBalance === 0 ? "You are all settled up!" :
                 dashboardBalances.netBalance > 0 ? `Overall, you are owed $${dashboardBalances.netBalance.toFixed(2)}` :
                 `Overall, you owe $${Math.abs(dashboardBalances.netBalance).toFixed(2)}`}
              </h2>
              {/* Sliders filter icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }}>
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" />
                <line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
            </div>
          )}

          {/* Main Tab Content */}
          {activeTab === 'groups' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '20px 20px 40px 20px', gap: '4px' }} className="animate-fade-in">
              {groups.length === 0 ? (
                /* Empty state matching the user's screenshot exactly */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, textAlign: 'center' }}>
                  {/* Dynamic Welcome text aligned at the top */}
                  <h3 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '22px',
                    fontWeight: 500,
                    color: 'white',
                    marginBottom: '36px',
                    marginTop: '20px',
                    textAlign: 'center',
                    width: '100%',
                    letterSpacing: '-0.3px'
                  }}>
                    Welcome to Splitwise, {user.name ? user.name.split(' ')[0] : 'Sonia'}!
                  </h3>

                  {/* Handshake Illustration (Direct Original Image Asset) */}
                  <div style={{ position: 'relative', width: '210px', height: '210px', marginBottom: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img 
                      src="/handshake.png" 
                      alt="Welcome to Splitwise" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'contain',
                        display: 'block'
                      }} 
                    />
                  </div>

                  {/* Empty state text */}
                  <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '15px',
                    color: '#94a3b8',
                    lineHeight: '1.45',
                    maxWidth: '280px',
                    margin: '0 auto 28px auto',
                    textAlign: 'center',
                    fontWeight: 400
                  }}>
                    Splitwise groups you create or are added to will show here.
                  </p>

                  {/* Outlined Start a New Group Button */}
                  <button 
                    onClick={() => setShowAddGroup(true)}
                    style={{
                      background: 'transparent',
                      border: '1.2px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '8px',
                      padding: '12px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      outline: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#1cc29f';
                      e.currentTarget.style.backgroundColor = 'rgba(28, 194, 159, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255, 255, 255, 0.9)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="8.5" cy="7" r="4" />
                      <line x1="20" y1="8" x2="20" y2="14" />
                      <line x1="17" y1="11" x2="23" y2="11" />
                    </svg>
                    <span style={{ color: 'white', fontSize: '15px', fontWeight: 500 }}>Start a new group</span>
                  </button>
                </div>
              ) : (
                /* Groups List */
                <>
                  {groups.map(g => {
                    const status = g.currentUserStatus;
                    const type = status ? status.type : 'settled';
                    const amount = status ? status.amount : 0;
                    
                    return (
                      <div 
                        key={g._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px 0',
                          cursor: 'pointer',
                          borderBottom: '1.5px solid #22252a'
                        }}
                        onClick={() => {
                          setSelectedGroupId(g._id);
                          setPage('group-details');
                        }}
                      >
                        {getGroupIcon(g.name)}
                        
                        <div style={{ flex: 1, marginLeft: '16px', display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                          <span style={{ fontSize: '16px', fontWeight: 600, color: 'white' }}>{g.name}</span>
                          <span style={{ 
                            fontSize: '14px', 
                            color: type === 'owed' ? '#1cc29f' : type === 'owe' ? '#ff652f' : '#94a3b8',
                            marginTop: '2px'
                          }}>
                            {type === 'owed' ? `you are owed $${amount.toFixed(2)}` : 
                             type === 'owe' ? `you owe $${amount.toFixed(2)}` : 'no expenses'}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Start a New Group Button */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px', marginBottom: '24px' }}>
                    <button 
                      onClick={() => setShowAddGroup(true)}
                      style={{
                        background: 'transparent',
                        border: '1.5px solid #1cc29f',
                        borderRadius: '8px',
                        color: '#1cc29f',
                        padding: '10px 20px',
                        fontSize: '15px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1cc29f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="8.5" cy="7" r="4" />
                        <line x1="20" y1="8" x2="20" y2="14" />
                        <line x1="17" y1="11" x2="23" y2="11" />
                      </svg>
                      Start a new group
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'friends' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }} className="animate-fade-in">
              {friends.length === 0 ? (
                /* Empty state matching the user's screenshot exactly */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px 20px', textAlign: 'center' }}>
                  {/* Handshake Illustration (Direct Original Image Asset placed in center) */}
                  <div style={{ position: 'relative', width: '210px', height: '210px', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img 
                      src="/handshake.png" 
                      alt="Welcome to Splitwise" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'contain',
                        display: 'block'
                      }} 
                    />
                  </div>

                  {/* Empty state text */}
                  <h3 style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '18px',
                    fontWeight: 400,
                    color: '#9aa0a6',
                    marginTop: '0px',
                    marginBottom: '24px',
                    textAlign: 'center',
                    width: '100%'
                  }}>
                    No friends to show.
                  </h3>
                  
                  {/* Bordered Add Friends Button (Teal Outline) */}
                  <button 
                    onClick={handleOpenAddFriend}
                    style={{
                      border: '1.2px solid rgba(28, 194, 159, 0.5)',
                      background: 'transparent',
                      borderRadius: '8px',
                      color: '#bce8e1',
                      padding: '11px 24px',
                      fontSize: '15px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      outline: 'none',
                      transition: 'all 0.25s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#1cc29f';
                      e.currentTarget.style.backgroundColor = 'rgba(28, 194, 159, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(28, 194, 159, 0.5)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1cc29f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="8.5" cy="7" r="4" />
                      <line x1="20" y1="8" x2="20" y2="14" />
                      <line x1="17" y1="11" x2="23" y2="11" />
                    </svg>
                    Add more friends
                  </button>
                </div>
              ) : (
                /* Friends List */
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {friends
                      .filter(f => f.name.toLowerCase().includes(friendSearchQuery.toLowerCase()))
                      .map(f => {
                        const balance = f.balance || { type: 'settled', netBalance: 0, text: 'no expenses' };
                        return (
                          <div 
                            key={f._id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '14px 0',
                              borderBottom: '1.5px solid #22252a',
                              cursor: 'pointer'
                            }}
                          >
                            {/* Envelope Circle Icon */}
                            <div style={{
                              backgroundColor: '#2d3035',
                              width: '44px',
                              height: '44px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '16px',
                              flexShrink: 0
                            }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a0aec0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                              </svg>
                            </div>
                            
                            {/* Friend Info */}
                            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '16px', fontWeight: 500, color: 'white' }}>{f.name}</span>
                              <span style={{ 
                                fontSize: '13px', 
                                color: balance.type === 'owed' ? '#1cc29f' : balance.type === 'owe' ? '#ff652f' : '#cbd5e1' 
                              }}>
                                {balance.text}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  
                  {/* Bordered Add Friends Button (Teal Outline) */}
                  <button 
                    onClick={handleOpenAddFriend}
                    style={{
                      border: '1.5px solid #1cc29f',
                      background: 'transparent',
                      borderRadius: '8px',
                      color: '#bce8e1',
                      padding: '10px 24px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      margin: '24px auto',
                      outline: 'none'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1cc29f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="8.5" cy="7" r="4" />
                      <line x1="20" y1="8" x2="20" y2="14" />
                      <line x1="17" y1="11" x2="23" y2="11" />
                    </svg>
                    Add more friends
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '10px 0 20px 0', backgroundColor: '#18191b' }} className="animate-fade-in">
              {/* Activity Header with Title and Search */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '0 20px' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, color: 'white', margin: 0 }}>
                  Activity
                </h1>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }}>
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>

              {/* Activity List */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {groups.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80%', padding: '40px 20px', textAlign: 'center' }}>
                    <span style={{ fontSize: '48px', marginBottom: '16px' }}>📈</span>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'white', marginBottom: '8px' }}>No recent activity</h3>
                    <p style={{ fontSize: '14px', color: '#cbd5e1' }}>All group expenses, settlement records, and edits will appear here.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Sort groups by createdAt (newest first) to simulate real activity */}
                    {[...groups].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).map(g => {
                      const lname = g.name.toLowerCase();
                      const desc = (g.description || '').toLowerCase();
                      
                      let avatarBg = 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'; // default other
                      let categorySvg = (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="8" y1="6" x2="21" y2="6" />
                          <line x1="8" y1="12" x2="21" y2="12" />
                          <line x1="8" y1="18" x2="21" y2="18" />
                          <line x1="3" y1="6" x2="3" y2="6" strokeWidth="3" />
                          <line x1="3" y1="12" x2="3" y2="12" strokeWidth="3" />
                          <line x1="3" y1="18" x2="3" y2="18" strokeWidth="3" />
                        </svg>
                      );
                      
                      if (lname.includes('manali') || lname.includes('jaish') || lname.includes('beach') || lname.includes('trip') || lname.includes('travel') || lname.includes('vacation') || desc.includes('trip')) {
                        avatarBg = 'linear-gradient(135deg, #a8203c 0%, #5d0f1e 100%)'; // Crimson Red gradient
                        categorySvg = (
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3.5S19 4 17.5 5.5L14 9 5.8 7.2 4.2 8.8l8 4.7-4 4-2.8-.7L4 18.2l3.5 1.3 1.3 3.5 1.4-1.4-.7-2.8 4-4 4.7 8 1.6-1.6z" />
                          </svg>
                        );
                      } else if (lname.includes('house') || lname.includes('home') || lname.includes('room') || lname.includes('rent') || lname.includes('flat') || lname.includes('apartment') || lname.includes('bill') || desc.includes('home')) {
                        avatarBg = 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'; // Orange gradient
                        categorySvg = (
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                          </svg>
                        );
                      } else if (lname.includes('couple') || lname.includes('partner') || lname.includes('love') || lname.includes('relationship') || desc.includes('couple')) {
                        avatarBg = 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)'; // Purple gradient
                        categorySvg = (
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                        );
                      }
                      
                      const formatActivityTime = (dateVal) => {
                        if (!dateVal) return "Today, 5:05 pm";
                        const d = new Date(dateVal);
                        if (isNaN(d.getTime())) return "Today, 5:05 pm";
                        const today = new Date();
                        let dayStr = '';
                        if (d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()) {
                          dayStr = "Today";
                        } else if (d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate() - 1) {
                          dayStr = "Yesterday";
                        } else {
                          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                          dayStr = `${months[d.getMonth()]} ${d.getDate()}`;
                        }
                        
                        let hours = d.getHours();
                        const minutes = d.getMinutes().toString().padStart(2, '0');
                        const ampm = hours >= 12 ? 'pm' : 'am';
                        hours = hours % 12;
                        hours = hours ? hours : 12;
                        return `${dayStr}, ${hours}:${minutes} ${ampm}`;
                      };

                      return (
                        <div 
                          key={g._id}
                          onClick={() => {
                            setSelectedGroupId(g._id);
                            fetchGroupDetails(g._id);
                            setPage('group-details');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '14px 20px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                            cursor: 'pointer',
                            userSelect: 'none'
                          }}
                        >
                          {/* Left Icon with Overlapping User Avatar */}
                          <div style={{ position: 'relative', width: '44px', height: '44px', flexShrink: 0 }}>
                            <div style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '10px',
                              background: avatarBg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden'
                            }}>
                              {categorySvg}
                            </div>

                            {/* Small Overlapping Circle Avatar */}
                            <div style={{
                              position: 'absolute',
                              bottom: '-4px',
                              right: '-4px',
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              border: '2px solid #18191b',
                              overflow: 'hidden',
                              backgroundColor: '#202124',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <img 
                                src={user.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.name}`} 
                                alt="User" 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                          </div>

                          {/* Right Description Text Block */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                            <span style={{ color: 'white', fontSize: '15px', lineHeight: '1.4' }}>
                              <strong>You</strong> created the group <strong style={{ fontWeight: 600 }}>“{g.name}”</strong>.
                            </span>
                            <span style={{ fontSize: '12.5px', color: '#9aa0a6', marginTop: '3px' }}>
                              {formatActivityTime(g.createdAt)}
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

          {activeTab === 'account' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '10px 0 20px 0' }} className="animate-fade-in">
              {/* Account Header with Title and Search */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '0 20px' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, color: 'white', margin: 0 }}>
                  Account
                </h1>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }}>
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>

              {/* User Profile Card */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', padding: '0 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {/* Circle Avatar with Peach/Orange Split Backdrop & Camera Overlay */}
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #f97316 0%, #ffe1d5 100%)',
                      border: '1.5px solid rgba(255,255,255,0.1)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <img 
                        src={user.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.name}`} 
                        alt="Avatar" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    {/* Camera Badge Overlay */}
                    <div style={{
                      position: 'absolute',
                      bottom: '-2px',
                      right: '-2px',
                      backgroundColor: '#374151',
                      border: '1.5px solid #18191b',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                    }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                    </div>
                  </div>

                  {/* Profile info */}
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'white', margin: '0 0 2px 0' }}>
                      {user.name}
                    </h3>
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                      {user.email}
                    </span>
                  </div>
                </div>

                {/* Edit Link */}
                <span 
                  onClick={() => {
                    setEditName(user.name || '');
                    setEditEmail(user.email || '');
                    setEditAvatarUrl(user.avatarUrl || '');
                    setShowEditProfile(true);
                  }}
                  style={{ fontSize: '14px', fontWeight: 600, color: '#1cc29f', cursor: 'pointer' }}
                >
                  Edit
                </span>
              </div>

              {/* Splitwise Pro Purple Banner */}
              <div style={{ padding: '0 20px', marginBottom: '24px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #5b21b6 0%, #3b0764 100%)',
                  borderRadius: '16px',
                  padding: '24px 20px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 10px 25px rgba(59, 7, 100, 0.25)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  {/* Pro Diamond Icon */}
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 2px 8px rgba(255,255,255,0.4))' }}>
                    <path d="M6 3h12l4 6-10 13L2 9z" />
                    <path d="M11 3 8 9l4 13 4-13-3-6" />
                    <path d="M2 9h20" />
                  </svg>
                  
                  <span style={{ fontSize: '15px', color: '#f3e8ff', fontWeight: 500 }}>
                    Do more with <strong style={{ color: 'white' }}>Splitwise Pro</strong>.
                  </span>

                  <button 
                    onClick={() => setShowProCheckout(true)}
                    style={{
                      backgroundColor: '#7c3aed',
                      border: 'none',
                      color: 'white',
                      borderRadius: '24px',
                      padding: '12px 28px',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(124, 58, 237, 0.4)',
                      transition: 'transform 0.2s ease',
                      outline: 'none',
                      marginTop: '6px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    Get Splitwise Pro
                  </button>
                </div>
              </div>

              {/* Main Lists Area */}
              <div style={{ display: 'flex', flexDirection: 'column', padding: '0 20px', gap: '8px' }}>
                {/* Scan code */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #22252a', cursor: 'pointer' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '16px' }}>
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                  <span style={{ fontSize: '16px', color: '#cbd5e1', fontWeight: 500 }}>Scan code</span>
                </div>

                {/* Splitwise Pro list item */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #22252a', cursor: 'pointer' }} onClick={() => setShowProCheckout(true)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '16px' }}>
                    <path d="M6 3h12l4 6-10 13L2 9z" />
                    <path d="M11 3 8 9l4 13 4-13-3-6" />
                    <path d="M2 9h20" />
                  </svg>
                  <span style={{ fontSize: '16px', color: '#cbd5e1', fontWeight: 500 }}>Splitwise Pro</span>
                </div>

                {/* PREFERENCES SECTION */}
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '20px', marginBottom: '8px' }}>
                  Preferences
                </span>

                <div style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #22252a', cursor: 'pointer' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '16px' }}>
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <span style={{ fontSize: '16px', color: '#cbd5e1', fontWeight: 500 }}>Email settings</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #22252a', cursor: 'pointer' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '16px' }}>
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  <span style={{ fontSize: '16px', color: '#cbd5e1', fontWeight: 500 }}>Device and push notification settings</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #22252a', cursor: 'pointer' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '16px' }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span style={{ fontSize: '16px', color: '#cbd5e1', fontWeight: 500 }}>Security</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #22252a', cursor: 'pointer' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '16px' }}>
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 14.7255 3.09032 17.1962 4.85857 19C5.34776 19.5 5.166 20.5 4.5 21C4 21.3 3.5 21.5 3 21.5C2 21.5 1 20 1 18.5C1 12 6 6 12 6C16.5 6 20 9.5 20 13.5C20 16 18 18 15.5 18C14.5 18 13.5 17.5 13 17C12.5 16.5 11.5 16.5 11 17C10.5 17.5 10.5 18.5 11 19C11.5 19.5 12 20.5 12 22Z" />
                    <circle cx="7.5" cy="10.5" r="1.5" fill="#cbd5e1" />
                    <circle cx="11.5" cy="7.5" r="1.5" fill="#cbd5e1" />
                    <circle cx="16.5" cy="9.5" r="1.5" fill="#cbd5e1" />
                  </svg>
                  <span style={{ fontSize: '16px', color: '#cbd5e1', fontWeight: 500 }}>Appearance</span>
                </div>

                {/* FEEDBACK SECTION */}
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '20px', marginBottom: '8px' }}>
                  Feedback
                </span>

                <div style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #22252a', cursor: 'pointer' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '16px' }}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span style={{ fontSize: '16px', color: '#cbd5e1', fontWeight: 500 }}>Rate Splitwise</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #22252a', cursor: 'pointer' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '16px' }}>
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    <circle cx="12" cy="12" r="1" fill="#cbd5e1" />
                  </svg>
                  <span style={{ fontSize: '16px', color: '#cbd5e1', fontWeight: 500 }}>Contact Splitwise support</span>
                </div>

                {/* Divider Line */}
                <hr style={{ border: 'none', borderTop: '1.5px solid #22252a', margin: '24px 0 12px 0' }} />

                {/* Log out option */}
                <div 
                  onClick={handleLogout}
                  style={{ display: 'flex', alignItems: 'center', padding: '14px 0', cursor: 'pointer' }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1cc29f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '16px' }}>
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span style={{ fontSize: '16px', color: '#1cc29f', fontWeight: 600 }}>Log out</span>
                </div>

                {/* Centered Footer Info */}
                <div style={{ textAlign: 'center', marginTop: '30px', color: '#718096', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'var(--font-body)' }}>
                  <span>Made with ✨ in Providence, RI, USA</span>
                  <span>Copyright © 2026 Splitwise, Inc.</span>
                  <span>P.S. Bunnies!</span>
                  
                  <span 
                    onClick={() => {
                      setPage('privacy');
                      setTermsBackPage('dashboard');
                    }}
                    style={{ color: '#1cc29f', cursor: 'pointer', textDecoration: 'underline', fontWeight: 500 }}
                  >
                    Privacy Policy
                  </span>
                  
                  <span style={{ fontSize: '11px', marginTop: '2px' }}>v26.5.3/933</span>
                </div>

                {/* Geometric Polygon Mountains & Cute Peak-a-boo Bunny Footer */}
                <div style={{ width: 'calc(100% + 40px)', margin: '40px -20px -80px -20px', position: 'relative', overflow: 'hidden' }}>
                  <svg viewBox="0 0 400 120" width="100%" height="80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                    {/* Cute White Bunny Peaking Up */}
                    <g transform="translate(320, 38)">
                      {/* Ears */}
                      <ellipse cx="6" cy="12" rx="3.5" ry="12" fill="#ffffff" transform="rotate(-15 6 12)" />
                      <ellipse cx="6" cy="12" rx="1.5" ry="8" fill="#ffd1d1" transform="rotate(-15 6 12)" />
                      <ellipse cx="18" cy="12" rx="3.5" ry="12" fill="#ffffff" transform="rotate(15 18 12)" />
                      <ellipse cx="18" cy="12" rx="1.5" ry="8" fill="#ffd1d1" transform="rotate(15 18 12)" />
                      {/* Head */}
                      <circle cx="12" cy="24" r="10" fill="#ffffff" />
                      {/* Eyes */}
                      <circle cx="8" cy="22" r="1.2" fill="#3c434a" />
                      <circle cx="16" cy="22" r="1.2" fill="#3c434a" />
                      {/* Nose */}
                      <polygon points="12,25 10.5,24 13.5,24" fill="#ffd1d1" />
                      {/* Cheeks */}
                      <ellipse cx="6.5" cy="25" rx="2" ry="1.2" fill="#ffd1d1" opacity="0.6" />
                      <ellipse cx="17.5" cy="25" rx="2" ry="1.2" fill="#ffd1d1" opacity="0.6" />
                    </g>
                    
                    {/* Geometric Polygon Mountains */}
                    {/* Mountain 1: Teal */}
                    <polygon points="-20,120 40,65 100,120" fill="#0d9488" />
                    {/* Mountain 2: Purple */}
                    <polygon points="60,120 130,50 200,120" fill="#7c3aed" />
                    {/* Mountain 3: Dark Grey */}
                    <polygon points="150,120 220,75 290,120" fill="#374151" />
                    {/* Mountain 4: Soft Peach */}
                    <polygon points="240,120 310,60 380,120" fill="#f97316" />
                    {/* Mountain 5: Light Green */}
                    <polygon points="310,120 370,70 430,120" fill="#10b981" />
                    
                    {/* Overlay overlapping mountains for beautiful complexity */}
                    <polygon points="15,120 80,72 145,120" fill="#14b8a6" opacity="0.8" />
                    <polygon points="105,120 170,62 235,120" fill="#8b5cf6" opacity="0.8" />
                    <polygon points="265,120 330,68 395,120" fill="#fb923c" opacity="0.8" />
                  </svg>
                </div>
              </div>
            </div>
          )}
          </div>

          {/* Floating Actions Stack - show on Groups, Friends or Activity tabs */}
          {(activeTab === 'groups' || activeTab === 'friends' || activeTab === 'activity') && 
           !(activeTab === 'friends' && friends.length === 0) && 
           !(activeTab === 'groups' && groups.length === 0) && (
            <div style={{
              position: 'absolute',
              bottom: '90px',
              right: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '10px',
              zIndex: 50
            }}>
              {/* 1. Scan Button */}
              <div 
                onClick={() => alert("Initializing Splitwise Receipt Scan OCR... (Pro Simulation)")}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#2a2c2f',
                  border: '1.2px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: '20px',
                  padding: '8px 18px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                Scan
              </div>

              {/* 2. Add Expense Button */}
              <div 
                onClick={handleGeneralAddExpenseClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#1cc29f',
                  borderRadius: '24px',
                  padding: '12px 24px',
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.35)',
                  transition: 'all 0.2s ease'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="9" x2="15" y2="9" />
                  <line x1="9" y1="13" x2="15" y2="13" />
                  <line x1="9" y1="17" x2="15" y2="17" />
                </svg>
                Add expense
              </div>
            </div>
          )}

          <div className="bottom-nav" style={{ backgroundColor: '#18191b', borderTop: '1.5px solid #22252a', height: '70px' }}>
            <button className={`nav-item ${activeTab === 'groups' ? 'active' : ''}`} style={{ color: activeTab === 'groups' ? '#1cc29f' : '#8e949a' }} onClick={() => setActiveTab('groups')}>
              <Users />
              <span>Groups</span>
            </button>
            <button className={`nav-item ${activeTab === 'friends' ? 'active' : ''}`} style={{ color: activeTab === 'friends' ? '#1cc29f' : '#8e949a' }} onClick={() => setActiveTab('friends')}>
              <UserIcon />
              <span>Friends</span>
            </button>
            <button className={`nav-item ${activeTab === 'activity' ? 'active' : ''}`} style={{ color: activeTab === 'activity' ? '#1cc29f' : '#8e949a' }} onClick={() => setActiveTab('activity')}>
              <ImageIcon />
              <span>Activity</span>
            </button>
            <button className={`nav-item ${activeTab === 'account' ? 'active' : ''}`} style={{ color: activeTab === 'account' ? '#1cc29f' : '#8e949a' }} onClick={() => setActiveTab('account')}>
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: activeTab === 'account' ? '1.5px solid #1cc29f' : '1.5px solid #8e949a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '2px',
                transition: 'all 0.2s ease'
              }}>
                <img 
                  src={user?.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.name}`} 
                  alt="Account" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <span>Account</span>
            </button>
          </div>
        </div>
      )}
      {page === 'group-details' && selectedGroupDetails && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#18191b',
          height: '100%',
          overflow: 'hidden',
          position: 'relative'
        }} className="animate-slide-in">
          
          {/* Crimson Header Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #7c1a2e 0%, #4c0717 100%)',
            padding: '20px 20px 24px 20px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '180px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            {/* Tilted Plane Watermark Outline SVG */}
            <svg width="220" height="220" viewBox="0 0 24 24" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.8" style={{
              position: 'absolute',
              right: '-30px',
              bottom: '-30px',
              transform: 'rotate(-25deg)',
              pointerEvents: 'none'
            }}>
              <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3.5S19 4 17.5 5.5L14 9 5.8 7.2 4.2 8.8l8 4.7-4 4-2.8-.7L4 18.2l3.5 1.3 1.3 3.5 1.4-1.4-.7-2.8 4-4 4.7 8 1.6-1.6z" />
            </svg>

            {/* Top Navigation Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
              {/* Back Arrow */}
              <div 
                onClick={() => {
                  setSelectedGroupId(null);
                  setPage('dashboard');
                }}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={20} color="white" />
              </div>

              {/* Settings Cog */}
              <div 
                onClick={() => alert("Group Settings coming soon in premium v2! (Success)")}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Settings size={20} color="white" />
              </div>
            </div>

            {/* Group Title and Dates */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '24px', zIndex: 10 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, color: 'white', margin: 0 }}>
                {selectedGroupDetails.group.name}
              </h3>
              
              {/* Jun 1 - 16 Date Range Pill */}
              {(() => {
                const getGroupDatesLabel = (group) => {
                  if (!group) return null;
                  const desc = group.description || '';
                  if (desc.includes('•')) {
                    return desc.split('•')[1].trim();
                  }
                  if (group.name.toLowerCase() === 'manali') {
                    return "Jun 1 - 16";
                  }
                  return null;
                };

                const label = getGroupDatesLabel(selectedGroupDetails.group);
                if (!label) return null;

                return (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    padding: '6px 14px',
                    borderRadius: '16px',
                    marginTop: '10px'
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span style={{ fontSize: '13px', color: 'white', fontWeight: 500 }}>
                      {label}
                    </span>
                  </div>
                );
              })()}
            </div>

          </div>

          {/* Horizontally Scrollable Action/Tab Bar */}
          <div style={{
            display: 'flex',
            gap: '10px',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            padding: '14px 20px',
            backgroundColor: '#18191b',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }} className="hide-scrollbar">
            
            {/* 1. Settle Up */}
            <button 
              onClick={() => {
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
              style={{
                borderRadius: '20px',
                border: '1.2px solid rgba(255, 255, 255, 0.22)',
                padding: '6px 14px',
                fontSize: '13.5px',
                color: 'white',
                fontWeight: '500',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                flexShrink: 0
              }}
            >
              Settle up
            </button>

            {/* 2. Charts */}
            <button 
              onClick={() => setShowProCheckout(true)}
              style={{
                borderRadius: '20px',
                border: '1.2px solid rgba(255, 255, 255, 0.22)',
                padding: '6px 14px',
                fontSize: '13.5px',
                color: 'white',
                fontWeight: '500',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0
              }}
            >
              <span style={{ fontSize: '12px' }}>💎</span> Charts
            </button>

            {/* 3. Balances */}
            <button 
              onClick={() => alert("Balances Breakdown: " + (selectedGroupDetails.netDebts.length === 0 ? "Everyone is settled up!" : `${selectedGroupDetails.netDebts.length} outstanding debt records`))}
              style={{
                borderRadius: '20px',
                border: '1.2px solid rgba(255, 255, 255, 0.22)',
                padding: '6px 14px',
                fontSize: '13.5px',
                color: 'white',
                fontWeight: '500',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                flexShrink: 0
              }}
            >
              Balances
            </button>

            {/* 4. Totals */}
            <button 
              onClick={() => alert("Total Transactions: " + expenses.length)}
              style={{
                borderRadius: '20px',
                border: '1.2px solid rgba(255, 255, 255, 0.22)',
                padding: '6px 14px',
                fontSize: '13.5px',
                color: 'white',
                fontWeight: '500',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                flexShrink: 0
              }}
            >
              Totals
            </button>

            {/* 5. Whiteboard */}
            <button 
              onClick={() => alert("Group Whiteboard coming in next version! (Premium Feature)")}
              style={{
                borderRadius: '20px',
                border: '1.2px solid rgba(255, 255, 255, 0.22)',
                padding: '6px 14px',
                fontSize: '13.5px',
                color: 'white',
                fontWeight: '500',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                flexShrink: 0
              }}
            >
              Whiteboard
            </button>

            {/* 6. Export */}
            <button 
              onClick={() => alert("Downloading ledger transactions... (Success)")}
              style={{
                borderRadius: '20px',
                border: '1.2px solid rgba(255, 255, 255, 0.22)',
                padding: '6px 14px',
                fontSize: '13.5px',
                color: 'white',
                fontWeight: '500',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                flexShrink: 0
              }}
            >
              Export
            </button>
          </div>

          {/* Group Content Pane */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 80px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Status Balance Sub-Header */}
            {selectedGroupDetails.currentUserStatus.amount > 0 && (
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '12px',
                padding: '12px 16px',
                borderLeft: selectedGroupDetails.currentUserStatus.type === 'owed' ? '4px solid #1cc29f' : '4px solid #ff652f',
                color: 'white',
                fontSize: '13px',
                fontWeight: 600,
                textAlign: 'left'
              }}>
                {selectedGroupDetails.currentUserStatus.text.toUpperCase()}
              </div>
            )}

            {/* Net Balances Summary */}
            {selectedGroupDetails.netDebts.length > 0 && (
              <div className="glass-card" style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#202124', border: '1px solid rgba(255, 255, 255, 0.05)', color: 'white' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.5)', marginBottom: '10px', textAlign: 'left' }}>
                  Balances Breakdown
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedGroupDetails.netDebts.filter(d => d && d.from && d.to).map((d, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13.5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: 'white' }}>{d.from.name}</span>
                        <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>owes</span>
                        <span style={{ fontWeight: 600, color: 'white' }}>{d.to.name}</span>
                      </div>
                      <span style={{ fontWeight: 700, color: '#ff652f' }}>
                        ${d.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transaction Log Section */}
            {expenses.length > 0 || settlements.length > 0 ? (
              <>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginTop: '8px', textAlign: 'left' }}>
                  Transaction Log
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Show Settlements first, then Expenses */}
                  {settlements.map(s => (
                    <div 
                      key={s._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 16px',
                        backgroundColor: '#202124',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px'
                      }}
                    >
                      <div style={{ marginRight: '12px', fontSize: '20px' }}>💸</div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'white', margin: 0 }}>
                          {s.fromUser.name} paid {s.toUser.name}
                        </p>
                        <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '2px', display: 'block' }}>
                          {new Date(s.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: 'white' }}>
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
                      shareColor = '#1cc29f';
                    } else {
                      shareText = myOwedShare > 0 ? `you borrowed $${myOwedShare.toFixed(2)}` : "you didn't split";
                      shareColor = myOwedShare > 0 ? '#ff652f' : 'rgba(255,255,255,0.4)';
                    }

                    return (
                      <div 
                        key={e._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '14px 16px',
                          backgroundColor: '#202124',
                          border: '1px solid rgba(255,255,255,0.05)',
                          borderRadius: '12px'
                        }}
                      >
                        <div style={{ marginRight: '14px', fontSize: '22px' }}>🍔</div>
                        
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <h5 style={{ fontSize: '14px', fontWeight: 700, color: 'white', marginBottom: '2px', marginTop: 0 }}>
                            {e.description}
                          </h5>
                          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                            Paid by {e.paidBy.name} • {new Date(e.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', display: 'block' }}>
                            Total Expense
                          </span>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: 'white', display: 'block' }}>
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
              </>
            ) : (
              /* Custom High-Fidelity Empty Group Card */
              <div style={{
                backgroundColor: '#202124',
                borderRadius: '16px',
                padding: '24px 20px',
                textAlign: 'center',
                marginTop: '10px',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                <p style={{ color: '#e3e3e3', fontSize: '15px', fontWeight: 400, margin: 0 }}>
                  You're the only one here!
                </p>
                
                {/* Button 1: Add group members */}
                <div 
                  onClick={() => setShowAddGroup(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    backgroundColor: '#1cc29f',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '15px',
                    padding: '13px 0',
                    borderRadius: '24px',
                    marginTop: '18px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" />
                    <line x1="17" y1="11" x2="23" y2="11" />
                  </svg>
                  Add group members
                </div>

                {/* Button 2: Share group link */}
                <div 
                  onClick={() => alert("Group invitation link copied to clipboard! (Demo)")}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'transparent',
                    border: '1.2px solid rgba(255, 255, 255, 0.22)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '15px',
                    padding: '13px 0',
                    borderRadius: '24px',
                    marginTop: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Share group link
                </div>
              </div>
            )}
          </div>

          {/* Absolute Floating Action Buttons (Scan & Add Expense) */}
          <div style={{
            position: 'absolute',
            bottom: '24px',
            right: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '10px',
            zIndex: 50
          }}>
            {/* 1. Scan Button */}
            <div 
              onClick={() => alert("Initializing Splitwise Receipt Scan OCR... (Pro Simulation)")}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#2a2c2f',
                border: '1.2px solid rgba(255, 255, 255, 0.18)',
                borderRadius: '20px',
                padding: '8px 18px',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Scan
            </div>

            {/* 2. Add Expense Button */}
            <div 
              onClick={() => {
                setExpensePayer(user._id);
                setExpenseSplits(selectedGroupDetails.group.members.map(m => m._id));
                setShowAddExpense(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#1cc29f',
                borderRadius: '24px',
                padding: '12px 24px',
                color: 'white',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 6px 16px rgba(0,0,0,0.35)',
                transition: 'all 0.2s ease'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="9" y1="9" x2="15" y2="9" />
                <line x1="9" y1="13" x2="15" y2="13" />
                <line x1="9" y1="17" x2="15" y2="17" />
              </svg>
              Add expense
            </div>
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
          backgroundColor: '#18191b',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
          padding: '24px 20px',
          color: 'white',
          height: '100%',
          overflowY: 'auto'
        }} className="animate-fade-in">
          
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            {/* Close Button "X" */}
            <svg 
              onClick={() => setShowAddGroup(false)}
              width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" 
              style={{ cursor: 'pointer' }}
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>

            {/* Title */}
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '19px', fontWeight: 500, color: 'white' }}>
              Create a group
            </span>

            {/* Done Button */}
            <span 
              onClick={() => handleCreateGroup()}
              style={{ 
                color: 'white', 
                fontSize: '17px', 
                fontWeight: 600, 
                cursor: 'pointer'
              }}
            >
              Done
            </span>
          </div>

          <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '28px', flex: 1 }}>
            {/* Group Name Input Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {/* Camera Outline Box */}
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '12px', 
                border: '1.5px solid #2e333d', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: 'transparent',
                cursor: 'pointer'
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2 2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                  {/* Plus inside camera */}
                  <line x1="12" y1="10" x2="12" y2="13" stroke="white" strokeWidth="1.5" />
                  <line x1="10.5" y1="11.5" x2="13.5" y2="11.5" stroke="white" strokeWidth="1.5" />
                </svg>
              </div>

              {/* Text Input */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>
                  Group name
                </span>
                <input 
                  type="text" 
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder=""
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: '2px solid #1cc29f',
                    color: 'white',
                    fontSize: '18px',
                    padding: '6px 0',
                    outline: 'none',
                    width: '100%',
                    fontFamily: 'var(--font-body)'
                  }}
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Type Selector Block */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <span style={{ color: '#cbd5e1', fontSize: '15px', fontWeight: 500, textAlign: 'left' }}>
                Type
              </span>

              {/* Row of 4 square type buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                {/* 1. Trip */}
                <div 
                  onClick={() => setGroupType('trip')}
                  style={{
                    flex: 1,
                    aspectRatio: '1',
                    borderRadius: '12px',
                    border: groupType === 'trip' ? '1px solid #1cc29f' : '1px solid rgba(255, 255, 255, 0.22)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    backgroundColor: groupType === 'trip' ? '#1cc29f' : 'transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3.5S19 4 17.5 5.5L14 9 5.8 7.2 4.2 8.8l8 4.7-4 4-2.8-.7L4 18.2l3.5 1.3 1.3 3.5 1.4-1.4-.7-2.8 4-4 4.7 8 1.6-1.6z" />
                  </svg>
                  <span style={{ color: 'white', fontSize: '13px', fontWeight: 500 }}>Trip</span>
                </div>

                {/* 2. Home */}
                <div 
                  onClick={() => setGroupType('home')}
                  style={{
                    flex: 1,
                    aspectRatio: '1',
                    borderRadius: '12px',
                    border: groupType === 'home' ? '1px solid #1cc29f' : '1px solid rgba(255, 255, 255, 0.22)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    backgroundColor: groupType === 'home' ? '#1cc29f' : 'transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <span style={{ color: 'white', fontSize: '13px', fontWeight: 500 }}>Home</span>
                </div>

                {/* 3. Couple */}
                <div 
                  onClick={() => setGroupType('couple')}
                  style={{
                    flex: 1,
                    aspectRatio: '1',
                    borderRadius: '12px',
                    border: groupType === 'couple' ? '1px solid #1cc29f' : '1px solid rgba(255, 255, 255, 0.22)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    backgroundColor: groupType === 'couple' ? '#1cc29f' : 'transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <span style={{ color: 'white', fontSize: '13px', fontWeight: 500 }}>Couple</span>
                </div>

                {/* 4. Other */}
                <div 
                  onClick={() => setGroupType('other')}
                  style={{
                    flex: 1,
                    aspectRatio: '1',
                    borderRadius: '12px',
                    border: groupType === 'other' ? '1px solid #1cc29f' : '1px solid rgba(255, 255, 255, 0.22)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    backgroundColor: groupType === 'other' ? '#1cc29f' : 'transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3" y2="6" strokeWidth="3" />
                    <line x1="3" y1="12" x2="3" y2="12" strokeWidth="3" />
                    <line x1="3" y1="18" x2="3" y2="18" strokeWidth="3" />
                  </svg>
                  <span style={{ color: 'white', fontSize: '13px', fontWeight: 500 }}>Other</span>
                </div>
              </div>
            </div>

            {/* Dynamic settings based on selected groupType */}
            {groupType === 'trip' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'white', fontSize: '18px', fontWeight: 500 }}>
                    Add trip dates
                  </span>
                  
                  {/* Native Toggle Switch */}
                  <div 
                    onClick={() => setShowTripDates(!showTripDates)}
                    style={{
                      width: '42px',
                      height: '24px',
                      borderRadius: '12px',
                      backgroundColor: showTripDates ? '#1cc29f' : '#2e333d',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '2px'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      position: 'absolute',
                      left: showTripDates ? '20px' : '2px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.4)'
                    }} />
                  </div>
                </div>

                {showTripDates && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade-in">
                    <p style={{ color: '#9aa0a6', fontSize: '14px', margin: 0, lineHeight: '1.5', textAlign: 'left' }}>
                      Splitwise will remind friends to join, add expenses, and settle up.
                    </p>

                    <div style={{ display: 'flex', gap: '24px', width: '100%' }}>
                      {/* Start Date */}
                      <div 
                        onClick={() => {
                          setActiveDatePicker('start');
                          setPickerMonth(tripStartDate ? new Date(tripStartDate).getMonth() : 4);
                          setPickerYear(tripStartDate ? new Date(tripStartDate).getFullYear() : 2026);
                        }}
                        style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', cursor: 'pointer' }}
                      >
                        <span style={{ color: '#9aa0a6', fontSize: '13px', fontWeight: 500, textAlign: 'left' }}>
                          Start
                        </span>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          paddingBottom: '8px',
                          borderBottom: '1.5px solid rgba(255, 255, 255, 0.25)'
                        }}>
                          <span style={{ color: 'white', fontSize: '16px', fontWeight: 400 }}>
                            {formatDate(tripStartDate)}
                          </span>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                        </div>
                      </div>

                      {/* End Date */}
                      <div 
                        onClick={() => {
                          setActiveDatePicker('end');
                          setPickerMonth(tripEndDate ? new Date(tripEndDate).getMonth() : 4);
                          setPickerYear(tripEndDate ? new Date(tripEndDate).getFullYear() : 2026);
                        }}
                        style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', cursor: 'pointer' }}
                      >
                        <span style={{ color: '#9aa0a6', fontSize: '13px', fontWeight: 500, textAlign: 'left' }}>
                          End
                        </span>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          paddingBottom: '8px',
                          borderBottom: '1.5px solid rgba(255, 255, 255, 0.25)'
                        }}>
                          <span style={{ color: tripEndDate ? 'white' : 'rgba(255, 255, 255, 0.4)', fontSize: '16px', fontWeight: 400 }}>
                            {tripEndDate ? formatDate(tripEndDate) : ''}
                          </span>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {groupType === 'home' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'white', fontSize: '18px', fontWeight: 500 }}>
                    Add settle up reminders <span style={{ fontSize: '15px' }}>💎</span>
                  </span>
                  
                  {/* Purple-tinted Toggle Switch */}
                  <div 
                    onClick={() => setShowSettleUpReminders(!showSettleUpReminders)}
                    style={{
                      width: '42px',
                      height: '24px',
                      borderRadius: '12px',
                      backgroundColor: showSettleUpReminders ? '#8b5cf6' : '#2e333d',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '2px'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      position: 'absolute',
                      left: showSettleUpReminders ? '20px' : '2px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.4)'
                    }} />
                  </div>
                </div>

                <p style={{ color: '#9aa0a6', fontSize: '14px', margin: 0, lineHeight: '1.5', textAlign: 'left' }}>
                  When on, Splitwise will remind group members to settle up.
                </p>
              </div>
            )}

            {groupType === 'couple' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'white', fontSize: '18px', fontWeight: 500 }}>
                    Set balance alert <span style={{ fontSize: '15px' }}>💎</span>
                  </span>
                  
                  {/* Purple Toggle Switch */}
                  <div 
                    onClick={() => setShowBalanceAlert(!showBalanceAlert)}
                    style={{
                      width: '42px',
                      height: '24px',
                      borderRadius: '12px',
                      backgroundColor: showBalanceAlert ? '#8b5cf6' : '#2e333d',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '2px'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      position: 'absolute',
                      left: showBalanceAlert ? '20px' : '2px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.4)'
                    }} />
                  </div>
                </div>

                <p style={{ color: '#9aa0a6', fontSize: '14px', margin: 0, lineHeight: '1.5', textAlign: 'left' }}>
                  When on, Splitwise will alert the group when someone's balance reaches a set amount.
                </p>
              </div>
            )}

            {/* Add Group Members List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, minHeight: '160px' }}>
              <span style={{ color: '#cbd5e1', fontSize: '15px', fontWeight: 500, textAlign: 'left' }}>
                Add group members
              </span>
              
              <div style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '4px', 
                overflowY: 'auto'
              }}>
                {users.filter(u => u._id !== user._id).map(u => {
                  const isChecked = groupMembers.includes(u._id);
                  const initials = u.name ? u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
                  return (
                    <div 
                      key={u._id}
                      onClick={() => {
                        if (isChecked) {
                          setGroupMembers(groupMembers.filter(id => id !== u._id));
                        } else {
                          setGroupMembers([...groupMembers, u._id]);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 0',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Circular Initials Avatar */}
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          backgroundColor: isChecked ? 'rgba(28, 194, 159, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                          border: isChecked ? '1px solid #1cc29f' : '1px solid transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isChecked ? '#1cc29f' : '#e2e8f0',
                          fontWeight: '600',
                          fontSize: '14px',
                          transition: 'all 0.2s ease'
                        }}>
                          {initials}
                        </div>

                        {/* Name & Email */}
                        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                          <span style={{ color: 'white', fontWeight: 500, fontSize: '15px' }}>{u.name}</span>
                          <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{u.email}</span>
                        </div>
                      </div>

                      {/* Custom Circular Checkbox */}
                      {isChecked ? (
                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          backgroundColor: '#1cc29f',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease'
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      ) : (
                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          backgroundColor: 'transparent',
                          transition: 'all 0.2s ease'
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </form>

          {/* Date Picker Bottom Sheet Overlay */}
          {(() => {
            if (!activeDatePicker) return null;

            const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
            const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();
            const monthNames = [
              "January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December"
            ];

            const isDaySelected = (dNum) => {
              const targetDate = activeDatePicker === 'start' ? tripStartDate : tripEndDate;
              if (!targetDate) return false;
              const d = new Date(targetDate);
              return d.getFullYear() === pickerYear && d.getMonth() === pickerMonth && d.getDate() === dNum;
            };

            const handlePrevMonth = () => {
              if (pickerMonth === 0) {
                setPickerMonth(11);
                setPickerYear(pickerYear - 1);
              } else {
                setPickerMonth(pickerMonth - 1);
              }
            };

            const handleNextMonth = () => {
              if (pickerMonth === 11) {
                setPickerMonth(0);
                setPickerYear(pickerYear + 1);
              } else {
                setPickerMonth(pickerMonth + 1);
              }
            };

            return (
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                zIndex: 200,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                transition: 'all 0.3s ease'
              }} onClick={() => setActiveDatePicker(null)}>
                
                {/* Bottom Sheet Card */}
                <div 
                  style={{
                    backgroundColor: '#1e1f21',
                    borderTopLeftRadius: '24px',
                    borderTopRightRadius: '24px',
                    padding: '24px 20px 36px 20px',
                    color: 'white',
                    maxHeight: '85%',
                    display: 'flex',
                    flexDirection: 'column'
                  }} 
                  onClick={(e) => e.stopPropagation()} // Stop click propagation to avoid closing
                  className="animate-slide-up"
                >
                  {/* Title */}
                  <h3 style={{ 
                    fontFamily: 'var(--font-display)', 
                    fontSize: '18px', 
                    fontWeight: 500, 
                    textAlign: 'center', 
                    margin: '0 0 20px 0',
                    color: 'white'
                  }}>
                    {activeDatePicker === 'start' ? 'Start date' : 'End date'}
                  </h3>

                  {/* Month Navigation Row */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '20px',
                    padding: '0 12px'
                  }}>
                    {/* Previous Month Chevron */}
                    <div onClick={handlePrevMonth} style={{ cursor: 'pointer', padding: '6px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </div>

                    {/* Month/Year Name */}
                    <span style={{ fontSize: '16px', fontWeight: 500 }}>
                      {monthNames[pickerMonth]} {pickerYear}
                    </span>

                    {/* Next Month Chevron */}
                    <div onClick={handleNextMonth} style={{ cursor: 'pointer', padding: '6px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </div>

                  {/* Day of Week Header Grid */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(7, 1fr)', 
                    textAlign: 'center', 
                    color: 'rgba(255, 255, 255, 0.4)', 
                    fontSize: '14px', 
                    fontWeight: 500, 
                    marginBottom: '16px' 
                  }}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                      <div key={idx}>{day}</div>
                    ))}
                  </div>

                  {/* Calendar Days Grid */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(7, 1fr)', 
                    rowGap: '12px', 
                    columnGap: '4px',
                    textAlign: 'center'
                  }}>
                    {/* Render empty cells for prepended blank days */}
                    {Array.from({ length: getFirstDayOfMonth(pickerYear, pickerMonth) }).map((_, idx) => (
                      <div key={`blank-${idx}`} />
                    ))}

                    {/* Render active days of the month */}
                    {Array.from({ length: getDaysInMonth(pickerYear, pickerMonth) }).map((_, idx) => {
                      const dNum = idx + 1;
                      const isSelected = isDaySelected(dNum);
                      return (
                        <div 
                          key={`day-${dNum}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            aspectRatio: '1',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            const selectedDate = new Date(pickerYear, pickerMonth, dNum);
                            if (activeDatePicker === 'start') {
                              setTripStartDate(selectedDate);
                            } else {
                              setTripEndDate(selectedDate);
                            }
                            setActiveDatePicker(null);
                          }}
                        >
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: isSelected ? '#1cc29f' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: isSelected ? '600' : '400',
                            fontSize: '15px',
                            transition: 'all 0.15s ease'
                          }}>
                            {dNum}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* D. ADD FRIEND SCREEN & CONTACT PICKER */}
      {showAddFriend && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: '#18191b',
          zIndex: 150,
          display: 'flex',
          flexDirection: 'column',
          color: 'white',
          fontFamily: 'var(--font-body)'
        }} className="animate-fade-in">
          
          {/* Header with back button and search input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            gap: '16px'
          }}>
            {/* Back button ← */}
            <svg 
              onClick={() => {
                setShowAddFriend(false);
                setSearchContactQuery('');
              }}
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="white" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ cursor: 'pointer' }}
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12,19 5,12 12,5" />
            </svg>
            
            {/* Search / Entry input */}
            <input 
              type="text" 
              placeholder="Enter name, email, or phone #"
              value={searchContactQuery}
              onChange={(e) => setSearchContactQuery(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '18px',
                outline: 'none',
                caretColor: '#1cc29f'
              }}
              autoFocus
            />
          </div>

          {/* Main content area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
            
            {/* Option: Add Someone New */}
            <div 
              onClick={async () => {
                const nameToAdd = searchContactQuery.trim();
                if (!nameToAdd) {
                  const customName = prompt("Enter the name of your new friend:");
                  if (customName && customName.trim()) {
                    await handleCreateFriendDirect(customName.trim());
                  }
                } else {
                  await handleCreateFriendDirect(nameToAdd);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px 20px',
                gap: '16px',
                cursor: 'pointer',
                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1cc29f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="17" y1="11" x2="23" y2="11" />
              </svg>
              <span style={{ fontSize: '16px', fontWeight: 500, color: 'white' }}>
                {searchContactQuery.trim() 
                  ? `Add "${searchContactQuery.trim()}" as a new friend` 
                  : "Add someone new"
                }
              </span>
            </div>

            {/* Contacts Header / List */}
            {contactsPermission === 'granted' ? (
              <div style={{ marginTop: '16px' }}>
                <div style={{ 
                  padding: '8px 20px', 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  color: 'rgba(255, 255, 255, 0.4)',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}>
                  From your contacts
                </div>
                
                {/* Contact List */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {filteredContacts.length > 0 ? (
                    filteredContacts.map((contact, idx) => (
                      <div 
                        key={idx}
                        onClick={() => handleCreateFriendDirect(contact.name, contact.phone)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '14px 20px',
                          gap: '16px',
                          cursor: 'pointer',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {/* Phone icon */}
                        <div style={{
                          backgroundColor: '#2d3035',
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a0aec0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                        </div>
                        
                        {/* Contact details */}
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                          <span style={{ fontSize: '16px', fontWeight: 600, color: 'white' }}>
                            {contact.name}
                          </span>
                          <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '2px' }}>
                            {contact.phone}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '32px 20px', color: 'rgba(255, 255, 255, 0.4)', fontSize: '15px', textAlign: 'center' }}>
                      No matching contacts found.
                    </div>
                  )}
                </div>
              </div>
            ) : contactsPermission === 'denied' ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
                <span style={{ fontSize: '36px', display: 'block', marginBottom: '16px' }}>🔒</span>
                <p style={{ fontSize: '15px', lineHeight: '1.5', margin: '0 0 20px 0' }}>
                  Contacts permission is denied. You can manually type name above or enable permission to select contacts.
                </p>
                <button 
                  onClick={() => {
                    localStorage.setItem('splitwise_contacts_permission', 'granted');
                    setContactsPermission('granted');
                  }}
                  style={{
                    backgroundColor: '#2d3035',
                    border: '1.2px solid rgba(255, 255, 255, 0.15)',
                    color: '#1cc29f',
                    borderRadius: '8px',
                    padding: '8px 20px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  Enable Contacts Access
                </button>
              </div>
            ) : null}
          </div>

          {/* Android modern permission dialog pop-up */}
          {showPermissionDialog && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(2px)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 200,
              padding: '24px'
            }} className="animate-fade-in">
              <div style={{
                width: '100%',
                maxWidth: '320px',
                backgroundColor: '#2d3035',
                padding: '24px',
                borderRadius: '28px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                animation: 'scale-up 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}>
                {/* Person svg icon */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(28, 194, 159, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1cc29f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: 'white',
                  textAlign: 'center',
                  margin: '0 0 8px 0',
                  lineHeight: '1.3'
                }}>
                  Allow Splitwise to access your contacts?
                </h3>
                
                <p style={{
                  fontSize: '14px',
                  color: '#9aa0a6',
                  textAlign: 'center',
                  margin: '0 0 24px 0',
                  lineHeight: '1.45'
                }}>
                  This lets you quickly find and add friends from your address book to split bills and group expenses.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                  <button 
                    onClick={handleAllowContacts}
                    style={{
                      width: '100%',
                      backgroundColor: '#1cc29f',
                      color: 'white',
                      border: 'none',
                      borderRadius: '100px',
                      padding: '12px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#18ab8b'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1cc29f'}
                  >
                    Allow
                  </button>
                  <button 
                    onClick={handleDenyContacts}
                    style={{
                      width: '100%',
                      backgroundColor: 'transparent',
                      color: '#a0aec0',
                      border: 'none',
                      borderRadius: '100px',
                      padding: '12px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#a0aec0'}
                  >
                    Don't allow
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* E. EDIT PROFILE MODAL */}
      {showEditProfile && (
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
              Edit profile
            </h3>

            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Your name"
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label">Email address</label>
                <input 
                  type="email" 
                  className="input-field" 
                  placeholder="your@email.com"
                  value={editEmail} 
                  onChange={(e) => setEditEmail(e.target.value)} 
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Avatar URL (Optional)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="https://example.com/avatar.png"
                  value={editAvatarUrl} 
                  onChange={(e) => setEditAvatarUrl(e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowEditProfile(false)}>
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

      {/* F. SPLITWISE PRO CHECKOUT MODAL */}
      {showProCheckout && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="animate-fade-in" style={{
            width: '100%',
            maxWidth: '360px',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)',
            padding: '32px 24px',
            borderRadius: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            textAlign: 'center',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            {/* Diamond */}
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: 'rgba(167, 139, 250, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(167, 139, 250, 0.3)'
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3h12l4 6-10 13L2 9z" />
                <path d="M11 3 8 9l4 13 4-13-3-6" />
                <path d="M2 9h20" />
              </svg>
            </div>

            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, margin: '8px 0 0 0' }}>
              Splitwise Pro
            </h3>
            
            <p style={{ fontSize: '14px', color: '#c084fc', margin: 0, fontWeight: 600 }}>
              Unlock the Ultimate Ledger Experience
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', margin: '12px 0', textAlign: 'left', fontSize: '13px', color: '#cbd5e1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#a78bfa' }}>✦</span> Unlimited non-group splitting & contacts
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#a78bfa' }}>✦</span> High-fidelity dynamic charts & statistics
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#a78bfa' }}>✦</span> Advanced receipt OCR scanning & search
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#a78bfa' }}>✦</span> Ad-free experience & premium visual themes
              </div>
            </div>

            <button 
              onClick={() => {
                alert("Thank you! You are now subscribed to Splitwise Pro! (Demo Success)");
                setShowProCheckout(false);
              }}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(124, 58, 237, 0.4)',
                marginTop: '10px'
              }}
            >
              Start 7-day Free Trial
            </button>

            <span 
              onClick={() => setShowProCheckout(false)}
              style={{ fontSize: '13px', color: '#94a3b8', cursor: 'pointer', textDecoration: 'underline', marginTop: '6px' }}
            >
              Maybe later
            </span>
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
