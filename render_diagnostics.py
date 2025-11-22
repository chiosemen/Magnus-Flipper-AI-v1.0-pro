#!/usr/bin/env python3
"""
Render MCP Diagnostics Script
Performs comprehensive health checks on Render services
"""
import requests
import json
import sys
from typing import Dict, List, Any

API_KEY = "rnd_gYgyw9Ehi49ltN2NsOsveJIdrE68"
BASE_URL = "https://api.render.com/v1"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Accept": "application/json"
}

def make_request(endpoint: str) -> Dict[str, Any]:
    """Make authenticated request to Render API"""
    url = f"{BASE_URL}/{endpoint}"
    try:
        response = requests.get(url, headers=headers, timeout=30)
        print(f"[DEBUG] GET {endpoint} -> Status: {response.status_code}", file=sys.stderr)

        if response.status_code == 403:
            print(f"[ERROR] 403 Forbidden - API key may be invalid or lacks permissions", file=sys.stderr)
            print(f"[ERROR] Response: {response.text}", file=sys.stderr)
            return {"error": "403 Forbidden", "message": response.text}
        elif response.status_code == 401:
            print(f"[ERROR] 401 Unauthorized - Invalid API key", file=sys.stderr)
            return {"error": "401 Unauthorized"}

        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Request failed: {e}", file=sys.stderr)
        return {"error": str(e)}

def list_services() -> List[Dict]:
    """List all services"""
    print("=" * 80)
    print("STEP 1: LISTING ALL RENDER SERVICES")
    print("=" * 80)

    result = make_request("services?limit=100")

    if "error" in result:
        print(f"\n❌ Failed to list services: {result['error']}")
        return []

    services = result.get("services", [])
    print(f"\n✓ Found {len(services)} services\n")

    # Organize by status
    failed = []
    suspended = []
    active = []
    other = []

    for svc in services:
        name = svc.get("name", "unknown")
        svc_type = svc.get("type", "unknown")
        status = svc.get("status", "unknown")
        svc_id = svc.get("id", "unknown")

        print(f"  • {name:30s} [{svc_type:10s}] Status: {status}")

        if status.lower() in ["failed", "build_failed", "deploy_failed"]:
            failed.append(svc)
        elif status.lower() == "suspended":
            suspended.append(svc)
        elif status.lower() == "available":
            active.append(svc)
        else:
            other.append(svc)

    print(f"\n📊 Summary:")
    print(f"   ✓ Active: {len(active)}")
    print(f"   ⚠️  Other: {len(other)}")
    print(f"   ⏸️  Suspended: {len(suspended)}")
    print(f"   ❌ Failed: {len(failed)}")

    return failed

def fetch_logs(service_id: str, service_name: str, lines: int = 200):
    """Fetch logs for a specific service"""
    print(f"\n{'=' * 80}")
    print(f"FETCHING LOGS FOR: {service_name}")
    print(f"{'=' * 80}")

    result = make_request(f"services/{service_id}/logs?limit={lines}")

    if "error" in result:
        print(f"❌ Failed to fetch logs: {result['error']}")
        return

    logs = result.get("logs", [])
    print(f"\n📋 Last {len(logs)} log entries:\n")

    for log in logs[-50:]:  # Show last 50 entries
        timestamp = log.get("timestamp", "")
        message = log.get("message", "")
        print(f"[{timestamp}] {message}")

    # Analyze for common issues
    print(f"\n🔍 ROOT CAUSE ANALYSIS:")
    all_logs = " ".join([log.get("message", "") for log in logs])

    issues = []
    if "playwright" in all_logs.lower() or "browser" in all_logs.lower():
        issues.append("⚠️  Playwright/Browser dependency issue detected")
    if "enoent" in all_logs.lower() or "cannot find module" in all_logs.lower():
        issues.append("⚠️  Missing file or module dependency")
    if "permission denied" in all_logs.lower():
        issues.append("⚠️  Permission error detected")
    if "environment" in all_logs.lower() or "env" in all_logs.lower():
        issues.append("⚠️  Environment variable issue detected")
    if "start command" in all_logs.lower() or "command not found" in all_logs.lower():
        issues.append("⚠️  Start command issue detected")
    if "build" in all_logs.lower() and ("fail" in all_logs.lower() or "error" in all_logs.lower()):
        issues.append("⚠️  Build failure detected")

    if issues:
        for issue in issues:
            print(f"   {issue}")
    else:
        print("   ℹ️  No specific patterns detected - review logs above")

