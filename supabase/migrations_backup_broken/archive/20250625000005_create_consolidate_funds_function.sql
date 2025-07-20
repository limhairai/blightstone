CREATE OR REPLACE FUNCTION consolidate_funds_from_accounts(
    p_org_id UUID,
    p_ad_account_ids UUID[]
)
RETURNS VOID AS $$
DECLARE
    v_total_amount_to_consolidate BIGINT := 0;
    v_account_balance BIGINT;
    v_ad_account_id UUID;
    v_org_wallet_id UUID;
BEGIN
    -- Get the organization's main wallet
    SELECT id INTO v_org_wallet_id FROM wallets WHERE organization_id = p_org_id AND type = 'main' LIMIT 1;

    IF v_org_wallet_id IS NULL THEN
        RAISE EXCEPTION 'Organization wallet not found for organization %', p_org_id;
    END IF;

    -- 1. Calculate the total amount to be consolidated and create withdrawal transactions
    FOREACH v_ad_account_id IN ARRAY p_ad_account_ids
    LOOP
        -- Get current balance of the ad account
        SELECT balance_cents INTO v_account_balance FROM ad_accounts WHERE id = v_ad_account_id;

        IF v_account_balance > 0 THEN
            v_total_amount_to_consolidate := v_total_amount_to_consolidate + v_account_balance;

            -- Create a 'withdrawal' transaction for the ad account
            INSERT INTO transactions(organization_id, ad_account_id, type, amount_cents, status, description)
            VALUES (p_org_id, v_ad_account_id, 'withdrawal', -v_account_balance, 'completed', 'Consolidated funds to main wallet');
        END IF;
    END LOOP;

    -- If there's nothing to consolidate, exit
    IF v_total_amount_to_consolidate <= 0 THEN
        RETURN;
    END IF;
    
    -- 2. Zero out the balances of the selected ad accounts
    UPDATE ad_accounts
    SET balance_cents = 0
    WHERE id = ANY(p_ad_account_ids);

    -- 3. Increment the organization's wallet balance
    UPDATE wallets
    SET balance_cents = balance_cents + v_total_amount_to_consolidate
    WHERE id = v_org_wallet_id;

    -- 4. Create a 'consolidation' transaction for the main wallet
    INSERT INTO transactions(organization_id, wallet_id, type, amount_cents, status, description)
    VALUES (p_org_id, v_org_wallet_id, 'consolidation', v_total_amount_to_consolidate, 'completed', 'Consolidated funds from ad accounts');

END;
$$ LANGUAGE plpgsql; 