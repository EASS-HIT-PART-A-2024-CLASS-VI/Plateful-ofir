import pytest
from unittest.mock import Mock, patch
from services.timer_service import start_timer, get_timer

class TestTimerService:
    @pytest.fixture
    def mock_redis(self):
        return Mock()

    def test_start_timer(self, mock_redis):
        with patch('services.timer_service.redis_client', mock_redis):
            timer_id = "test_timer"
            duration = 300
            
            start_timer(timer_id, duration)
            
            mock_redis.set.assert_called_with(timer_id, duration)
            mock_redis.expire.assert_called_with(timer_id, duration)

    def test_get_timer(self, mock_redis):
        with patch('services.timer_service.redis_client', mock_redis):
            timer_id = "test_timer"
            mock_redis.get.return_value = b"150"
            
            result = get_timer(timer_id)
            assert result == {"time_left": "150"}

    def test_get_nonexistent_timer(self, mock_redis):
        with patch('services.timer_service.redis_client', mock_redis):
            mock_redis.get.return_value = None
            result = get_timer("nonexistent")
            assert result == {"message": "Timer not found"}