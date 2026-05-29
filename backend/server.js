const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB, db } = require('./db');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to calculate group balances and direct debts
async function getGroupBalancesAndDebts(groupId, currentUserId) {
  const group = await db.getGroupById(groupId);
  if (!group) return null;

  const expenses = await db.getExpenses(groupId);
  const settlements = await db.getSettlements(groupId);
  
  // Filter out any invalid, null, or deleted user references defensively
  const members = (group.members || []).filter(m => m && m._id);

  // Initialize data structures
  const paidAmounts = {};
  const splitShares = {};
  const debts = {}; // debts[debtorId][payerId] = amount

  members.forEach(m => {
    const idStr = m._id.toString();
    paidAmounts[idStr] = 0;
    splitShares[idStr] = 0;
    debts[idStr] = {};
    members.forEach(other => {
      if (other && m._id !== other._id) {
        debts[idStr][other._id.toString()] = 0;
      }
    });
  });

  // Calculate totals from expenses
  expenses.forEach(exp => {
    // Ensure the paying user exists in our filtered members list
    if (!exp.paidBy || !exp.paidBy._id) return;
    const payerId = exp.paidBy._id.toString();
    if (paidAmounts[payerId] !== undefined) {
      paidAmounts[payerId] += exp.amount;
    }

    if (exp.splits) {
      exp.splits.forEach(split => {
        if (!split.user || !split.user._id) return;
        const debtorId = split.user._id.toString();
        if (splitShares[debtorId] !== undefined) {
          splitShares[debtorId] += split.owedAmount;
        }

        // Record direct debt (if debtor is not the payer)
        if (debtorId !== payerId && debts[debtorId] && debts[debtorId][payerId] !== undefined) {
          debts[debtorId][payerId] += split.owedAmount;
        }
      });
    }
  });

  // Apply settlements to reduce direct debts
  settlements.forEach(sett => {
    if (!sett.fromUser || !sett.fromUser._id || !sett.toUser || !sett.toUser._id) return;
    const fromId = sett.fromUser._id.toString();
    const toId = sett.toUser._id.toString();

    // If A owes B, and A pays B, it reduces A owes B
    if (debts[fromId] && debts[fromId][toId] !== undefined) {
      debts[fromId][toId] -= sett.amount;
    } else {
      // If no direct debt exists, record it as negative debt or create it
      if (!debts[fromId]) debts[fromId] = {};
      if (debts[fromId][toId] === undefined) debts[fromId][toId] = 0;
      debts[fromId][toId] -= sett.amount;
    }
  });

  // Net the mutual debts between each pair of users
  const netDebts = []; // array of { from, to, amount }
  const memberIds = members.map(m => m._id.toString());

  for (let i = 0; i < memberIds.length; i++) {
    for (let j = i + 1; j < memberIds.length; j++) {
      const u1 = memberIds[i];
      const u2 = memberIds[j];

      let u1OwesU2 = debts[u1][u2] || 0;
      let u2OwesU1 = debts[u2][u1] || 0;

      if (u1OwesU2 > u2OwesU1) {
        u1OwesU2 -= u2OwesU1;
        u2OwesU1 = 0;
      } else {
        u2OwesU1 -= u1OwesU2;
        u1OwesU2 = 0;
      }

      const user1 = members.find(m => m._id.toString() === u1);
      const user2 = members.find(m => m._id.toString() === u2);

      if (user1 && user2) {
        if (u1OwesU2 > 0.01) {
          netDebts.push({
            from: user1,
            to: user2,
            amount: Math.round(u1OwesU2 * 100) / 100
          });
        }
        if (u2OwesU1 > 0.01) {
          netDebts.push({
            from: user2,
            to: user1,
            amount: Math.round(u2OwesU1 * 100) / 100
          });
        }
      }
    }
  }

  // Calculate overall net balance for each user (Paid - Owed)
  const userBalances = members.map(m => {
    const idStr = m._id.toString();
    const paid = paidAmounts[idStr] || 0;
    const owed = splitShares[idStr] || 0;
    
    // Sum of what this user owes others in net debts
    const totalOwedToOthers = netDebts
      .filter(d => d.from && d.from._id.toString() === idStr)
      .reduce((sum, d) => sum + d.amount, 0);

    // Sum of what others owe this user in net debts
    const totalOwedByOthers = netDebts
      .filter(d => d.to && d.to._id.toString() === idStr)
      .reduce((sum, d) => sum + d.amount, 0);

    return {
      user: m,
      paid: Math.round(paid * 100) / 100,
      owed: Math.round(owed * 100) / 100,
      netBalance: Math.round((totalOwedByOthers - totalOwedToOthers) * 100) / 100
    };
  });

  // Calculate current user's specific context
  let currentUserStatus = {
    text: "settled up",
    amount: 0,
    type: "settled", // "settled", "owe", "owed"
    owesTo: [],      // Who the current user owes
    owedBy: []       // Who owes the current user
  };

  if (currentUserId) {
    const curIdStr = currentUserId.toString();
    
    const owesTo = netDebts
      .filter(d => d.from && d.from._id && d.from._id.toString() === curIdStr)
      .map(d => ({ user: d.to, amount: d.amount }));

    const owedBy = netDebts
      .filter(d => d.to && d.to._id && d.to._id.toString() === curIdStr)
      .map(d => ({ user: d.from, amount: d.amount }));

    const totalOwe = owesTo.reduce((sum, d) => sum + d.amount, 0);
    const totalOwed = owedBy.reduce((sum, d) => sum + d.amount, 0);

    currentUserStatus.owesTo = owesTo;
    currentUserStatus.owedBy = owedBy;

    if (totalOwed > totalOwe) {
      currentUserStatus.type = "owed";
      currentUserStatus.amount = Math.round((totalOwed - totalOwe) * 100) / 100;
      currentUserStatus.text = `you are owed $${currentUserStatus.amount}`;
    } else if (totalOwe > totalOwed) {
      currentUserStatus.type = "owe";
      currentUserStatus.amount = Math.round((totalOwe - totalOwed) * 100) / 100;
      currentUserStatus.text = `you owe $${currentUserStatus.amount}`;
    }
  }

  return {
    group,
    balances: userBalances,
    netDebts,
    currentUserStatus
  };
}

