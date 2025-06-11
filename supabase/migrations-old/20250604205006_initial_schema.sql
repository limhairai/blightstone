-- profiles table
CREATE TABLE public.profiles (
    id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    name text,
    avatar_url text,
    email text UNIQUE, -- Storing email here can be useful for direct queries, ensure it's kept in sync
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (id)
);

-- Enable Row Level Security for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can read their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Authenticated users can read all profiles" -- Adjust as needed, e.g., to restrict to organization members
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Function to create a profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name', -- Example: if you capture full_name during sign-up in metadata
    NEW.raw_user_meta_data->>'avatar_url' -- Example: if you capture avatar_url during sign-up in metadata
  );
  RETURN NEW;
END;
$$;

-- Trigger to call handle_new_user on new user sign-up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Optional: Function to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Optional: Apply the update trigger to profiles table
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- organizations table
CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    owner_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE, -- The user who initially created/owns the org
    avatar_url text,
    plan_id text DEFAULT 'free'::text, -- Example: 'free', 'bronze', 'silver', 'gold'
    ad_spend_monthly text, -- Consider if this should be a numeric type or structured JSON
    support_channel_type text, -- Example: 'email', 'slack'
    support_channel_contact text, -- Example: email address or Slack handle/channel
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security for organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Apply the updated_at trigger to organizations table
CREATE TRIGGER set_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Indexes for organizations
CREATE INDEX idx_organizations_owner_id ON public.organizations(owner_id);

-- Policies for organizations (basic starter policies, will need refinement)
-- CREATE POLICY "Users can read organizations they are a member of"  -- Commented out to fix dependency
--     ON public.organizations FOR SELECT
--     USING (EXISTS (
--         SELECT 1 FROM public.organization_members om
--         WHERE om.organization_id = public.organizations.id AND om.user_id = auth.uid()
--     ));

CREATE POLICY "Organization owners can update their own organizations"
    ON public.organizations FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Organization owners can delete their own organizations" 
    ON public.organizations FOR DELETE
    USING (auth.uid() = owner_id);

-- Note: Creating organizations will likely be handled by a secure Edge Function or backend logic
-- as it involves setting the owner_id correctly and potentially other setup.
-- A simple "Users can insert organizations" policy can be too permissive initially:
-- CREATE POLICY "Authenticated users can create organizations"
--     ON public.organizations FOR INSERT
--     TO authenticated
--     WITH CHECK (auth.uid() = owner_id); 
-- (The CHECK auth.uid() = owner_id assumes owner_id is supplied by client, which is not secure.
--  Better to use an Edge Function that sets owner_id to auth.uid() from the session.)

-- organization_members table (junction table)
CREATE TABLE public.organization_members (
    organization_id uuid NOT NULL REFERENCES public.organizations ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'member'::text, -- e.g., 'owner', 'admin', 'member'
    joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (organization_id, user_id) -- Composite primary key
);

-- Enable Row Level Security for organization_members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Indexes for organization_members
CREATE INDEX idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX idx_organization_members_organization_id ON public.organization_members(organization_id);

-- Now, re-define the policy for reading organizations that depends on organization_members
CREATE POLICY "Users can read organizations they are a member of"
    ON public.organizations FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = public.organizations.id AND om.user_id = auth.uid()
    ));

-- Policies for organization_members
CREATE POLICY "Organization members can view other members of the same organization"
    ON public.organization_members FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.organization_members om_check
        WHERE om_check.organization_id = public.organization_members.organization_id
        AND om_check.user_id = auth.uid()
    ));

CREATE POLICY "Organization owners/admins can add members to their organization"
    ON public.organization_members FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.organization_members om_check
        WHERE om_check.organization_id = public.organization_members.organization_id
        AND om_check.user_id = auth.uid()
        AND (om_check.role = 'owner' OR om_check.role = 'admin')
    ));

CREATE POLICY "Organization owners/admins can update member roles"
    ON public.organization_members FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.organization_members om_check
        WHERE om_check.organization_id = public.organization_members.organization_id
        AND om_check.user_id = auth.uid()
        AND (om_check.role = 'owner' OR om_check.role = 'admin')
    ))
    WITH CHECK (EXISTS ( -- Add a check to prevent self-role update or demoting the last owner if needed
        SELECT 1 FROM public.organization_members om_check
        WHERE om_check.organization_id = public.organization_members.organization_id
        AND om_check.user_id = auth.uid()
        AND (om_check.role = 'owner' OR om_check.role = 'admin')
    ));

CREATE POLICY "Organization owners/admins can remove members (except themselves if last owner)"
    ON public.organization_members FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.organization_members om_check
        WHERE om_check.organization_id = public.organization_members.organization_id
        AND om_check.user_id = auth.uid()
        AND (om_check.role = 'owner' OR om_check.role = 'admin')
        AND public.organization_members.user_id != auth.uid() -- Prevent self-removal through this policy directly
    ));
-- More complex logic for "last owner cannot be removed/demoted" might require triggers or SECURITY DEFINER functions.

-- projects table
CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations ON DELETE CASCADE,
    name text NOT NULL,
    website_url text, -- Main website URL for the project
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security for projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Apply the updated_at trigger to projects table
CREATE TRIGGER set_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Indexes for projects
CREATE INDEX idx_projects_organization_id ON public.projects(organization_id);

