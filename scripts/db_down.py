#!/usr/bin/env python3
import os
import subprocess
import sys

def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    sys.exit(subprocess.call(["docker", "compose", "down"], cwd=root_dir))

if __name__ == '__main__':
    main()
