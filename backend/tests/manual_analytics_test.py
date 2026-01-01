#!/usr/bin/env python3
"""Manual test script for analytics and manuscript endpoints.

This script starts a test server and demonstrates the analytics integration.
"""

from __future__ import annotations

import http.client
import json
import sys
import threading
import time
from http.server import ThreadingHTTPServer
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from bhriguwelt.api import BhriguAPIHandler


def start_server():
    """Start test server on a random available port."""
    server = ThreadingHTTPServer(("127.0.0.1", 0), BhriguAPIHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server


def get_json(host, port, path):
    """Make a GET request and return JSON response."""
    connection = http.client.HTTPConnection(host, port)
    connection.request("GET", path)
    response = connection.getresponse()
    content = response.read().decode()
    connection.close()
    return response.status, json.loads(content) if content else {}


def main():
    """Run manual tests for analytics endpoints."""
    print("Starting test server...")
    server = start_server()
    host, port = server.server_address
    print(f"Server running at {host}:{port}\n")

    # Give server a moment to start
    time.sleep(0.5)

    # Test 1: Analytics snapshot
    print("=" * 60)
    print("Test 1: GET /analytics")
    print("=" * 60)
    status, data = get_json(host, port, "/analytics")
    print(f"Status: {status}")
    print(f"Response keys: {list(data.keys())}")
    print(f"\nProfiles summary:")
    print(f"  Total profiles: {data.get('profiles', {}).get('total', 0)}")
    print(f"  Created last 7 days: {data.get('profiles', {}).get('created_last_7_days', 0)}")
    print(f"  Updated last 24 hours: {data.get('profiles', {}).get('updated_last_24_hours', 0)}")
    print(f"\nSessions summary:")
    print(f"  Total sessions: {data.get('sessions', {}).get('total', 0)}")
    print(f"  Active last 7 days: {data.get('sessions', {}).get('active_last_7_days', 0)}")
    print(f"  Average turns: {data.get('sessions', {}).get('average_turns', 0)}")
    print(f"\nAlerts summary:")
    print(f"  Total alerts: {data.get('alerts', {}).get('total', 0)}")
    print(f"\nFeedback summary:")
    if 'feedback' in data:
        feedback = data['feedback']
        print(f"  Total feedback: {feedback.get('total', 0)}")
        if 'ratings' in feedback:
            print(f"  Rating distribution: {feedback['ratings']}")
    print()

    # Test 2: Manuscript fetch
    print("=" * 60)
    print("Test 2: GET /manuscript")
    print("=" * 60)
    status, data = get_json(host, port, "/manuscript")
    print(f"Status: {status}")
    print(f"Response keys: {list(data.keys())}")
    if 'principles' in data:
        principles = data['principles']
        print(f"\nPrinciples loaded: {len(principles)}")
        if principles:
            print(f"Sample principle: {principles[0]}")
    print()

    # Shutdown
    print("Shutting down server...")
    server.shutdown()
    print("✓ All manual tests completed successfully!")


if __name__ == "__main__":
    main()
