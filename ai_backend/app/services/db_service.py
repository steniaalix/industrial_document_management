import logging
from app.database import get_db_connection

logger = logging.getLogger(__name__)

def get_latest_document_version(doc_id: int) -> dict:
    """
    Fetches the latest version details of a document from the MySQL database,
    joining metadata from documents, categories, and departments.
    """
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            # Let's inspect the actual schema to be 100% correct
            # Categories has category_id and category_name. Wait, schema.sql says:
            # `categories` has: category_id, category_name (or name? let's check schema.sql).
            # Let's verify category column name. In schema.sql, is it category_name or name?
            # Looking at previous view_file:
            # "c.category_name || 'Unassigned'"
            # And: "cat.category_name"
            # And: "departments" has: department_id, name, description.
            # So categories has `category_name` and departments has `name` (as department_name).
            sql = """
                SELECT 
                    v.version_id,
                    v.doc_id,
                    v.version_number,
                    v.file_name,
                    v.file_path,
                    d.title AS document_title,
                    d.description AS document_description,
                    c.name AS category_name,
                    dept.name AS department_name
                FROM document_versions v
                JOIN documents d ON v.doc_id = d.doc_id
                LEFT JOIN categories c ON d.category_id = c.category_id
                LEFT JOIN departments dept ON d.department_id = dept.department_id
                WHERE v.doc_id = %s
                ORDER BY v.version_number DESC
                LIMIT 1
            """
            cursor.execute(sql, (doc_id,))
            result = cursor.fetchone()
            return result
    except Exception as e:
        logger.error(f"Error fetching latest document version for doc_id {doc_id}: {e}")
        raise e
    finally:
        connection.close()

def get_document_details(doc_id: int) -> dict:
    """
    Fetches core document details by ID.
    """
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            sql = """
                SELECT doc_id, title, description, status 
                FROM documents 
                WHERE doc_id = %s
            """
            cursor.execute(sql, (doc_id,))
            return cursor.fetchone()
    except Exception as e:
        logger.error(f"Error fetching document details for doc_id {doc_id}: {e}")
        raise e
    finally:
        connection.close()

def get_latest_approved_document_version(doc_id: int) -> dict:
    """
    Fetches the latest APPROVED version details of a document from the MySQL database,
    joining metadata from documents, categories, and departments.
    """
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            sql = """
                SELECT 
                    v.version_id,
                    v.doc_id,
                    v.version_number,
                    v.file_name,
                    v.file_path,
                    d.title AS document_title,
                    d.description AS document_description,
                    c.name AS category_name,
                    dept.name AS department_name
                FROM document_versions v
                JOIN documents d ON v.doc_id = d.doc_id
                LEFT JOIN categories c ON d.category_id = c.category_id
                LEFT JOIN departments dept ON d.department_id = dept.department_id
                WHERE v.doc_id = %s AND v.approved_at IS NOT NULL
                ORDER BY v.approved_at DESC, v.version_number DESC
                LIMIT 1
            """
            cursor.execute(sql, (doc_id,))
            result = cursor.fetchone()
            return result
    except Exception as e:
        logger.error(f"Error fetching latest approved document version for doc_id {doc_id}: {e}")
        raise e
    finally:
        connection.close()

def get_all_documents_with_approved_versions() -> list:
    """
    Fetches list of unique doc_id values that have at least one approved version.
    """
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            sql = "SELECT DISTINCT doc_id FROM document_versions WHERE approved_at IS NOT NULL"
            cursor.execute(sql)
            results = cursor.fetchall()
            return [row["doc_id"] for row in results]
    except Exception as e:
        logger.error(f"Error fetching documents with approved versions: {e}")
        raise e
    finally:
        connection.close()
