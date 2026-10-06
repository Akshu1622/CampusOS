import subprocess
import sys
import os

def run_tests():
    print("="*50)
    print("Resetting Database (db_reset.py)...")
    print("="*50)
    db_reset_cmd = [sys.executable, "scripts/db_reset.py"]
    db_res = subprocess.run(db_reset_cmd)
    
    if db_res.returncode != 0:
        print("\n[!] Database reset failed. Stopping execution.")
        sys.exit(db_res.returncode)

    print("\n"+"="*50)
    print("Running Database Tests (db_test.py)...")
    print("="*50)
    db_test_cmd = [sys.executable, "scripts/db_test.py"]
    db_res = subprocess.run(db_test_cmd)
    
    if db_res.returncode != 0:
        print("\n[!] Database tests failed. Stopping execution.")
        sys.exit(db_res.returncode)

    print("\n"+"="*50)
    print("Running Backend E2E & Unit Tests (pytest)...")
    print("="*50)
    
    # We must ensure the backend tests run from the `backend/` directory
    # so they pick up conftest.py and module paths correctly.
    backend_dir = os.path.join(os.getcwd(), "backend")
    
    # Check if venv exists
    pytest_exec = "pytest"
    if sys.platform == "win32":
        venv_pytest = os.path.join(backend_dir, "venv", "Scripts", "pytest.exe")
    else:
        venv_pytest = os.path.join(backend_dir, "venv", "bin", "pytest")
        
    if os.path.exists(venv_pytest):
        pytest_exec = venv_pytest
        
    env = os.environ.copy()
    env["PYTHONPATH"] = "."
    
    pytest_res = subprocess.run([pytest_exec, "tests/"], cwd=backend_dir, env=env)
    
    if pytest_res.returncode != 0:
        print("\n[!] Backend tests failed.")
        sys.exit(pytest_res.returncode)
        
    print("\n"+"="*50)
    print("All tests passed successfully!")
    print("="*50)

if __name__ == "__main__":
    run_tests()
