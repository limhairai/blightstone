import pytest
from datetime import datetime, timedelta

# Simple test configuration for unit tests

@pytest.fixture
def sample_subscription_plans():
    """Sample subscription plan data for testing."""
    return {
        'starter': {
            'monthly_fee': 29,
            'ad_spend_rate': 0.06,
            'business_managers': 3,
            'ad_accounts': 10,
            'team_members': 2,
            'monthly_topup_limit': 6000
        },
        'growth': {
            'monthly_fee': 149,
            'ad_spend_rate': 0.03,
            'business_managers': 5,
            'ad_accounts': 25,
            'team_members': 5,
            'monthly_topup_limit': 25000
        },
        'scale': {
            'monthly_fee': 499,
            'ad_spend_rate': 0.015,
            'business_managers': 15,
            'ad_accounts': 75,
            'team_members': 15,
            'monthly_topup_limit': 100000
        },
        'enterprise': {
            'monthly_fee': 1499,
            'ad_spend_rate': 0.01,
            'business_managers': -1,
            'ad_accounts': -1,
            'team_members': -1,
            'monthly_topup_limit': -1
        }
    }

@pytest.fixture
def sample_topup_requests():
    """Sample topup request data for testing."""
    return [
        {
            'amount_cents': 50000,
            'status': 'completed',
            'created_at': datetime.now() - timedelta(days=1)
        },
        {
            'amount_cents': 30000,
            'status': 'pending',
            'created_at': datetime.now() - timedelta(days=2)
        },
        {
            'amount_cents': 20000,
            'status': 'processing',
            'created_at': datetime.now() - timedelta(days=3)
        },
        {
            'amount_cents': 10000,
            'status': 'failed',
            'created_at': datetime.now() - timedelta(days=4)
        }
    ]

@pytest.fixture
def sample_wallet_data():
    """Sample wallet data for testing."""
    return {
        'total_balance_cents': 100000,  # $1000
        'reserved_balance_cents': 20000,  # $200
        'available_balance_cents': 80000   # $800
    }

# Test utilities
class TestHelpers:
    """Helper functions for tests."""
    
    @staticmethod
    def cents_to_dollars(cents: int) -> float:
        """Convert cents to dollars."""
        return cents / 100
    
    @staticmethod
    def dollars_to_cents(dollars: float) -> int:
        """Convert dollars to cents."""
        return int(dollars * 100)
    
    @staticmethod
    def create_test_date(year: int, month: int, day: int) -> datetime:
        """Create a test date."""
        return datetime(year, month, day)

@pytest.fixture
def test_helpers():
    """Provide test helper functions."""
    return TestHelpers 