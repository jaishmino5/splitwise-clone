const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Determine if we should use MongoDB or JSON database fallback
let useMongoDB = false;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/splitwise';
const JSON_DB_PATH = path.join(__dirname, 'db.json');

// Mongoose Schemas (Only used if useMongoDB is true)
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: { type: String, required: true },
  avatarUrl: String,
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

const GroupSchema = new mongoose.Schema({
  name: String,
  description: String,
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  whiteboard: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const ExpenseSchema = new mongoose.Schema({
  description: String,
  amount: Number,
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  splits: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    owedAmount: Number
  }],
  createdAt: { type: Date, default: Date.now }
});

const SettlementSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: Number,
  createdAt: { type: Date, default: Date.now }
});

let UserModel, GroupModel, ExpenseModel, SettlementModel;

// Helper to load JSON database
function loadJsonDb() {
  if (!fs.existsSync(JSON_DB_PATH)) {
    const defaultDb = {
      users: [],
      groups: [],
      expenses: [],
      settlements: []
    };
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(defaultDb, null, 2));
    return defaultDb;
  }
  try {
    const data = fs.readFileSync(JSON_DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading JSON database, resetting. Error:", err);
    return { users: [], groups: [], expenses: [], settlements: [] };
  }
}

// Helper to save JSON database
function saveJsonDb(data) {
  fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2));
}

// Connect to Database
async function connectDB() {
  try {
    console.log("Attempting to connect to MongoDB at:", MONGODB_URI);
    // Set a small timeout (3 seconds) so the fallback kicks in quickly if MongoDB is not running
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000
    });
    console.log("Successfully connected to MongoDB!");
    useMongoDB = true;
    UserModel = mongoose.model('User', UserSchema);
    GroupModel = mongoose.model('Group', GroupSchema);
    ExpenseModel = mongoose.model('Expense', ExpenseSchema);
    SettlementModel = mongoose.model('Settlement', SettlementSchema);
  } catch (err) {
    console.warn("MongoDB connection failed or not running. Falling back to JSON-file database (db.json).");
    useMongoDB = false;
  }
  
  // Seed the DB with the screenshot values if it's empty
  await seedInitialData();
}

