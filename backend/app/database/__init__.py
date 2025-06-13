import os
from decouple import config

# Import MongoDB connection based on environment
is_render = os.getenv('RENDER') or config('PORT', default='8000') == '10000'

if is_render:
    from .mongodb_render import MongoDB, connect_to_mongo, close_mongo_connection, get_database, is_connected
else:
    from .mongodb import MongoDB, connect_to_mongo, close_mongo_connection, get_database, is_connected

__all__ = ["MongoDB", "connect_to_mongo", "close_mongo_connection", "get_database", "is_connected"]
