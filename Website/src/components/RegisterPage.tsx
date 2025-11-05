import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { registerUser } from '../api/client';

interface RegisterPageProps {
  onRegister: (username: string, userData: any) => void;
  onNavigate: (page: string) => void;
}

export function RegisterPage({ onRegister, onNavigate }: RegisterPageProps) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !username || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const result = await registerUser(email, username, password);
      if (result.success && result.user) {
        toast.success('Account created successfully!');
        onRegister(username, result.user);
      } else {
        toast.error(result.error || 'Registration failed');
      }
    } catch (error) {
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16 relative">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFE5D1]/30 via-transparent to-transparent" />
      
      <Card className="w-full max-w-md relative z-10 shadow-lg border-2 rounded-2xl">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold text-foreground">Create Account</CardTitle>
          <CardDescription className="text-base text-muted-foreground">Get started with Cognivo today</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-lg border-2 h-11"
              />
            </div>
            <div className="space-y-2 pt-4">
              <Label htmlFor="username" className="text-foreground font-medium pt-6 block">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="rounded-lg border-2 h-11"
              />
            </div>
            <div className="space-y-2 pt-4">
              <Label htmlFor="password" className="text-foreground font-medium pt-6 block">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-lg border-2 h-11"
              />
            </div>
            <div className="pt-4">
              <div className="bg-secondary/50 border-2 border-primary/20 rounded-xl p-4 flex gap-3 mt-8">
                <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground font-medium">
                  Your username and password will be required to log in. Do not forget them.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-6">
            <Button type="submit" className="w-full h-11 rounded-lg font-semibold shadow-md hover:shadow-lg transition-shadow" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Register'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="text-primary font-medium hover:underline transition-colors"
              >
                Login here
              </button>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
