import redis

# Connect to Redis for timers
redis_client = redis.Redis(host='redis', port=6379, db=0)

# Function to handle timers
def start_timer(timer_id: str, duration: int):
    redis_client.set(timer_id, duration)
    redis_client.expire(timer_id, duration)

def get_timer(timer_id: str):
    time_left = redis_client.get(timer_id)
    if time_left:
        return {"time_left": time_left.decode("utf-8")}
    return {"message": "Timer not found"}
