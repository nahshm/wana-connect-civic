import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PrivacySettings } from '@/components/privacy/PrivacySettings';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Shield, Bell, Palette, Monitor, Sun, Moon } from 'lucide-react';

const Settings = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: profile?.username || '',
    display_name: profile?.displayName || '',
    bio: profile?.bio || '',
    avatar_url: profile?.avatar || ''
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <div className="text-muted-foreground">Please sign in to access settings.</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account and privacy preferences</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Appearance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Update your profile information and how it appears to others.
                </p>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-6">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={formData.avatar_url} />
                      <AvatarFallback className="text-xl">
                        {getInitials(formData.display_name || formData.username || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <Label htmlFor="avatar_url">Avatar URL</Label>
                      <Input
                        id="avatar_url"
                        value={formData.avatar_url}
                        onChange={(e) => setFormData({...formData, avatar_url: e.target.value})}
                        placeholder="https://example.com/avatar.jpg"
                      />
                    </div>
                  </div>

                  {/* Username */}
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      placeholder="Enter your username"
                    />
                  </div>

                  {/* Display Name */}
                  <div className="space-y-2">
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      value={formData.display_name}
                      onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                      placeholder="Enter your display name"
                    />
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      placeholder="Tell us about yourself..."
                      rows={4}
                    />
                  </div>

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Updating...' : 'Update Profile'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="mt-6">
            <PrivacySettings />
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <NotificationSettingsTab />
          </TabsContent>

          <TabsContent value="appearance" className="mt-6">
            <AppearanceSettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
export default Settings;

// H5: Notification Settings Tab
function NotificationSettingsTab() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState({
    on_comment:       true,
    on_reply:         true,
    on_issue_update:  true,
    on_governance:    false,
    weekly_digest:    true,
  });

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('notification_settings').eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.notification_settings) {
          const ns = data.notification_settings as Record<string, boolean>;
          setPrefs(prev => ({ ...prev, ...ns }));
        }
      });
  }, [user]);

  const handleToggle = async (key: keyof typeof prefs) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setSaving(true);
    await supabase.from('profiles').update({ notification_settings: updated }).eq('id', user?.id ?? '');
    setSaving(false);
    toast.success('Notifications updated');
  };

  const rows = [
    { key: 'on_comment'      as const, label: 'New comments on your posts', desc: 'Get notified when someone comments on your post' },
    { key: 'on_reply'        as const, label: 'Replies to your comments',   desc: 'Get notified when someone replies to your comment' },
    { key: 'on_issue_update' as const, label: 'Issue status updates',       desc: 'When an issue you reported changes status' },
    { key: 'on_governance'   as const, label: 'Governance alerts',          desc: 'New promises, Q&A answers, and position claims in your area' },
    { key: 'weekly_digest'   as const, label: 'Weekly civic digest',        desc: 'Summary of civic activity in your region every Monday' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" />Notification Preferences</CardTitle>
        <p className="text-sm text-muted-foreground">Choose what notifications you want to receive.</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {rows.map(row => (
          <div key={row.key} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{row.label}</p>
              <p className="text-sm text-muted-foreground">{row.desc}</p>
            </div>
            <Switch checked={prefs[row.key]} onCheckedChange={() => handleToggle(row.key)} disabled={saving} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// H5: Appearance Settings Tab
function AppearanceSettingsTab() {
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>(() => {
    return (localStorage.getItem('wana-theme') as 'system' | 'light' | 'dark') || 'system';
  });
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem('wana-compact') === 'true');

  const applyTheme = (t: 'system' | 'light' | 'dark') => {
    setTheme(t);
    localStorage.setItem('wana-theme', t);
    const isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
  };

  const applyCompact = (v: boolean) => {
    setCompactMode(v);
    localStorage.setItem('wana-compact', String(v));
    document.documentElement.classList.toggle('compact', v);
  };

  const themeOptions: { value: 'system' | 'light' | 'dark'; label: string; icon: React.ReactNode }[] = [
    { value: 'system', label: 'System',   icon: <Monitor className="w-4 h-4" /> },
    { value: 'light',  label: 'Light',    icon: <Sun className="w-4 h-4" /> },
    { value: 'dark',   label: 'Dark',     icon: <Moon className="w-4 h-4" /> },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5" />Appearance Settings</CardTitle>
        <p className="text-sm text-muted-foreground">Customize how the interface looks and feels.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme selection */}
        <div>
          <Label className="text-base font-medium mb-3 block">Theme</Label>
          <div className="flex gap-3">
            {themeOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => applyTheme(opt.value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-colors text-sm font-medium ${
                  theme === opt.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Compact mode */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Compact Mode</p>
            <p className="text-sm text-muted-foreground">Reduce spacing for a denser information layout</p>
          </div>
          <Switch checked={compactMode} onCheckedChange={applyCompact} />
        </div>
      </CardContent>
    </Card>
  );
}
