import { useState } from 'react';
import { Database, Globe, Upload, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';

interface Source {
  id: string;
  type: 'mongodb' | 'api' | 'file';
  name: string;
  connected: boolean;
  details?: string;
}

export function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [isMongoDialogOpen, setIsMongoDialogOpen] = useState(false);
  const [isApiDialogOpen, setIsApiDialogOpen] = useState(false);
  const [mongoUri, setMongoUri] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');

  const handleConnectMongo = () => {
    if (mongoUri.trim()) {
      setSources([...sources, {
        id: Date.now().toString(),
        type: 'mongodb',
        name: 'MongoDB Connection',
        connected: true,
        details: mongoUri.split('@')[1] || 'Connected',
      }]);
      setMongoUri('');
      setIsMongoDialogOpen(false);
    }
  };

  const handleConnectApi = () => {
    if (apiEndpoint.trim()) {
      setSources([...sources, {
        id: Date.now().toString(),
        type: 'api',
        name: 'API Connection',
        connected: true,
        details: new URL(apiEndpoint).hostname,
      }]);
      setApiEndpoint('');
      setApiKey('');
      setIsApiDialogOpen(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSources([...sources, {
        id: Date.now().toString(),
        type: 'file',
        name: file.name,
        connected: true,
        details: `${(file.size / 1024).toFixed(2)} KB`,
      }]);
    }
    e.target.value = '';
  };

  const handleDisconnect = (id: string) => {
    setSources(sources.filter(s => s.id !== id));
  };

  return (
    <div className="pt-16 min-h-screen bg-muted/20">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl mb-2">Data Sources</h1>
          <p className="text-muted-foreground">
            Connect your data sources to power your boards
          </p>
        </div>

        {/* Connection Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Database className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>MongoDB</CardTitle>
              <CardDescription>
                Connect to your MongoDB database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setIsMongoDialogOpen(true)}
                className="w-full"
              >
                Connect MongoDB
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>REST API</CardTitle>
              <CardDescription>
                Connect to any REST API endpoint
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setIsApiDialogOpen(true)}
                className="w-full"
              >
                Connect API
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Upload File</CardTitle>
              <CardDescription>
                Upload CSV, Excel, or PDF files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <label htmlFor="file-upload">
                <Button 
                  className="w-full"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  type="button"
                >
                  Upload File
                </Button>
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </CardContent>
          </Card>
        </div>

        {/* Connected Sources */}
        {sources.length > 0 && (
          <div>
            <h2 className="text-xl mb-4">Connected Sources</h2>
            <div className="space-y-3">
              {sources.map((source) => (
                <Card key={source.id}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                        ${source.type === 'mongodb' ? 'bg-green-100' : ''}
                        ${source.type === 'api' ? 'bg-blue-100' : ''}
                        ${source.type === 'file' ? 'bg-purple-100' : ''}
                      `}>
                        {source.type === 'mongodb' && <Database className="h-5 w-5 text-green-600" />}
                        {source.type === 'api' && <Globe className="h-5 w-5 text-blue-600" />}
                        {source.type === 'file' && <Upload className="h-5 w-5 text-purple-600" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3>{source.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
                            Connected
                          </Badge>
                        </div>
                        {source.details && (
                          <p className="text-sm text-muted-foreground">{source.details}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleDisconnect(source.id)}
                    >
                      Disconnect
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {sources.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No sources connected yet. Connect a source above to get started.</p>
          </div>
        )}
      </div>

      {/* MongoDB Dialog */}
      <Dialog open={isMongoDialogOpen} onOpenChange={setIsMongoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect to MongoDB</DialogTitle>
            <DialogDescription>
              Enter your MongoDB connection string
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mongo-uri">Connection URI</Label>
              <Input
                id="mongo-uri"
                placeholder="mongodb://username:password@host:port/database"
                value={mongoUri}
                onChange={(e) => setMongoUri(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Note: This is a demo. Connection details are stored locally only.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMongoDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConnectMongo}>
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* API Dialog */}
      <Dialog open={isApiDialogOpen} onOpenChange={setIsApiDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect to API</DialogTitle>
            <DialogDescription>
              Enter your API endpoint and credentials
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="api-endpoint">API Endpoint</Label>
              <Input
                id="api-endpoint"
                placeholder="https://api.example.com/v1"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key (Optional)</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="your-api-key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Note: This is a demo. API keys are stored locally only.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApiDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConnectApi}>
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
