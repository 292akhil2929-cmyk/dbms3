import zipfile
import os
import base64
import json

zip_path = '/vercel/share/v0-project/shopsphere.zip'

# First check if we can find the file
print(f"Looking for zip at: {zip_path}")
print(f"Current directory: {os.getcwd()}")
print(f"Directory contents: {os.listdir('.')}")

# Try to read from stdin if file is piped
import sys

if not os.path.exists(zip_path):
    print("Zip file not found at expected path")
    # Try current directory
    if os.path.exists('shopsphere.zip'):
        zip_path = 'shopsphere.zip'
        print(f"Found at: {zip_path}")
    else:
        print("Could not find shopsphere.zip")
        sys.exit(1)

with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    print(f"\nZip contains {len(zip_ref.namelist())} entries:\n")
    for name in zip_ref.namelist():
        print(name)
