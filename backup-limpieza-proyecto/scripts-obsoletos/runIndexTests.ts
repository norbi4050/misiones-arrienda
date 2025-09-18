import { createServerSupabase } from "../src/lib/supabase/server";

async function run() {
  const supabase = createServerSupabase();

  // 1. Run the index creation script
  const indexSql = `
    create extension if not exists pg_trgm;

    create index if not exists idx_property_city_trgm
      on public."Property" using gin (lower(city) gin_trgm_ops);

    create index if not exists idx_property_province_trgm
      on public."Property" using gin (lower(province) gin_trgm_ops);

    create index if not exists idx_property_price
      on public."Property" (price);

    create index if not exists idx_property_created_at
      on public."Property" (created_at);

    create index if not exists idx_property_id
      on public."Property" (id);

    create index if not exists idx_property_bedrooms
      on public."Property" (bedrooms);

    create index if not exists idx_property_bathrooms
      on public."Property" (bathrooms);

    create index if not exists idx_property_property_type
      on public."Property" (property_type);

    create index if not exists idx_property_published_active
      on public."Property" (status, isActive)
      where status = 'PUBLISHED' and isActive = true;
  `;

  console.log("Creating indexes...");
  let { error } = await supabase.rpc('sql', { query: indexSql });
  if (error) {
    console.error("Error creating indexes:", error);
    return;
  }
  console.log("Indexes created successfully.");

  // 2. Run EXPLAIN ANALYZE queries
  const explainQueries = [
    `EXPLAIN ANALYZE
     select * from public."Property"
     where lower(province) ilike '%mi%'
     order by created_at desc
     limit 12;`,

    `EXPLAIN ANALYZE
     select * from public."Property"
     order by id desc
     limit 12;`
  ];

  for (const query of explainQueries) {
    console.log("Running EXPLAIN ANALYZE for query:\n", query);
    const { data, error } = await supabase.rpc('sql', { query });
    if (error) {
      console.error("Error running EXPLAIN ANALYZE:", error);
      continue;
    }
    console.log("EXPLAIN ANALYZE result:", data);
  }

  // 3. List indexes
  const listIndexesQuery = `
    SELECT schemaname, tablename, indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'Property'
    ORDER BY indexname;
  `;

  console.log("Listing indexes...");
  const { data: indexes, error: listError } = await supabase.rpc('sql', { query: listIndexesQuery });
  if (listError) {
    console.error("Error listing indexes:", listError);
    return;
  }
  console.log("Indexes on Property table:", indexes);
}

run().catch(console.error);
