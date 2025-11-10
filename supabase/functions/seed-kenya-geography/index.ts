import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sample Kenya geographic data - In production, this should come from a comprehensive CSV/JSON file
const kenyaData = {
  counties: [
    { name: 'Nairobi', population: 4397073 },
    { name: 'Mombasa', population: 1208333 },
    { name: 'Kisumu', population: 1155574 },
    { name: 'Nakuru', population: 2162202 },
    { name: 'Kiambu', population: 2417735 },
  ],
  constituencies: {
    'Nairobi': [
      { name: 'Westlands' },
      { name: 'Dagoretti North' },
      { name: 'Dagoretti South' },
      { name: 'Langata' },
      { name: 'Kibra' },
      { name: 'Roysambu' },
      { name: 'Kasarani' },
      { name: 'Ruaraka' },
      { name: 'Embakasi South' },
      { name: 'Embakasi North' },
      { name: 'Embakasi Central' },
      { name: 'Embakasi East' },
      { name: 'Embakasi West' },
      { name: 'Makadara' },
      { name: 'Kamukunji' },
      { name: 'Starehe' },
      { name: 'Mathare' },
    ],
    'Mombasa': [
      { name: 'Changamwe' },
      { name: 'Jomvu' },
      { name: 'Kisauni' },
      { name: 'Nyali' },
      { name: 'Likoni' },
      { name: 'Mvita' },
    ],
    'Kisumu': [
      { name: 'Kisumu East' },
      { name: 'Kisumu West' },
      { name: 'Kisumu Central' },
      { name: 'Seme' },
      { name: 'Nyando' },
      { name: 'Muhoroni' },
      { name: 'Nyakach' },
    ],
  },
  wards: {
    'Westlands': ['Kitisuru', 'Parklands/Highridge', 'Karura', 'Kangemi', 'Mountain View'],
    'Kamukunji': ['Pumwani', 'Eastleigh North', 'Eastleigh South', 'Airbase', 'California'],
    'Starehe': ['Nairobi Central', 'Ngara', 'Ziwani/Kariokor', 'Landimawe', 'Nairobi South'],
    'Changamwe': ['Port Reitz', 'Kipevu', 'Airport', 'Changamwe', 'Chaani'],
    'Kisumu East': ['Kajulu', 'Kolwa East', 'Manyatta B', 'Kolwa Central', 'Nyalenda A'],
  }
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Check if data already exists
    const { count } = await supabaseClient
      .from('counties')
      .select('*', { count: 'exact', head: true });

    if (count && count > 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Geographic data already seeded',
          existing_counties: count 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Insert counties
    const countyInserts = kenyaData.counties.map(county => ({
      name: county.name,
      country: 'Kenya',
      population: county.population,
    }));

    const { data: insertedCounties, error: countyError } = await supabaseClient
      .from('counties')
      .insert(countyInserts)
      .select();

    if (countyError) throw countyError;

    // Create a map of county names to IDs
    const countyMap = new Map(
      insertedCounties.map(c => [c.name, c.id])
    );

    // Insert constituencies
    const constituencyInserts: any[] = [];
    for (const [countyName, constituencies] of Object.entries(kenyaData.constituencies)) {
      const countyId = countyMap.get(countyName);
      if (countyId) {
        constituencies.forEach(constituency => {
          constituencyInserts.push({
            name: constituency.name,
            county_id: countyId,
          });
        });
      }
    }

    const { data: insertedConstituencies, error: constituencyError } = await supabaseClient
      .from('constituencies')
      .insert(constituencyInserts)
      .select();

    if (constituencyError) throw constituencyError;

    // Create a map of constituency names to IDs
    const constituencyMap = new Map(
      insertedConstituencies.map(c => [c.name, c.id])
    );

    // Insert wards
    const wardInserts: any[] = [];
    for (const [constituencyName, wards] of Object.entries(kenyaData.wards)) {
      const constituencyId = constituencyMap.get(constituencyName);
      if (constituencyId) {
        wards.forEach(wardName => {
          wardInserts.push({
            name: wardName,
            constituency_id: constituencyId,
          });
        });
      }
    }

    const { data: insertedWards, error: wardError } = await supabaseClient
      .from('wards')
      .insert(wardInserts)
      .select();

    if (wardError) throw wardError;

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Kenya geographic data seeded successfully',
        stats: {
          counties: insertedCounties.length,
          constituencies: insertedConstituencies.length,
          wards: insertedWards.length,
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error seeding geographic data:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
