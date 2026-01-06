import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { MapPin } from 'lucide-react';

interface Step1LocationProps {
  onNext: (data: { countyId: string; constituencyId: string; wardId: string }) => void;
  initialData: { countyId: string; constituencyId: string; wardId: string };
}

interface County {
  id: string;
  name: string;
}

interface Constituency {
  id: string;
  name: string;
}

interface Ward {
  id: string;
  name: string;
}

const Step1Location = ({ onNext, initialData }: Step1LocationProps) => {
  const [counties, setCounties] = useState<County[]>([]);
  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [selectedCounty, setSelectedCounty] = useState(initialData.countyId);
  const [selectedConstituency, setSelectedConstituency] = useState(initialData.constituencyId);
  const [selectedWard, setSelectedWard] = useState(initialData.wardId);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCounties();
  }, []);

  useEffect(() => {
    if (selectedCounty) {
      loadConstituencies(selectedCounty);
    } else {
      setConstituencies([]);
      setWards([]);
    }
  }, [selectedCounty]);

  useEffect(() => {
    if (selectedConstituency) {
      loadWards(selectedConstituency);
    } else {
      setWards([]);
    }
  }, [selectedConstituency]);

  const loadCounties = async () => {
    const { data } = await supabase
      .from('administrative_divisions')
      .select('id, name')
      .eq('country_code', 'KE')  // TODO: Make dynamic based on user's country
      .eq('governance_level', 'county')
      .order('name');

    if (data) setCounties(data);
  };

  const loadConstituencies = async (countyId: string) => {
    const { data } = await supabase
      .from('administrative_divisions')
      .select('id, name')
      .eq('country_code', 'KE')
      .eq('governance_level', 'constituency')
      .eq('parent_id', countyId)  // Filter by parent county
      .order('name');

    if (data) setConstituencies(data);
  };

  const loadWards = async (constituencyId: string) => {
    const { data } = await supabase
      .from('administrative_divisions')
      .select('id, name')
      .eq('country_code', 'KE')
      .eq('governance_level', 'ward')
      .eq('parent_id', constituencyId)  // Filter by parent constituency
      .order('name');

    if (data) setWards(data);
  };

  const handleSubmit = async () => {
    if (!selectedCounty || !selectedConstituency || !selectedWard) return;

    setLoading(true);
    onNext({
      countyId: selectedCounty,
      constituencyId: selectedConstituency,
      wardId: selectedWard,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-lg">
          <MapPin className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Your Location</h2>
          <p className="text-sm text-muted-foreground">
            Help us connect you to your local community
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="county">County *</Label>
          <Select value={selectedCounty} onValueChange={setSelectedCounty}>
            <SelectTrigger>
              <SelectValue placeholder="Select your county" />
            </SelectTrigger>
            <SelectContent>
              {counties.map((county) => (
                <SelectItem key={county.id} value={county.id}>
                  {county.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="constituency">Constituency *</Label>
          <Select
            value={selectedConstituency}
            onValueChange={setSelectedConstituency}
            disabled={!selectedCounty}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your constituency" />
            </SelectTrigger>
            <SelectContent>
              {constituencies.map((constituency) => (
                <SelectItem key={constituency.id} value={constituency.id}>
                  {constituency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ward">Ward *</Label>
          <Select
            value={selectedWard}
            onValueChange={setSelectedWard}
            disabled={!selectedConstituency}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your ward" />
            </SelectTrigger>
            <SelectContent>
              {wards.map((ward) => (
                <SelectItem key={ward.id} value={ward.id}>
                  {ward.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSubmit}
          disabled={!selectedCounty || !selectedConstituency || !selectedWard || loading}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default Step1Location;
