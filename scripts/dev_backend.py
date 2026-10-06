#!/usr/bin/env python3
import os
import subprocess
import sys

def main():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    backend_dir = os.path.join(project_root, 'backend')
    
    # Check if venv exists
    venv_dir = os.path.join(backend_dir, 'venv')
    if not os.path.exists(venv_dir):
        print("Creating virtual environment...")
        subprocess.run([sys.executable, "-m", "venv", venv_dir], cwd=backend_dir, check=True)
        
    # Get pip and python paths
    if sys.platform == "win32":
        pip_exe = os.path.join(venv_dir, 'Scripts', 'pip.exe')
        python_exe = os.path.join(venv_dir, 'Scripts', 'python.exe')
    else:
        pip_exe = os.path.join(venv_dir, 'bin', 'pip')
        python_exe = os.path.join(venv_dir, 'bin', 'python')
        
    print("Installing requirements...")
    subprocess.run([pip_exe, "install", "-r", "requirements.txt"], cwd=backend_dir, check=True)
    
    # Load .env
    env = os.environ.copy()
    env_path = os.path.join(project_root, '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    env[k] = v
                    
    print("Starting backend server on port 8000...")
    env["PYTHONPATH"] = backend_dir
    subprocess.run([python_exe, "-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"], cwd=backend_dir, env=env)

if __name__ == '__main__':
    main()