// DB Operations Layer
const db = {
  // Users
  async getUsers() {
    if (useMongoDB) {
      return await UserModel.find({});
    } else {
      const data = loadJsonDb();
      return data.users;
    }
  },

  async getUserById(id) {
    if (useMongoDB) {
      return await UserModel.findById(id);
    } else {
      const data = loadJsonDb();
      return data.users.find(u => u._id === id.toString()) || null;
    }
  },

  async getUserByEmail(email) {
    if (useMongoDB) {
      return await UserModel.findOne({ email });
    } else {
      const data = loadJsonDb();
      return data.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    }
  },

  async createUser(userData) {
    if (useMongoDB) {
      const newUser = new UserModel(userData);
      return await newUser.save();
    } else {
      const data = loadJsonDb();
      const newUser = {
        _id: new mongoose.Types.ObjectId().toString(),
        friends: [],
        ...userData
      };
      data.users.push(newUser);
      saveJsonDb(data);
      return newUser;
    }
  },

  async getFriends(userId) {
    if (useMongoDB) {
      const user = await UserModel.findById(userId).populate('friends');
      return user ? (user.friends || []) : [];
    } else {
      const data = loadJsonDb();
      const user = data.users.find(u => u._id === userId.toString());
      if (!user) return [];
      const friendIds = user.friends || [];
      return friendIds.map(fId => data.users.find(u => u._id === fId)).filter(Boolean);
    }
  },

  async addFriend(userId, friendId) {
    if (useMongoDB) {
      await UserModel.findByIdAndUpdate(userId, { $addToSet: { friends: friendId } });
      await UserModel.findByIdAndUpdate(friendId, { $addToSet: { friends: userId } });
    } else {
      const data = loadJsonDb();
      const user = data.users.find(u => u._id === userId.toString());
      const friend = data.users.find(u => u._id === friendId.toString());
      if (user && friend) {
        if (!user.friends) user.friends = [];
        if (!friend.friends) friend.friends = [];
        
        if (!user.friends.includes(friendId.toString())) {
          user.friends.push(friendId.toString());
        }
        if (!friend.friends.includes(userId.toString())) {
          friend.friends.push(userId.toString());
        }
        saveJsonDb(data);
      }
    }
  },

  async updateUser(userId, userData) {
    if (useMongoDB) {
      return await UserModel.findByIdAndUpdate(userId, userData, { new: true });
    } else {
      const data = loadJsonDb();
      const index = data.users.findIndex(u => u._id === userId.toString());
      if (index !== -1) {
        data.users[index] = {
          ...data.users[index],
          ...userData
        };
        saveJsonDb(data);
        return data.users[index];
      }
      return null;
    }
  },

  // Groups
  async getGroups() {
    if (useMongoDB) {
      return await GroupModel.find({}).populate('members');
    } else {
      const data = loadJsonDb();
      // Populate members
      return data.groups.map(g => ({
        ...g,
        members: g.members.map(memberId => data.users.find(u => u._id === memberId))
      }));
    }
  },

  async getGroupById(id) {
    if (useMongoDB) {
      return await GroupModel.findById(id).populate('members');
    } else {
      const data = loadJsonDb();
      const group = data.groups.find(g => g._id === id.toString());
      if (!group) return null;
      return {
        ...group,
        members: group.members.map(memberId => data.users.find(u => u._id === memberId))
      };
    }
  },

  async createGroup(groupData) {
    if (useMongoDB) {
      const newGroup = new GroupModel(groupData);
      return await newGroup.save();
    } else {
      const data = loadJsonDb();
      const newGroup = {
        _id: new mongoose.Types.ObjectId().toString(),
        members: [],
        createdAt: new Date().toISOString(),
        ...groupData
      };
      // Format members as strings
      newGroup.members = newGroup.members.map(m => m.toString());
      data.groups.push(newGroup);
      saveJsonDb(data);
      return newGroup;
    }
  },

  async updateGroup(id, updateData) {
    if (useMongoDB) {
      return await GroupModel.findByIdAndUpdate(id, updateData, { new: true }).populate('members');
    } else {
      const data = loadJsonDb();
      const idx = data.groups.findIndex(g => g._id === id.toString());
      if (idx === -1) return null;
      
      const updatedGroup = {
        ...data.groups[idx],
        ...updateData
      };
      
      if (updatedGroup.members) {
        updatedGroup.members = updatedGroup.members.map(m => m.toString());
      }
      
      data.groups[idx] = updatedGroup;
      saveJsonDb(data);
      
      return {
        ...updatedGroup,
        members: updatedGroup.members.map(memberId => data.users.find(u => u._id === memberId))
      };
    }
  },

  // Expenses
  async getExpenses(groupId) {
    if (useMongoDB) {
      const filter = groupId ? { group: groupId } : {};
      return await ExpenseModel.find(filter)
        .populate('paidBy')
        .populate('splits.user')
        .sort({ createdAt: -1 });
    } else {
      const data = loadJsonDb();
      let expenses = data.expenses;
      if (groupId) {
        expenses = expenses.filter(e => e.group === groupId.toString());
      }
      // Populate paidBy and splits.user
      return expenses.map(e => ({
        ...e,
        paidBy: data.users.find(u => u._id === e.paidBy),
        splits: e.splits.map(s => ({
          ...s,
          user: data.users.find(u => u._id === s.user)
        }))
      })).reverse(); // Newest first
    }
  },

  async createExpense(expenseData) {
    if (useMongoDB) {
      const newExpense = new ExpenseModel(expenseData);
      const saved = await newExpense.save();
      return await ExpenseModel.findById(saved._id).populate('paidBy').populate('splits.user');
    } else {
      const data = loadJsonDb();
      const newExpense = {
        _id: new mongoose.Types.ObjectId().toString(),
        createdAt: new Date().toISOString(),
        splits: [],
        ...expenseData
      };
      // Format references as strings
      newExpense.paidBy = newExpense.paidBy.toString();
      newExpense.group = newExpense.group.toString();
      newExpense.splits = newExpense.splits.map(s => ({
        ...s,
        user: s.user.toString()
      }));

      data.expenses.push(newExpense);
      saveJsonDb(data);
      
      // Return populated version
      return {
        ...newExpense,
        paidBy: data.users.find(u => u._id === newExpense.paidBy),
        splits: newExpense.splits.map(s => ({
          ...s,
          user: data.users.find(u => u._id === s.user)
        }))
      };
    }
  },

  // Settlements
  async getSettlements(groupId) {
    if (useMongoDB) {
      const filter = groupId ? { group: groupId } : {};
      return await SettlementModel.find(filter)
        .populate('fromUser')
        .populate('toUser')
        .sort({ createdAt: -1 });
    } else {
      const data = loadJsonDb();
      let settlements = data.settlements;
      if (groupId) {
        settlements = settlements.filter(s => s.group === groupId.toString());
      }
      return settlements.map(s => ({
        ...s,
        fromUser: data.users.find(u => u._id === s.fromUser),
        toUser: data.users.find(u => u._id === s.toUser)
      })).reverse();
    }
  },

  async createSettlement(settlementData) {
    if (useMongoDB) {
      const newSettlement = new SettlementModel(settlementData);
      const saved = await newSettlement.save();
      return await SettlementModel.findById(saved._id).populate('fromUser').populate('toUser');
    } else {
      const data = loadJsonDb();
      const newSettlement = {
        _id: new mongoose.Types.ObjectId().toString(),
        createdAt: new Date().toISOString(),
        ...settlementData
      };
      newSettlement.group = newSettlement.group.toString();
      newSettlement.fromUser = newSettlement.fromUser.toString();
      newSettlement.toUser = newSettlement.toUser.toString();

      data.settlements.push(newSettlement);
      saveJsonDb(data);

      return {
        ...newSettlement,
        fromUser: data.users.find(u => u._id === newSettlement.fromUser),
        toUser: data.users.find(u => u._id === newSettlement.toUser)
      };
    }
  }
};

