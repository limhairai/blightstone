import pytest
from datetime import datetime, timedelta
from decimal import Decimal

# Business Logic Unit Tests - Pure Functions Only

class TestSubscriptionLogic:
    """Test subscription plan calculations and limits."""
    
    def test_calculate_subscription_fee_basic(self):
        """Test basic subscription fee calculation."""
        # These would be pure functions that calculate fees
        fees = {
            'starter': 29,
            'growth': 149,
            'scale': 499,
            'enterprise': 1499
        }
        
        for plan, expected_fee in fees.items():
            assert calculate_monthly_fee(plan) == expected_fee
    
    def test_calculate_subscription_fee_prorated(self):
        """Test prorated subscription fee calculation."""
        # Test 15 days of starter plan (half month)
        fee = calculate_prorated_fee('starter', 15, 30)
        assert fee == 14.50  # $29 / 2
        
        # Test 10 days of growth plan (1/3 month)
        fee = calculate_prorated_fee('growth', 10, 30)
        assert fee == 49.67  # $149 / 3, rounded
    
    def test_calculate_ad_spend_fee(self):
        """Test ad spend fee calculation by plan."""
        test_cases = [
            ('starter', 1000, 60),    # 6% of $1000
            ('growth', 1000, 30),     # 3% of $1000
            ('scale', 1000, 15),      # 1.5% of $1000
            ('enterprise', 1000, 10), # 1% of $1000
        ]
        
        for plan, spend, expected_fee in test_cases:
            fee = calculate_ad_spend_fee(plan, spend)
            assert fee == expected_fee
    
    def test_get_plan_limits(self):
        """Test subscription plan limits."""
        limits = get_subscription_limits('starter')
        assert limits['business_managers'] == 1
        assert limits['ad_accounts'] == 5
        assert limits['team_members'] == 2
        assert limits['monthly_topup_limit'] == 6000
        
        # Test enterprise unlimited
        limits = get_subscription_limits('enterprise')
        assert limits['business_managers'] == -1  # unlimited
        assert limits['ad_accounts'] == -1
        assert limits['team_members'] == -1
        assert limits['monthly_topup_limit'] == -1
    
    def test_plan_upgrade_cost(self):
        """Test cost calculation for plan upgrades."""
        # Upgrade from starter to growth
        cost = calculate_upgrade_cost('starter', 'growth', 20)  # 20 days remaining
        expected = (149 - 29) * (20 / 30)  # Prorated difference
        assert abs(cost - expected) < 0.01  # Allow for rounding


class TestTopupLogic:
    """Test topup request validation and calculations."""
    
    def test_validate_topup_amount_basic(self):
        """Test basic topup amount validation."""
        # Valid amounts
        assert validate_topup_amount(100) == True
        assert validate_topup_amount(1000.50) == True
        
        # Invalid amounts
        assert validate_topup_amount(0) == False
        assert validate_topup_amount(-100) == False
        assert validate_topup_amount(None) == False
    
    def test_validate_topup_amount_with_limits(self):
        """Test topup amount validation with plan limits."""
        # Starter plan: $6000 monthly limit, but individual requests can be up to that limit
        assert validate_topup_amount(4000, 'starter') == True
        assert validate_topup_amount(6000, 'starter') == True  # At the limit
        assert validate_topup_amount(7000, 'starter') == False  # Above the limit
        
        # Enterprise plan: unlimited
        assert validate_topup_amount(50000, 'enterprise') == True
    
    def test_calculate_monthly_usage(self):
        """Test monthly topup usage calculation."""
        requests = [
            {'amount_cents': 50000, 'status': 'completed'},   # $500
            {'amount_cents': 30000, 'status': 'pending'},     # $300
            {'amount_cents': 20000, 'status': 'processing'},  # $200
            {'amount_cents': 10000, 'status': 'failed'},      # $100 - shouldn't count
        ]
        
        usage = calculate_monthly_usage(requests)
        assert usage == 1000  # $500 + $300 + $200 = $1000
    
    def test_check_monthly_limit(self):
        """Test monthly limit checking."""
        # Within limit
        assert check_monthly_limit(2000, 'starter', 3000) == True  # $2000 + $3000 < $6000
        
        # Exceeds limit
        assert check_monthly_limit(4000, 'starter', 3000) == False  # $4000 + $3000 > $6000
        
        # Enterprise unlimited
        assert check_monthly_limit(50000, 'enterprise', 100000) == True
    
    def test_calculate_available_balance(self):
        """Test available balance calculation."""
        # Total balance - reserved balance
        available = calculate_available_balance(100000, 20000)  # $1000 - $200
        assert available == 80000  # $800
        
        # No reserved balance
        available = calculate_available_balance(100000, 0)
        assert available == 100000  # $1000
    
    def test_validate_payment_method(self):
        """Test payment method validation."""
        valid_methods = ['crypto', 'bank_transfer', 'credit_card']
        
        for method in valid_methods:
            assert validate_payment_method(method) == True
        
        invalid_methods = ['paypal', 'cash', '', None]
        for method in invalid_methods:
            assert validate_payment_method(method) == False


