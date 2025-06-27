"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react";
import { Button } from "../../../../../../components/ui/button";
import { Input } from "../../../../../../components/ui/input";
import { Badge } from "../../../../../../components/ui/badge";
import { DataTable } from "../../../../../../components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowLeft, Search, Briefcase, Link as LinkIcon } from "lucide-react";
import { StatusBadge } from "../../../../../../components/admin/status-badge";
import Link from "next/link";
import { useParams } from "next/navigation";

interface AdAccount {
  id: string;
  name: string;
  status: "active" | "pending" | "suspended" | "inactive";
  balance: number;
  spend_limit: number;
  spent: number;
  created_at: string;
}

interface Business {
  id: string;
  name: string;
  status: "active" | "pending" | "suspended" | "inactive";
  website_url?: string;
}

export default function BusinessDetailPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const businessId = params?.businessId as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchBusinessDetails() {
      if (!businessId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/admin/businesses/${businessId}`);

        if (!response.ok) {
          setError('Failed to fetch business details');
          return;
        }

        const data = await response.json();
        setBusiness(data.business);
        setAdAccounts(data.adAccounts || []);
      } catch (err) {
        setError('An error occurred while fetching data.');
      } finally {
        setLoading(false);
      }
    }

    fetchBusinessDetails();
  }, [businessId]);

  const filteredAdAccounts = useMemo(() => {
    return adAccounts.filter((account) =>
      account.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [adAccounts, searchTerm]);

  const columns: ColumnDef<AdAccount>[] = [
    {
      accessorKey: "name",
      header: "Ad Account",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
    {
      accessorKey: "balance",
      header: "Balance",
      cell: ({ row }) => `$${row.original.balance.toLocaleString()}`,
    },
    {
      accessorKey: "spent",
      header: "Total Spent",
      cell: ({ row }) => `$${row.original.spent.toLocaleString()}`,
    },
    {
      accessorKey: "spend_limit",
      header: "Spend Limit",
      cell: ({ row }) => `$${row.original.spend_limit.toLocaleString()}`,
    },
    {
      accessorKey: "created_at",
      header: "Date Created",
      cell: ({ row }) => new Date(row.getValue("created_at")).toLocaleDateString(),
    },
  ];

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!business) return <p>Business not found.</p>;

  return (
    <div className="space-y-6">
      {/* Sleek Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/organizations/${orgId}`}>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="h-4 w-px bg-border" />
        <Briefcase className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-lg font-semibold">{business.name}</h1>
        <StatusBadge status={business.status} />
        {business.website_url && (
            <a href={business.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <LinkIcon className="h-3 w-3" />
                    Website
                </Badge>
            </a>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Ad Accounts ({filteredAdAccounts.length})</h2>
          <Input
            placeholder="Search accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
        <DataTable columns={columns} data={filteredAdAccounts} />
      </div>
    </div>
  );
} 