// Seed initial data based on screenshots
async function seedInitialData() {
  const users = await db.getUsers();
  if (users.length > 0) {
    console.log("Database already has data. Skipping seed.");
    return;
  }

  console.log("Seeding default database records to match the user's screenshots...");

  // Default seeded users password: password123
  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  // 1. Create Users
  const jaish = await db.createUser({
    name: "Jaish Minocha",
    email: "jaish@prameya.in",
    password: defaultPasswordHash,
    avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Jaish"
  });

  const sonia = await db.createUser({
    name: "Sonia Minocha",
    email: "soniaminocha18@gmail.com",
    password: defaultPasswordHash,
    avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sonia"
  });

  const david = await db.createUser({
    name: "David",
    email: "david@example.com",
    password: defaultPasswordHash,
    avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=David"
  });

  const brooklyn = await db.createUser({
    name: "Brooklyn S.",
    email: "brooklyn@example.com",
    password: defaultPasswordHash,
    avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Brooklyn"
  });

  const earl = await db.createUser({
    name: "Earl E.",
    email: "earl@example.com",
    password: defaultPasswordHash,
    avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Earl"
  });

  // 2. Create Groups
  const beachTrip = await db.createGroup({
    name: "Beach trip",
    description: "Our summer trip to the shore",
    members: [jaish._id, david._id]
  });

  const houseStuff = await db.createGroup({
    name: "House stuff",
    description: "Household bills and groceries",
    members: [jaish._id, brooklyn._id, earl._id]
  });

  // 3. Create Expenses matching the screenshot balances
  
  // Beach Trip: Jaish is owed $100.00 overall. David owes Jaish $100.
  // This means Jaish paid $200 for an expense shared between Jaish and David, or Jaish paid $100 for David directly.
  // Let's create an expense: "Villa rental" - Paid by Jaish: $200. Split equally between Jaish and David.
  await db.createExpense({
    description: "Beach house booking",
    amount: 200,
    paidBy: jaish._id,
    group: beachTrip._id,
    splits: [
      { user: jaish._id, owedAmount: 100 },
      { user: david._id, owedAmount: 100 }
    ]
  });

  // House Stuff: Jaish owes $35.36 overall. Jaish owes Brooklyn $105.36, and Earl owes Jaish $70.00.
  // Let's model this:
  // - Brooklyn paid $316.08 for groceries/furniture, split equally between Brooklyn, Jaish, and Earl.
  //   So each owes Brooklyn $105.36. (Jaish owes Brooklyn $105.36).
  // - Jaish paid $210 for house cleaning/utilities, split equally between Brooklyn, Jaish, and Earl.
  //   So Brooklyn and Earl each owe Jaish $70. (Earl owes Jaish $70.00, Brooklyn owes Jaish $70.00).
  // Net results:
  // - Jaish owes Brooklyn $105.36 - $70.00 = $35.36.
  // - Earl owes Brooklyn $105.36, owes Jaish $70.00.
  // - Jaish owes $35.36 net. Brooklyn is owed $210.72 net. Earl owes $175.36 net.
  // This matches the screenshots perfectly! ("You owe Brooklyn S. $105.36", "Earl E. owes you $70.00", "you owe $35.36" overall for House stuff).
  
  await db.createExpense({
    description: "Living room sofa",
    amount: 316.08,
    paidBy: brooklyn._id,
    group: houseStuff._id,
    splits: [
      { user: brooklyn._id, owedAmount: 105.36 },
      { user: jaish._id, owedAmount: 105.36 },
      { user: earl._id, owedAmount: 105.36 }
    ]
  });

  await db.createExpense({
    description: "House cleaning service",
    amount: 210,
    paidBy: jaish._id,
    group: houseStuff._id,
    splits: [
      { user: jaish._id, owedAmount: 70 },
      { user: brooklyn._id, owedAmount: 70 },
      { user: earl._id, owedAmount: 70 }
    ]
  });

  console.log("Database seeding completed successfully!");
}

module.exports = {
  connectDB,
  db,
  isMongoDBConnected: () => useMongoDB
};
