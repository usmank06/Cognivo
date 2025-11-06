import { User, DeletedUser } from './models/User';
import { ensureConnected } from './mongodb';

// Simple hash function (in production, use bcrypt)
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

export async function registerUser(email: string, username: string, password: string) {
  try {
    await ensureConnected();
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return { success: false, error: 'User already exists' };
    }

    // Hash password
    const hashedPassword = simpleHash(password);

    // Create user
    const user = await User.create({
      email,
      username,
      password: hashedPassword,
      totalTokensSpent: 0,
      totalMoneySpent: 0,
    });

    return { 
      success: true, 
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        totalTokensSpent: user.totalTokensSpent,
        totalMoneySpent: user.totalMoneySpent,
      }
    };
  } catch (error) {
    return { success: false, error: 'Registration failed' };
  }
}

export async function loginUser(username: string, password: string) {
  try {
    await ensureConnected();
    
    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return { success: false, error: 'Invalid username or password' };
    }

    // Check password
    const hashedPassword = simpleHash(password);
    if (user.password !== hashedPassword) {
      return { success: false, error: 'Invalid username or password' };
    }

    return { 
      success: true, 
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        totalTokensSpent: user.totalTokensSpent,
        totalMoneySpent: user.totalMoneySpent,
      }
    };
  } catch (error) {
    return { success: false, error: 'Login failed' };
  }
}

export async function getUserData(username: string) {
  try {
    await ensureConnected();
    
    const user = await User.findOne({ username });
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    return { 
      success: true, 
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        totalTokensSpent: user.totalTokensSpent,
        totalMoneySpent: user.totalMoneySpent,
      }
    };
  } catch (error) {
    return { success: false, error: 'Failed to get user data' };
  }
}

export async function changePassword(username: string, currentPassword: string, newPassword: string) {
  try {
    await ensureConnected();
    
    const user = await User.findOne({ username });
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Check current password
    const hashedCurrentPassword = simpleHash(currentPassword);
    if (user.password !== hashedCurrentPassword) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // Update password
    const hashedNewPassword = simpleHash(newPassword);
    user.password = hashedNewPassword;
    await user.save();

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to change password' };
  }
}

export async function deleteUserAccount(username: string) {
  try {
    await ensureConnected();
    
    // Find the user
    const user = await User.findOne({ username });
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Move to deleted users collection
    await DeletedUser.create({
      username: user.username,
      email: user.email,
      password: user.password,
      totalTokensSpent: user.totalTokensSpent,
      totalMoneySpent: user.totalMoneySpent,
      deletedAt: new Date(),
      originalCreatedAt: user.createdAt,
      originalUpdatedAt: user.updatedAt,
    });

    // Delete from active users
    await User.deleteOne({ username });

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete user' };
  }
}

export async function updateTokenUsage(username: string, tokensUsed: number, moneyCost: number) {
  try {
    await ensureConnected();
    
    const user = await User.findOne({ username });
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    user.totalTokensSpent += tokensUsed;
    user.totalMoneySpent += moneyCost;
    await user.save();

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to update token usage' };
  }
}