class TestWalletLogic:
    """Test wallet balance and transaction calculations."""
    
    def test_calculate_balance_after_topup(self):
        """Test balance calculation after topup."""
        current_balance = 50000  # $500
        topup_amount = 100000    # $1000
        
        new_balance = calculate_balance_after_topup(current_balance, topup_amount)
        assert new_balance == 150000  # $1500
    
    def test_calculate_balance_after_spend(self):
        """Test balance calculation after spending."""
        current_balance = 100000  # $1000
        spend_amount = 30000      # $300
        
        new_balance = calculate_balance_after_spend(current_balance, spend_amount)
        assert new_balance == 70000  # $700
    
    def test_validate_spend_amount(self):
        """Test spend amount validation."""
        available_balance = 100000  # $1000
        
        # Valid spend
        assert validate_spend_amount(50000, available_balance) == True  # $500
        
        # Invalid spend (exceeds balance)
        assert validate_spend_amount(150000, available_balance) == False  # $1500
        
        # Invalid spend (negative)
        assert validate_spend_amount(-10000, available_balance) == False
    
    def test_calculate_transaction_fee(self):
        """Test transaction fee calculation."""
        # Crypto: 0.5% fee
        fee = calculate_transaction_fee(100000, 'crypto')  # $1000
        assert fee == 500  # $5
        
        # Bank transfer: $2 flat fee
        fee = calculate_transaction_fee(100000, 'bank_transfer')
        assert fee == 200  # $2
        
        # Credit card: 2.9% + $0.30
        fee = calculate_transaction_fee(100000, 'credit_card')
        assert fee == 2930  # $29 + $0.30 = $29.30 (not $32.30)


class TestValidationLogic:
    """Test validation functions."""
    
    def test_validate_email(self):
        """Test email validation."""
        valid_emails = [
            'user@example.com',
            'test.email+tag@domain.co.uk',
            'user123@test-domain.com'
        ]
        
        for email in valid_emails:
            assert validate_email(email) == True
        
        invalid_emails = [
            'invalid-email',
            'user@',
            '@domain.com',
            '',
            'user@domain'
        ]
        
        for email in invalid_emails:
            assert validate_email(email) == False
    
    def test_validate_organization_name(self):
        """Test organization name validation."""
        # Valid names
        assert validate_organization_name('My Company') == True
        assert validate_organization_name('A' * 50) == True  # 50 chars
        
        # Invalid names
        assert validate_organization_name('') == False
        assert validate_organization_name('A') == False  # Too short
        assert validate_organization_name('A' * 101) == False  # Too long
    
    def test_validate_uuid(self):
        """Test UUID validation."""
        valid_uuid = '123e4567-e89b-12d3-a456-426614174000'
        assert validate_uuid(valid_uuid) == True
        
        invalid_uuids = [
            'not-a-uuid',
            '123e4567-e89b-12d3-a456',  # Too short
            '123e4567-e89b-12d3-a456-426614174000-extra',  # Too long
            ''
        ]
        
        for uuid_str in invalid_uuids:
            assert validate_uuid(uuid_str) == False


class TestDateTimeLogic:
    """Test date and time calculations."""
    
    def test_get_month_start_end(self):
        """Test getting month start and end dates."""
        test_date = datetime(2024, 3, 15)
        start, end = get_month_boundaries(test_date)
        
        assert start == datetime(2024, 3, 1)
        assert end == datetime(2024, 3, 31, 23, 59, 59)
    
    def test_calculate_days_in_month(self):
        """Test calculating days in month."""
        # March 2024 (31 days)
        days = calculate_days_in_month(2024, 3)
        assert days == 31
        
        # February 2024 (leap year, 29 days)
        days = calculate_days_in_month(2024, 2)
        assert days == 29
        
        # February 2023 (non-leap year, 28 days)
        days = calculate_days_in_month(2023, 2)
        assert days == 28
    
    def test_is_same_month(self):
        """Test checking if two dates are in the same month."""
        date1 = datetime(2024, 3, 1)
        date2 = datetime(2024, 3, 31)
        date3 = datetime(2024, 4, 1)
        
        assert is_same_month(date1, date2) == True
        assert is_same_month(date1, date3) == False


# Pure business logic functions that would be implemented
def calculate_monthly_fee(plan: str) -> float:
    """Calculate monthly subscription fee for a plan."""
    fees = {
        'starter': 29,
        'growth': 149,
        'scale': 499,
        'enterprise': 1499
    }
    return fees.get(plan, 0)

