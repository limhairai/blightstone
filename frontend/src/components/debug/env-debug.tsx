"use client"

export function EnvDebug() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  return (
    <div className="fixed bottom-4 left-4 bg-black text-white p-4 rounded-lg text-xs max-w-md z-50">
      <h3 className="font-bold mb-2">Environment Debug</h3>
      <div>
        <strong>Supabase URL:</strong> {supabaseUrl ? '✅ Set' : '❌ Missing'}
      </div>
      <div>
        <strong>Supabase Anon Key:</strong> {supabaseAnonKey ? '✅ Set' : '❌ Missing'}
      </div>
      {supabaseUrl && (
        <div className="mt-2 text-green-300">
          URL: {supabaseUrl.substring(0, 30)}...
        </div>
      )}
    </div>
  );
} 