-- Policies for projects
CREATE POLICY "Users can read projects of organizations they are a member of"
    ON public.projects FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = public.projects.organization_id AND om.user_id = auth.uid()
    ));

CREATE POLICY "Org owners/admins can create projects for their organization"
    ON public.projects FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = public.projects.organization_id
        AND om.user_id = auth.uid()
        AND (om.role = 'owner' OR om.role = 'admin')
    ));

CREATE POLICY "Org owners/admins can update projects in their organization"
    ON public.projects FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = public.projects.organization_id
        AND om.user_id = auth.uid()
        AND (om.role = 'owner' OR om.role = 'admin')
    ));

CREATE POLICY "Org owners/admins can delete projects in their organization"
    ON public.projects FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = public.projects.organization_id
        AND om.user_id = auth.uid()
        AND (om.role = 'owner' OR om.role = 'admin')
    ));

-- project_domains table (to store multiple domains per project)
CREATE TABLE public.project_domains (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    project_id uuid NOT NULL REFERENCES public.projects ON DELETE CASCADE,
    domain_name text NOT NULL UNIQUE, -- Ensuring domain names are unique across all projects
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
    -- No updated_at here as domains are usually set and not frequently updated; if updated, it's often a delete & re-add.
);

-- Enable Row Level Security for project_domains
ALTER TABLE public.project_domains ENABLE ROW LEVEL SECURITY;

-- Indexes for project_domains
CREATE INDEX idx_project_domains_project_id ON public.project_domains(project_id);

-- Policies for project_domains
CREATE POLICY "Users can read domains of projects they have access to"
    ON public.project_domains FOR SELECT
    USING (EXISTS (
        SELECT 1
        FROM public.projects p
        JOIN public.organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = public.project_domains.project_id AND om.user_id = auth.uid()
    ));

CREATE POLICY "Org owners/admins can manage domains for their projects"
    ON public.project_domains FOR ALL -- Covers INSERT, UPDATE, DELETE
    USING (EXISTS (
        SELECT 1
        FROM public.projects p
        JOIN public.organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = public.project_domains.project_id
        AND om.user_id = auth.uid()
        AND (om.role = 'owner' OR om.role = 'admin')
    ))
    WITH CHECK (EXISTS ( -- Ensure the user performing the action is an owner/admin of the project's organization
        SELECT 1
        FROM public.projects p
        JOIN public.organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = public.project_domains.project_id
        AND om.user_id = auth.uid()
        AND (om.role = 'owner' OR om.role = 'admin')
    ));

-- wallets table
CREATE TABLE public.wallets (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations ON DELETE CASCADE, -- Each org has one wallet
    balance_cents bigint NOT NULL DEFAULT 0, -- Store currency in cents to avoid floating point issues
    currency char(3) NOT NULL DEFAULT 'USD', -- ISO 4217 currency code
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security for wallets
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Apply the updated_at trigger to wallets table
CREATE TRIGGER set_wallets_updated_at
BEFORE UPDATE ON public.wallets
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Indexes for wallets
CREATE INDEX idx_wallets_organization_id ON public.wallets(organization_id);

-- Policies for wallets
CREATE POLICY "Org members can view their organization's wallet"
    ON public.wallets FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = public.wallets.organization_id AND om.user_id = auth.uid()
    ));

-- Note: Updating wallet balances (e.g., deposits, withdrawals, spend deductions) should be handled by
-- secure backend logic (e.g., Edge Functions or your API) and not direct client updates.
-- So, we might not have direct INSERT/UPDATE/DELETE policies for clients on this table.


-- transactions table
CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    wallet_id uuid NOT NULL REFERENCES public.wallets ON DELETE CASCADE,
    organization_id uuid NOT NULL REFERENCES public.organizations ON DELETE CASCADE, -- Denormalized for easier querying/RLS, ensure consistency
    project_id uuid REFERENCES public.projects ON DELETE SET NULL, -- Optional: link transaction to a specific project
    type text NOT NULL, -- e.g., 'deposit', 'withdrawal', 'ad_spend', 'refund', 'adjustment'
    amount_cents bigint NOT NULL, -- Can be positive (deposit/refund) or negative (withdrawal/spend)
    description text,
    status text NOT NULL DEFAULT 'pending'::text, -- e.g., 'pending', 'completed', 'failed', 'cancelled'
    metadata jsonb, -- For storing any extra relevant info, like payment gateway IDs, ad campaign IDs, etc.
    transaction_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL, -- When the transaction occurred
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security for transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Apply the updated_at trigger to transactions table
CREATE TRIGGER set_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Indexes for transactions
CREATE INDEX idx_transactions_wallet_id ON public.transactions(wallet_id);
CREATE INDEX idx_transactions_organization_id ON public.transactions(organization_id);
CREATE INDEX idx_transactions_project_id ON public.transactions(project_id);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_transaction_date ON public.transactions(transaction_date);


-- Policies for transactions
CREATE POLICY "Org members can view transactions for their organization"
    ON public.transactions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = public.transactions.organization_id AND om.user_id = auth.uid()
    ));

-- Note: Creating and updating transactions should primarily be handled by secure backend logic.
-- Direct client inserts could be risky for financial data.
-- For example, an Edge Function would verify payment, then create a 'deposit' transaction.
