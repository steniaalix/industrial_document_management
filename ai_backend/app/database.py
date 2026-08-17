import pymysql
from app.config import settings
import logging

logger = logging.getLogger(__name__)

def get_db_connection():
    try:
        connection = pymysql.connect(
            host=settings.MYSQL_HOST,
            port=settings.MYSQL_PORT,
            user=settings.MYSQL_USER,
            password=settings.MYSQL_PASSWORD,
            database=settings.MYSQL_DATABASE,
            cursorclass=pymysql.cursors.DictCursor
        )
        return connection
    except Exception as e:
        logger.error(f"Failed to connect to MySQL database: {e}")
        raise e
