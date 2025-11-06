import { useState, useEffect } from 'react';
import { Download, Key, Trash2, LogOut, Coins, DollarSign, User, Mail } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { toast } from 'sonner';
import { getUserData, changePassword, deleteUserAccount } from '../api/client';

interface SettingsPageProps {
  username: string;
  onLogout: () => void;
}

export function SettingsPage({ username, onLogout }: SettingsPageProps) {
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    loadUserData();
  }, [username]);

  const loadUserData = async () => {
    const result = await getUserData(username);
    if (result.success && result.user) {
      setUserData(result.user);
    }
  };

  const handleDownloadData = () => {
    const data = {
      username,
      email: userData?.email || '',
      totalTokensSpent: userData?.totalTokensSpent || 0,
      totalMoneySpent: userData?.totalMoneySpent || 0,
      downloadDate: new Date().toISOString(),
      boards: [],
      sources: [],
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const a = document.createElement('a');
    a.href = dataUri;
    a.download = `cognivo-export-${Date.now()}.json`;
    a.click();
    toast.success('Data exported successfully!');
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const result = await changePassword(username, currentPassword, newPassword);
    if (result.success) {
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsPasswordDialogOpen(false);
    } else {
      toast.error(result.error || 'Failed to change password');
    }
  };

  const handleDeleteAccount = async () => {
    const result = await deleteUserAccount(username);
    if (result.success) {
      toast.success('Account deleted. Logging out...');
      setTimeout(() => {
        onLogout();
      }, 1500);
    } else {
      toast.error(result.error || 'Failed to delete account');
    }
  };

  const formatMoney = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatTokens = (amount: number) => {
    return amount.toLocaleString();
  };

  return (
    <div className="pt-16 min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">Settings</h1>
          <p className="text-muted-foreground text-lg">Manage your account</p>
        </div>

        <div className="space-y-4">
          {/* Account Info & Usage Stats - Compact */}
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Username
                </span>
                <span className="font-medium">{username}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </span>
                <span className="font-medium">{userData?.email || 'Loading...'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  Total Tokens Spent
                </span>
                <span className="font-medium">{formatTokens(userData?.totalTokensSpent || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Money Spent
                </span>
                <span className="font-medium">{formatMoney(userData?.totalMoneySpent || 0)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions - Compact */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                onClick={handleDownloadData}
                variant="outline"
                className="w-full justify-start"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Data
              </Button>
              <Button 
                onClick={() => setIsPasswordDialogOpen(true)}
                variant="outline"
                className="w-full justify-start"
              >
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </Button>
              <Button 
                onClick={() => setIsLogoutDialogOpen(true)}
                variant="outline"
                className="w-full justify-start"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone - Compact */}
          <Card className="border-2 border-red-200 bg-red-50/30">
            <CardHeader>
              <CardTitle className="text-red-600 font-bold">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setIsDeleteDialogOpen(true)}
                variant="destructive"
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword}>
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation */}
      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onLogout}>
              Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move your account to deleted users. You can sign up again with the same email, but your data will be archived.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
