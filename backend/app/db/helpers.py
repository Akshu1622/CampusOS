import logging
from sqlalchemy import text
from sqlalchemy.exc import DatabaseError
from sqlalchemy.orm import Session
from app.core.errors import DB_ERROR_CODE_MAP, APIError
from fastapi import status

logger = logging.getLogger(__name__)

def handle_db_error(e: Exception):
    """
    Catch SQLAlchemy DatabaseError / DBAPIError, parse MySQL error code (if 45000), 
    and raise appropriate APIError.
    """
    from sqlalchemy.exc import DBAPIError
    if isinstance(e, (DatabaseError, DBAPIError)):
        orig = getattr(e, 'orig', None)
        if orig:
            # PyMySQL errors are typically tuples: (errno, msg)
            if hasattr(orig, 'args') and len(orig.args) >= 2:
                errno, msg = orig.args[0], orig.args[1]
                if isinstance(errno, int) and errno < 0 and (errno + 65536) in DB_ERROR_CODE_MAP:
                    errno = errno + 65536
                
                # Check for our SIGNAL errors (SQLSTATE 45000)
                # Note: PyMySQL raises OperationalError or InternalError, 
                # but the MySQL errno is what we care about.
                if errno in DB_ERROR_CODE_MAP:
                    code, http_status = DB_ERROR_CODE_MAP[errno]
                    raise APIError(code=code, message=msg, status_code=http_status)
                
                # Fallback message parsing for standard business rules
                if "attendance" in str(msg).lower() and "75%" in str(msg):
                    raise APIError(code="ATTENDANCE_BELOW_THRESHOLD", message=str(msg), status_code=status.HTTP_403_FORBIDDEN)

                # Generic Integrity Constraint Violation (e.g. 1062 Duplicate entry)
                if errno in (1062, 1451, 1452):
                    raise APIError(code="INTEGRITY_ERROR", message=msg, status_code=status.HTTP_409_CONFLICT)
                    
    # Unhandled / generic 500
    logger.error(f"Unhandled Database Error: {e}")
    raise APIError(code="INTERNAL_SERVER_ERROR", message="An internal database error occurred.", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

def call_procedure(session: Session, proc_name: str, in_params: list, out_params: list = None):
    """
    Helper to call a stored procedure according to DB_CONTRACT.md.
    Sets OUT parameters as session variables, executes the procedure, 
    and fetches the OUT parameters.
    """
    try:
        out_vars = []
        if out_params:
            for p in out_params:
                # Initialize session variables to NULL
                session.execute(text(f"SET @{p} = NULL;"))
                out_vars.append(f"@{p}")
                
        # Build the argument string
        args_str = []
        bind_params = {}
        for i, val in enumerate(in_params):
            param_key = f"p{i}"
            args_str.append(f":{param_key}")
            bind_params[param_key] = val
            
        args_str.extend(out_vars)
        args_joined = ", ".join(args_str)
        
        # Execute procedure
        query = text(f"CALL {proc_name}({args_joined});")
        session.execute(query, bind_params)
        
        if out_params:
            # Fetch out params
            select_vars = ", ".join(out_vars)
            res = session.execute(text(f"SELECT {select_vars};")).fetchone()
            return res
        return None
    except Exception as e:
        handle_db_error(e)

def call_function(session: Session, func_name: str, in_params: list):
    """
    Helper to call a stored function.
    """
    try:
        args_str = []
        bind_params = {}
        for i, val in enumerate(in_params):
            param_key = f"p{i}"
            args_str.append(f":{param_key}")
            bind_params[param_key] = val
            
        args_joined = ", ".join(args_str)
        query = text(f"SELECT {func_name}({args_joined}) AS result;")
        res = session.execute(query, bind_params).scalar()
        return res
    except Exception as e:
        handle_db_error(e)
