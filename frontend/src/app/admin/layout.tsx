import { Providers } from "@/components/providers";
import { useSuperuser } from "@/contexts/SuperuserContext";
import { Loader } from "@/components/Loader";

export default function AdminLayout({ children }) {
  const { isSuperuser, loading, error } = useSuperuser();

  if (loading) return <Loader fullScreen />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!isSuperuser) return <div className="text-red-500">Not authorized</div>;

  return <Providers>{children}</Providers>;
} 