CREATE OR REPLACE FUNCTION distribute_funds_to_accounts(
    p_org_id UUID,
    p_total_amount_cents BIGINT,
    p_distributions JSONB
)
RETURNS VOID AS $$
DECLARE
    dist_record JSONB;
    v_ad_account_id UUID;
    v_amount_cents BIGINT;
    v_org_wallet_id UUID;
BEGIN
    -- Get the organization's main wallet
    SELECT id INTO v_org_wallet_id FROM wallets WHERE organization_id = p_org_id AND type = 'main' LIMIT 1;

    IF v_org_wallet_id IS NULL THEN
        RAISE EXCEPTION 'Organization wallet not found for organization %', p_org_id;
    END IF;

    -- 1. Decrement the organization's wallet balance
    UPDATE wallets
    SET balance_cents = balance_cents - p_total_amount_cents
    WHERE id = v_org_wallet_id AND balance_cents >= p_total_amount_cents;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient funds in organization wallet %', p_org_id;
    END IF;

    -- 2. Create a 'distribution' transaction for the main wallet
    INSERT INTO transactions(organization_id, wallet_id, type, amount_cents, status, description)
    VALUES (p_org_id, v_org_wallet_id, 'distribution', -p_total_amount_cents, 'completed', 'Distributed funds to ad accounts');

    -- 3. Loop through distributions and update ad account balances
    FOR dist_record IN SELECT * FROM jsonb_array_elements(p_distributions)
    LOOP
        v_ad_account_id := (dist_record->>'ad_account_id')::UUID;
        v_amount_cents := (dist_record->>'amount_cents')::BIGINT;

        IF v_amount_cents > 0 THEN
            -- Increment ad account balance
            UPDATE ad_accounts
            SET balance_cents = balance_cents + v_amount_cents
            WHERE id = v_ad_account_id;

            -- Create a 'topup' transaction for the ad account
            INSERT INTO transactions(organization_id, ad_account_id, type, amount_cents, status, description)
            VALUES (p_org_id, v_ad_account_id, 'topup', v_amount_cents, 'completed', 'Funds distributed from main wallet');
        END IF;
    END LOOP;

END;
$$ LANGUAGE plpgsql; 