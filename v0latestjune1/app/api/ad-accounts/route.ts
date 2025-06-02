import { NextResponse } from "next/server"

// Mock data for ad accounts
const adAccounts = [
  {
    id: "1",
    name: "Primary Ad Account",
    accountId: "123456789",
    status: "Active",
    spendLimit: "$1,000",
    dateAdded: "2023-10-15",
  },
  {
    id: "2",
    name: "Secondary Campaign",
    accountId: "987654321",
    status: "Active",
    spendLimit: "$2,500",
    dateAdded: "2023-11-02",
  },
  {
    id: "3",
    name: "Test Account",
    accountId: "456789123",
    status: "Active",
    spendLimit: "$500",
    dateAdded: "2023-12-10",
  },
]

export async function GET() {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  return NextResponse.json({ adAccounts })
}

export async function POST(request: Request) {
  const data = await request.json()

  // Simulate creating a new ad account
  const newAccount = {
    id: `${adAccounts.length + 1}`,
    name: data.name || "New Ad Account",
    accountId: Math.floor(Math.random() * 1000000000).toString(),
    status: "Pending",
    spendLimit: data.spendLimit || "$500",
    dateAdded: new Date().toISOString().split("T")[0],
  }

  // In a real app, you would save this to a database

  return NextResponse.json({
    success: true,
    message: "Ad account request submitted successfully",
    account: newAccount,
  })
}
