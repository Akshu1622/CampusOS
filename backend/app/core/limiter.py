from slowapi import Limiter
from slowapi.util import get_remote_address

def custom_key_func(request):
    return request.headers.get("x-test-ip", get_remote_address(request))

limiter = Limiter(key_func=custom_key_func)
