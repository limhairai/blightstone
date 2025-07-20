create or replace function transfer_funds_between_org_and_ad_account(
    p_organization_id uuid,
    p_ad_account_id uuid,
    p_amount_cents bigint
)
returns void as $$
declare
    current_org_balance_cents bigint;
begin
    -- Check for positive amount
    if p_amount_cents <= 0 then
        raise exception 'Amount must be positive';
    end if;

    -- Get current organization balance and lock the row
    select balance_cents into current_org_balance_cents
    from organizations
    where id = p_organization_id
    for update;

    -- Check for sufficient funds
    if current_org_balance_cents is null or current_org_balance_cents < p_amount_cents then
        raise exception 'Insufficient funds in organization wallet';
    end if;

    -- Perform the transfer
    update organizations
    set balance_cents = balance_cents - p_amount_cents
    where id = p_organization_id;

    update ad_accounts
    set balance_cents = balance_cents + p_amount_cents
    where id = p_ad_account_id;

    -- Record the transaction
    insert into wallet_transactions(organization_id, ad_account_id, amount_cents, type, description)
    values (
        p_organization_id,
        p_ad_account_id,
        p_amount_cents,
        'internal_transfer',
        'Transfer from organization wallet to ad account'
    );
end;
$$ language plpgsql; 