// Helper function to calculate net balances between two users across all shared groups
async function getFriendBalances(userId, friendId) {
  const groups = await db.getGroups();
  let totalOweToFriend = 0;
  let totalOwedByFriend = 0;
  
  for (const group of groups) {
    const balanceData = await getGroupBalancesAndDebts(group._id, userId);
    if (balanceData && balanceData.currentUserStatus) {
      const status = balanceData.currentUserStatus;
      
      const oweTo = status.owesTo.find(o => o.user && o.user._id.toString() === friendId.toString());
      if (oweTo) {
        totalOweToFriend += oweTo.amount;
      }
      
      const owedBy = status.owedBy.find(o => o.user && o.user._id.toString() === friendId.toString());
      if (owedBy) {
        totalOwedByFriend += owedBy.amount;
      }
    }
  }
  
  const net = Math.round((totalOwedByFriend - totalOweToFriend) * 100) / 100;
  let text = "no expenses";
  if (net > 0) {
    text = `you are owed $${net.toFixed(2)}`;
  } else if (net < 0) {
    text = `you owe $${Math.abs(net).toFixed(2)}`;
  }
  
  return {
    owe: Math.round(totalOweToFriend * 100) / 100,
    owed: Math.round(totalOwedByFriend * 100) / 100,
    netBalance: net,
    type: net > 0 ? 'owed' : net < 0 ? 'owe' : 'settled',
    text
  };
}

// --- API Routes ---