def calculate_prorated_fee(plan: str, days_used: int, days_in_month: int) -> float:
    """Calculate prorated subscription fee."""
    monthly_fee = calculate_monthly_fee(plan)
    return round((monthly_fee * days_used / days_in_month), 2)

def calculate_ad_spend_fee(plan: str, spend_amount: float) -> float:
    """Calculate ad spend fee based on plan."""
    rates = {
        'starter': 0.06,    # 6%
        'growth': 0.03,     # 3%
        'scale': 0.015,     # 1.5%
        'enterprise': 0.01  # 1%
    }
    rate = rates.get(plan, 0)
    return spend_amount * rate

def get_subscription_limits(plan: str) -> dict:
    """Get subscription plan limits."""
    limits = {
        'starter': {
            'business_managers': 3,
            'ad_accounts': 10,
            'team_members': 2,
            'monthly_topup_limit': 6000
        },
        'growth': {
            'business_managers': 5,
            'ad_accounts': 25,
            'team_members': 5,
            'monthly_topup_limit': 25000
        },
        'scale': {
            'business_managers': 15,
            'ad_accounts': 75,
            'team_members': 15,
            'monthly_topup_limit': 100000
        },
        'enterprise': {
            'business_managers': -1,
            'ad_accounts': -1,
            'team_members': -1,
            'monthly_topup_limit': -1
        }
    }
    return limits.get(plan, {})

def calculate_upgrade_cost(current_plan: str, target_plan: str, days_remaining: int) -> float:
    """Calculate cost to upgrade between plans."""
    current_fee = calculate_monthly_fee(current_plan)
    target_fee = calculate_monthly_fee(target_plan)
    
    difference = target_fee - current_fee
    return max(0, difference * (days_remaining / 30))

def validate_topup_amount(amount: float, plan: str = None) -> bool:
    """Validate topup amount."""
    if not amount or amount <= 0:
        return False
    
    if plan:
        limits = get_subscription_limits(plan)
        max_amount = limits.get('monthly_topup_limit', 0)
        if max_amount > 0 and amount > max_amount:
            return False
    
    return True

def calculate_monthly_usage(requests: list) -> float:
    """Calculate total monthly usage from requests."""
    total = 0
    for request in requests:
        if request['status'] in ['completed', 'pending', 'processing']:
            total += request['amount_cents']
    
    return total / 100  # Convert cents to dollars

def check_monthly_limit(new_amount: float, plan: str, current_usage: float) -> bool:
    """Check if new amount would exceed monthly limit."""
    limits = get_subscription_limits(plan)
    monthly_limit = limits.get('monthly_topup_limit', 0)
    
    if monthly_limit == -1:  # Unlimited
        return True
    
    return (new_amount + current_usage) <= monthly_limit

def calculate_available_balance(total_balance: int, reserved_balance: int) -> int:
    """Calculate available balance in cents."""
    return total_balance - reserved_balance

def validate_payment_method(method: str) -> bool:
    """Validate payment method."""
    valid_methods = ['crypto', 'bank_transfer', 'credit_card']
    return method in valid_methods

def calculate_balance_after_topup(current_balance: int, topup_amount: int) -> int:
    """Calculate balance after topup."""
    return current_balance + topup_amount

def calculate_balance_after_spend(current_balance: int, spend_amount: int) -> int:
    """Calculate balance after spending."""
    return current_balance - spend_amount

def validate_spend_amount(spend_amount: int, available_balance: int) -> bool:
    """Validate spend amount against available balance."""
    return spend_amount > 0 and spend_amount <= available_balance

def calculate_transaction_fee(amount: int, method: str) -> int:
    """Calculate transaction fee in cents."""
    if method == 'crypto':
        return int(amount * 0.005)  # 0.5%
    elif method == 'bank_transfer':
        return 200  # $2 flat fee
    elif method == 'credit_card':
        return int(amount * 0.029) + 30  # 2.9% + $0.30
    return 0

def validate_email(email: str) -> bool:
    """Validate email format."""
    import re
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return bool(re.match(pattern, email))

def validate_organization_name(name: str) -> bool:
    """Validate organization name."""
    return 2 <= len(name.strip()) <= 100

def validate_uuid(uuid_str: str) -> bool:
    """Validate UUID format."""
    import re
    pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    return bool(re.match(pattern, uuid_str.lower()))

def get_month_boundaries(date: datetime) -> tuple:
    """Get start and end of month for given date."""
    from calendar import monthrange
    
    start = datetime(date.year, date.month, 1)
    last_day = monthrange(date.year, date.month)[1]
    end = datetime(date.year, date.month, last_day, 23, 59, 59)
    
    return start, end

def calculate_days_in_month(year: int, month: int) -> int:
    """Calculate number of days in a month."""
    from calendar import monthrange
    return monthrange(year, month)[1]

def is_same_month(date1: datetime, date2: datetime) -> bool:
    """Check if two dates are in the same month."""
    return date1.year == date2.year and date1.month == date2.month 