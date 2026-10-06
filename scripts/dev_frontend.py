import os
import subprocess
import sys

def main():
    print("Starting frontend development server...")
    os.chdir(os.path.join(os.path.dirname(__file__), "..", "frontend"))
    try:
        if os.name == 'nt':
            subprocess.run(["npm.cmd", "run", "dev"], check=True)
        else:
            subprocess.run(["npm", "run", "dev"], check=True)
    except KeyboardInterrupt:
        print("\nStopping frontend server.")
        sys.exit(0)

if __name__ == "__main__":
    main()