// Friends API Routes
app.get('/api/users/:userId/friends', async (req, res) => {
  try {
    const { userId } = req.params;
    const friends = await db.getFriends(userId);
    const populatedFriends = [];
    
    for (const friend of friends) {
      const friendObj = typeof friend.toObject === 'function' ? friend.toObject() : friend;
      const balanceDetails = await getFriendBalances(userId, friend._id);
      populatedFriends.push({
        ...friendObj,
        balance: balanceDetails
      });
    }
    
    res.json(populatedFriends);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/:userId/friends', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: "Friend's name is required" });
    }
    
    let friendUser = null;
    if (email) {
      friendUser = await db.getUserByEmail(email);
    }
    
    if (!friendUser) {
      // Create shadow user (contact friend)
      const bcrypt = require('bcryptjs');
      const crypto = require('crypto');
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      const emailToUse = email || `contact_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@splitwise.demo`;
      
      friendUser = await db.createUser({
        name,
        email: emailToUse,
        password: hashedPassword,
        avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`
      });
    }
    
    // Add friendship relationship mutually
    await db.addFriend(userId, friendUser._id);
    
    const friendObj = typeof friendUser.toObject === 'function' ? friendUser.toObject() : friendUser;
    const balanceDetails = await getFriendBalances(userId, friendUser._id);
    
    res.status(201).json({
      ...friendObj,
      balance: balanceDetails
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 1. Authentication / User selection
app.get('/api/users', async (req, res) => {
  try {
    const users = await db.getUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    
    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Verify hashed password (handle legacy user records dynamically)
    let userPasswordHash = user.password;
    if (!userPasswordHash) {
      userPasswordHash = await bcrypt.hash('password123', 10);
    }

    const isMatch = await bcrypt.compare(password, userPasswordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: "Google token is required" });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: "Google Client ID is not configured on the server" });
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: clientId
    });
    
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ error: "Email not provided by Google account" });
    }

    let isNewUser = false;
    let user = await db.getUserByEmail(email);
    if (!user) {
      isNewUser = true;
      // Auto-register new Google user with a secure random password
      const crypto = require('crypto');
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      user = await db.createUser({
        name: name || email.split('@')[0],
        email: email,
        password: hashedPassword,
        avatarUrl: picture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${name || 'GoogleUser'}`
      });
    }

    const userObj = typeof user.toObject === 'function' ? user.toObject() : user;
    res.json({ ...userObj, isNewUser });
  } catch (err) {
    console.error("Google Auth Error:", err);
    res.status(400).json({ error: "Google authentication failed" });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }
    
    let existing = await db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.createUser({
      name,
      email,
      password: hashedPassword,
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`
    });
    const userObj = typeof user.toObject === 'function' ? user.toObject() : user;
    res.status(201).json({ ...userObj, isNewUser: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Groups
app.get('/api/groups', async (req, res) => {
  try {
    const currentUserId = req.query.userId;
    const groups = await db.getGroups();

    // Map each group to include the current user's specific status (owe/owed)
    const groupsWithStatus = await Promise.all(groups.map(async (group) => {
      const balanceData = await getGroupBalancesAndDebts(group._id, currentUserId);
      const groupObj = typeof group.toObject === 'function' ? group.toObject() : group;
      return {
        ...groupObj,
        currentUserStatus: balanceData ? balanceData.currentUserStatus : null
      };
    }));

    res.json(groupsWithStatus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.query.userId;
    const balanceData = await getGroupBalancesAndDebts(id, currentUserId);
    
    if (!balanceData) {
      return res.status(404).json({ error: "Group not found" });
    }
    res.json(balanceData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/groups', async (req, res) => {
  try {
    const { name, description, members } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Group name is required" });
    }
    const group = await db.createGroup({
      name,
      description: description || '',
      members: members || []
    });
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Expenses
app.get('/api/expenses', async (req, res) => {
  try {
    const { groupId } = req.query;
    const expenses = await db.getExpenses(groupId);
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const { description, amount, paidBy, group, splitUserIds } = req.body;
    
    if (!description || !amount || !paidBy || !group || !splitUserIds || splitUserIds.length === 0) {
      return res.status(400).json({ error: "Missing required expense parameters" });
    }

    // Standard equal split calculation
    const splitCount = splitUserIds.length;
    const owedAmount = Math.round((amount / splitCount) * 100) / 100;
    
    const splits = splitUserIds.map((userId, idx) => {
      // Adjust the last split slightly to handle rounding errors
      let finalOwedAmount = owedAmount;
      if (idx === splitCount - 1) {
        const totalCalculated = owedAmount * splitCount;
        const diff = amount - totalCalculated;
        finalOwedAmount = Math.round((owedAmount + diff) * 100) / 100;
      }
      return {
        user: userId,
        owedAmount: finalOwedAmount
      };
    });

    const expense = await db.createExpense({
      description,
      amount,
      paidBy,
      group,
      splits
    });

    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Settlements
app.get('/api/settlements', async (req, res) => {
  try {
    const { groupId } = req.query;
    const settlements = await db.getSettlements(groupId);
    res.json(settlements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settlements', async (req, res) => {
  try {
    const { group, fromUser, toUser, amount } = req.body;
    if (!group || !fromUser || !toUser || !amount) {
      return res.status(400).json({ error: "Missing required settlement parameters" });
    }

    const settlement = await db.createSettlement({
      group,
      fromUser,
      toUser,
      amount
    });

    res.status(201).json(settlement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Overall dashboard balance API across all groups for a user
app.get('/api/dashboard/balances', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "userId query parameter is required" });
    }

    const groups = await db.getGroups();
    let totalOwe = 0;
    let totalOwed = 0;
    
    const details = [];

    for (const group of groups) {
      const balanceData = await getGroupBalancesAndDebts(group._id, userId);
      if (balanceData && balanceData.currentUserStatus) {
        const status = balanceData.currentUserStatus;
        if (status.type === "owe") {
          totalOwe += status.amount;
        } else if (status.type === "owed") {
          totalOwed += status.amount;
        }
        details.push({
          groupId: group._id,
          groupName: group.name,
          status: status
        });
      }
    }

    const net = Math.round((totalOwed - totalOwe) * 100) / 100;
    res.json({
      totalOwe: Math.round(totalOwe * 100) / 100,
      totalOwed: Math.round(totalOwed * 100) / 100,
      netBalance: net,
      text: net > 0 ? `overall, you are owed $${net}` : net < 0 ? `overall, you owe $${Math.abs(net)}` : "you are settled up",
      details
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server and connect to DB
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
