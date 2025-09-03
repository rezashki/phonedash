#!/usr/bin/env python3
"""Test script to debug the users API"""

import requests
import json

def test_users_api():
    try:
        # Test the users endpoint
        response = requests.get('http://localhost:5000/api/users')
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Users data: {json.dumps(data, indent=2)}")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_users_api()