def list_databases():
    """List PostgreSQL instances"""
    print(f"\n{'=' * 80}")
    print("STEP 3: CHECKING POSTGRESQL INSTANCES")
    print(f"{'=' * 80}")

    result = make_request("postgres")

    if "error" in result:
        print(f"❌ Failed to list PostgreSQL instances: {result['error']}")
        return

    dbs = result.get("databases", [])
    print(f"\n✓ Found {len(dbs)} PostgreSQL instance(s)\n")

    for db in dbs:
        name = db.get("name", "unknown")
        status = db.get("status", "unknown")
        plan = db.get("plan", "unknown")
        print(f"  • {name:30s} Plan: {plan:10s} Status: {status}")

def list_redis():
    """List Redis instances"""
    print(f"\n{'=' * 80}")
    print("STEP 4: CHECKING REDIS INSTANCES")
    print(f"{'=' * 80}")

    result = make_request("redis")

    if "error" in result:
        print(f"❌ Failed to list Redis instances: {result['error']}")
        return

    instances = result.get("redis", [])
    print(f"\n✓ Found {len(instances)} Redis instance(s)\n")

    for redis in instances:
        name = redis.get("name", "unknown")
        status = redis.get("status", "unknown")
        plan = redis.get("plan", "unknown")
        print(f"  • {name:30s} Plan: {plan:10s} Status: {status}")

def check_env_vars(service_id: str, service_name: str, required_vars: List[str]):
    """Check environment variables for a service"""
    print(f"\n{'=' * 80}")
    print(f"CHECKING ENV VARS FOR: {service_name}")
    print(f"{'=' * 80}")

    result = make_request(f"services/{service_id}/env-vars")

    if "error" in result:
        print(f"❌ Failed to fetch env vars: {result['error']}")
        return

    env_vars = result.get("envVars", [])
    existing_keys = {var.get("key") for var in env_vars}

    print(f"\n📋 Checking {len(required_vars)} required variables:\n")

    missing = []
    for var in required_vars:
        if var in existing_keys:
            print(f"  ✓ {var}")
        else:
            print(f"  ❌ {var} - MISSING")
            missing.append(var)

    if missing:
        print(f"\n⚠️  WARNING: {len(missing)} required variables are missing!")
    else:
        print(f"\n✓ All required variables are set")

def main():
    """Main diagnostic sequence"""
    print("\n" + "=" * 80)
    print(" RENDER MCP DIAGNOSTIC SEQUENCE ".center(80, "="))
    print("=" * 80)

    # Step 1: List services
    failed_services = list_services()

    # Step 2: Analyze failed services
    if failed_services:
        print(f"\n{'=' * 80}")
        print(f"STEP 2: ANALYZING {len(failed_services)} FAILED SERVICE(S)")
        print(f"{'=' * 80}")

        for svc in failed_services:
            fetch_logs(svc.get("id"), svc.get("name"))

    # Step 3 & 4: Check databases
    list_databases()
    list_redis()

    # Step 5: Check env vars for key services
    print(f"\n{'=' * 80}")
    print("STEP 5: VALIDATING ENVIRONMENT VARIABLES")
    print(f"{'=' * 80}")

    # This would need to get service IDs from the services list
    # For now, we'll note this needs service IDs
    print("\nℹ️  To check specific service env vars, I need service IDs from step 1")

    print(f"\n{'=' * 80}")
    print(" DIAGNOSTIC SEQUENCE COMPLETE ".center(80, "="))
    print(f"{'=' * 80}")
    print("\n⏸️  Awaiting instructions for:")
    print("   • restart_render_service(service_id)")
    print("   • deploy_render_service(service_id)")
    print("   • update_render_service(service_id, config)")

if __name__ == "__main__":
    main()
