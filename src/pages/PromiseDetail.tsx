import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Target, Users, MapPin, Calendar, DollarSign, CheckCircle, AlertTriangle, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { DevelopmentPromise, PromiseVerification, Official } from '@/types';

const PromiseDetail = () => {
  const { promiseId } = useParams<{ promiseId: string }>();
  const [promise, setPromise] = useState<DevelopmentPromise | null>(null);
  const [official, setOfficial] = useState<Official | null>(null);
  const [verifications, setVerifications] = useState<PromiseVerification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (promiseId) {
      fetchPromiseData();
    }
  }, [promiseId]);

  const fetchPromiseData = async () => {
    try {
      // Fetch promise details
      const { data: promiseData, error: promiseError } = await supabase
        .from('development_promises')
        .select('*')
        .eq('id', promiseId)
        .single();

      if (promiseError) throw promiseError;
      setPromise(promiseData);

      // Fetch official details
      if (promiseData.official_id) {
        const { data: officialData, error: officialError } = await supabase
          .from('officials')
          .select('*')
          .eq('id', promiseData.official_id)
          .single();

        if (!officialError) {
          setOfficial(officialData);
        }
      }

      // Fetch verifications
      const { data: verificationsData, error: verificationsError } = await supabase
        .from('promise_verifications')
        .select('*')
        .eq('promise_id', promiseId)
        .order('created_at', { ascending: false });

      if (!verificationsError) {
        setVerifications((verificationsData as any) || []);
      }
    } catch (error) {
      console.error('Error fetching promise data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'ongoing': return <Target className="w-5 h-5 text-blue-500" />;
      case 'not_started': return <Calendar className="w-5 h-5 text-gray-500" />;
      case 'cancelled': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <Target className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'ongoing': return 'bg-blue-500';
      case 'not_started': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading promise details...</div>
        </div>
      </div>
    );
  }

  if (!promise) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Promise not found</h3>
            <p className="text-muted-foreground">The requested promise could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-6">
          {getStatusIcon(promise.status)}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{promise.title}</h1>
            <div className="flex items-center gap-4 mb-4">
              <Badge className={`${getStatusColor(promise.status)} text-white`}>
                {promise.status.replace('_', ' ').toUpperCase()}
              </Badge>
              {promise.category && (
                <Badge variant="outline">{promise.category}</Badge>
              )}
            </div>
            {promise.description && (
              <p className="text-lg text-muted-foreground">{promise.description}</p>
            )}
          </div>
        </div>

        {/* Official Information */}
        {official && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Responsible Official
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={official.photo_url} />
                  <AvatarFallback className="text-lg">
                    {getInitials(official.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{official.name}</h3>
                  <p className="text-muted-foreground">{official.position}</p>
                  <p className="text-sm text-muted-foreground">
                    {official.constituency && `${official.constituency}, `}{official.county}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Promise Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Completion</span>
                    <span>{promise.progress_percentage}%</span>
                  </div>
                  <Progress value={promise.progress_percentage} className="h-3" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget */}
          {(promise.budget_allocated || promise.budget_used) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Budget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {promise.budget_allocated && (
                    <div className="flex justify-between">
                      <span className="text-sm">Allocated:</span>
                      <span className="font-semibold">
                        {formatCurrency(promise.budget_allocated / 1000000)}M
                      </span>
                    </div>
                  )}
                  {promise.budget_used && (
                    <div className="flex justify-between">
                      <span className="text-sm">Used:</span>
                      <span className="font-semibold">
                        {formatCurrency(promise.budget_used / 1000000)}M
                      </span>
                    </div>
                  )}
                  {promise.funding_source && (
                    <div className="pt-2 border-t">
                      <span className="text-sm text-muted-foreground">Source: {promise.funding_source}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Impact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {promise.beneficiaries_count && (
                  <div className="flex justify-between">
                    <span className="text-sm">Beneficiaries:</span>
                    <span className="font-semibold">
                      {promise.beneficiaries_count.toLocaleString()}
                    </span>
                  </div>
                )}
                {promise.location && (
                  <div className="flex items-center gap-2 pt-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{promise.location}</span>
                  </div>
                )}
                {promise.contractor && (
                  <div className="pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Contractor: {promise.contractor}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Community Verification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Community Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="verifications" className="w-full">
              <TabsList>
                <TabsTrigger value="verifications">Verifications ({verifications.length})</TabsTrigger>
                <TabsTrigger value="add-verification">Add Verification</TabsTrigger>
              </TabsList>

              <TabsContent value="verifications" className="mt-6">
                {verifications.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No verifications yet</h3>
                    <p className="text-muted-foreground">Be the first to verify this promise's progress.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {verifications.map((verification) => (
                      <Card key={verification.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="font-semibold">{verification.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                by {verification.verifier_name || 'Anonymous'} • {new Date(verification.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant={verification.status === 'verified' ? 'default' : 'secondary'}>
                              {verification.status}
                            </Badge>
                          </div>

                          <p className="mb-4">{verification.description}</p>

                          {verification.claimed_progress && (
                            <div className="mb-4">
                              <div className="flex justify-between text-sm mb-1">
                                <span>Claimed Progress</span>
                                <span>{verification.claimed_progress}%</span>
                              </div>
                              <Progress value={verification.claimed_progress} className="h-2" />
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="w-4 h-4" />
                              <span>{verification.upvotes || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ThumbsDown className="w-4 h-4" />
                              <span>{verification.downvotes || 0}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="add-verification" className="mt-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">Add Verification</h3>
                      <p className="text-muted-foreground mb-4">
                        Help verify this promise's progress by sharing evidence and updates.
                      </p>
                      <Button>Add Verification</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PromiseDetail;
