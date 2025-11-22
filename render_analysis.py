#!/usr/bin/env python3
"""
Parse and analyze Render diagnostics data
"""
import json

# The data from the user
data = {
  "services": [{"cursor":"cxMpElU4S41zc3JlNWR1czczYml0cGYw","service":{"autoDeploy":"yes","autoDeployTrigger":"commit","branch":"main","createdAt":"2025-11-21T22:57:55.749992Z","dashboardUrl":"https://dashboard.render.com/worker/srv-d4gessre5dus73bitpf0","id":"srv-d4gessre5dus73bitpf0","name":"magnus-worker-crawler","notifyOnFail":"default","ownerId":"tea-d3p7t7buibrs738ekqeg","repo":"https://github.com/chiosemen/Magnus-Flipper-AI-v1.0-pro","rootDir":".","serviceDetails":{"buildPlan":"starter","env":"node","envSpecificDetails":{"buildCommand":"cd apps/worker-crawler\npnpm install --frozen-lockfile\nnpx playwright install chromium\n","startCommand":"node apps/worker-crawler/src/index.js\n"},"numInstances":1,"plan":"starter","previews":{"generation":"off"},"pullRequestPreviewsEnabled":"no","region":"frankfurt","runtime":"node","sshAddress":"srv-d4gessre5dus73bitpf0@ssh.frankfurt.render.com"},"slug":"magnus-worker-crawler","suspended":"not_suspended","suspenders":[],"type":"background_worker","updatedAt":"2025-11-22T02:37:06.184548Z"}},{"cursor":"cxMpElU4S41zc3JlNWR1czczYml0cGNn","service":{"autoDeploy":"yes","autoDeployTrigger":"commit","branch":"main","createdAt":"2025-11-21T22:57:55.729357Z","dashboardUrl":"https://dashboard.render.com/web/srv-d4gessre5dus73bitpcg","id":"srv-d4gessre5dus73bitpcg","name":"magnus-flipper-api","notifyOnFail":"default","ownerId":"tea-d3p7t7buibrs738ekqeg","repo":"https://github.com/chiosemen/Magnus-Flipper-AI-v1.0-pro","rootDir":".","serviceDetails":{"buildPlan":"starter","cache":{"profile":"no-cache"},"env":"node","envSpecificDetails":{"buildCommand":"cd packages/api\npnpm install --frozen-lockfile\npnpm build\n","startCommand":"node packages/api/dist/server.js\n"},"healthCheckPath":"","ipAllowList":[{"cidrBlock":"0.0.0.0/0","description":"everywhere"}],"maintenanceMode":{"enabled":false,"uri":""},"numInstances":1,"openPorts":[{"port":10000,"protocol":"TCP"}],"plan":"starter","previews":{"generation":"off"},"pullRequestPreviewsEnabled":"no","region":"frankfurt","runtime":"node","sshAddress":"srv-d4gessre5dus73bitpcg@ssh.frankfurt.render.com","url":"https://magnus-flipper-api.onrender.com"},"slug":"magnus-flipper-api","suspended":"not_suspended","suspenders":[],"type":"web_service","updatedAt":"2025-11-22T02:34:52.505944Z"}},{"cursor":"cxMpElU4S41zc3JlNWR1czczYml0cGRn","service":{"autoDeploy":"yes","autoDeployTrigger":"commit","branch":"main","createdAt":"2025-11-21T22:57:55.722458Z","dashboardUrl":"https://dashboard.render.com/worker/srv-d4gessre5dus73bitpdg","id":"srv-d4gessre5dus73bitpdg","name":"magnus-worker-analyzer","notifyOnFail":"default","ownerId":"tea-d3p7t7buibrs738ekqeg","repo":"https://github.com/chiosemen/Magnus-Flipper-AI-v1.0-pro","rootDir":".","serviceDetails":{"buildPlan":"starter","env":"node","envSpecificDetails":{"buildCommand":"echo 'no build step'","startCommand":"node apps/worker-analyzer/src/index.js\n"},"numInstances":1,"plan":"starter","previews":{"generation":"off"},"pullRequestPreviewsEnabled":"no","region":"frankfurt","runtime":"node","sshAddress":"srv-d4gessre5dus73bitpdg@ssh.frankfurt.render.com"},"slug":"magnus-worker-analyzer","suspended":"not_suspended","suspenders":[],"type":"background_worker","updatedAt":"2025-11-22T02:34:15.93016Z"}},{"cursor":"cxMpElU4S41zc3JlNWR1czczYml0cGUw","service":{"autoDeploy":"yes","autoDeployTrigger":"commit","branch":"main","createdAt":"2025-11-21T22:57:55.596416Z","dashboardUrl":"https://dashboard.render.com/worker/srv-d4gessre5dus73bitpe0","id":"srv-d4gessre5dus73bitpe0","name":"magnus-worker-alerts","notifyOnFail":"default","ownerId":"tea-d3p7t7buibrs738ekqeg","repo":"https://github.com/chiosemen/Magnus-Flipper-AI-v1.0-pro","rootDir":".","serviceDetails":{"buildPlan":"starter","env":"node","envSpecificDetails":{"buildCommand":"echo 'no build step'","startCommand":"node apps/worker-alerts/src/index.js\n"},"numInstances":1,"plan":"starter","previews":{"generation":"off"},"pullRequestPreviewsEnabled":"no","region":"frankfurt","runtime":"node","sshAddress":"srv-d4gessre5dus73bitpe0@ssh.frankfurt.render.com"},"slug":"magnus-worker-alerts","suspended":"not_suspended","suspenders":[],"type":"background_worker","updatedAt":"2025-11-22T02:35:19.514321Z"}},{"cursor":"cxMpElU4S41zc3JlNWR1czczYml0cGVn","service":{"autoDeploy":"yes","autoDeployTrigger":"commit","branch":"main","createdAt":"2025-11-21T22:57:55.582014Z","dashboardUrl":"https://dashboard.render.com/worker/srv-d4gessre5dus73bitpeg","id":"srv-d4gessre5dus73bitpeg","name":"magnus-telegram-bot","notifyOnFail":"default","ownerId":"tea-d3p7t7buibrs738ekqeg","repo":"https://github.com/chiosemen/Magnus-Flipper-AI-v1.0-pro","rootDir":".","serviceDetails":{"buildPlan":"starter","env":"node","envSpecificDetails":{"buildCommand":"cd apps/bot-telegram\npnpm install --frozen-lockfile\n","startCommand":"cd apps/bot-telegram && pnpm start\n"},"numInstances":1,"plan":"starter","previews":{"generation":"off"},"pullRequestPreviewsEnabled":"no","region":"frankfurt","runtime":"node","sshAddress":"srv-d4gessre5dus73bitpeg@ssh.frankfurt.render.com"},"slug":"magnus-telegram-bot","suspended":"not_suspended","suspenders":[],"type":"background_worker","updatedAt":"2025-11-22T02:36:53.523798Z"}},{"cursor":"cxMpElU4S41zc3JlNWR1czczYml0cGMw","service":{"autoDeploy":"yes","autoDeployTrigger":"commit","branch":"main","createdAt":"2025-11-21T22:57:55.575187Z","dashboardUrl":"https://dashboard.render.com/worker/srv-d4gessre5dus73bitpc0","id":"srv-d4gessre5dus73bitpc0","name":"magnus-scheduler","notifyOnFail":"default","ownerId":"tea-d3p7t7buibrs738ekqeg","repo":"https://github.com/chiosemen/Magnus-Flipper-AI-v1.0-pro","rootDir":".","serviceDetails":{"buildPlan":"starter","env":"node","envSpecificDetails":{"buildCommand":"echo 'no build step'","startCommand":"node apps/scheduler/src/index.js\n"},"numInstances":1,"plan":"starter","previews":{"generation":"off"},"pullRequestPreviewsEnabled":"no","region":"frankfurt","runtime":"node","sshAddress":"srv-d4gessre5dus73bitpc0@ssh.frankfurt.render.com"},"slug":"magnus-scheduler","suspended":"not_suspended","suspenders":[],"type":"background_worker","updatedAt":"2025-11-22T02:34:36.872628Z"}}],
  "postgres": [{"postgres":{"createdAt":"2025-11-21T22:57:18.36849Z","dashboardUrl":"https://dashboard.render.com/d/dpg-d4gesjbe5dus73bitikg-a","databaseName":"magnus_flipper","databaseUser":"magnus_flipper_user","diskAutoscalingEnabled":False,"diskSizeGB":15,"highAvailabilityEnabled":False,"id":"dpg-d4gesjbe5dus73bitikg-a","ipAllowList":[{"cidrBlock":"0.0.0.0/0","description":"everywhere"}],"name":"magnus-flipper-db","owner":{"email":"chi.osemen@googlemail.com","id":"tea-d3p7t7buibrs738ekqeg","name":"Magnus's workspace","type":"team"},"plan":"basic_256mb","readReplicas":[],"region":"frankfurt","role":"primary","status":"available","suspended":"not_suspended","suspenders":[],"updatedAt":"2025-11-21T22:57:18.36849Z","version":"18"},"cursor":"w80934EiSq5zamJlNWR1czczYml0aWtnLWE="}],
  "redis": [{"redis":{"createdAt":"2025-11-21T22:57:17.582569Z","dashboardUrl":"https://dashboard.render.com/r/red-d4gesjbe5dus73bitii0","id":"red-d4gesjbe5dus73bitii0","ipAllowList":[{"cidrBlock":"0.0.0.0/0","description":"Allow all IPs"}],"name":"magnus-flipper-redis","options":{"maxmemoryPolicy":"allkeys_lru"},"owner":{"email":"chi.osemen@googlemail.com","id":"tea-d3p7t7buibrs738ekqeg","name":"Magnus's workspace","type":"team"},"plan":"starter","region":"frankfurt","status":"available","updatedAt":"2025-11-21T22:57:17.582569Z","version":"8.1.4"},"cursor":"858HVaqwgoJzamJlNWR1czczYml0aWkw"}]
}

print("=" * 100)
print(" RENDER SERVICES ANALYSIS ".center(100, "="))
print("=" * 100)

print("\n📊 SERVICES SUMMARY:")
print(f"   Total Services: {len(data['services'])}")
print(f"   PostgreSQL Instances: {len(data['postgres'])}")
print(f"   Redis Instances: {len(data['redis'])}")

print("\n" + "=" * 100)
print(" SERVICE DETAILS ".center(100, "="))
print("=" * 100)

for item in data['services']:
    svc = item['service']
    name = svc['name']
    svc_id = svc['id']
    svc_type = svc['type']
    suspended = svc['suspended']
    details = svc['serviceDetails']
    build_cmd = details['envSpecificDetails'].get('buildCommand', 'N/A')
    start_cmd = details['envSpecificDetails'].get('startCommand', 'N/A')

    print(f"\n🔧 {name}")
    print(f"   ID: {svc_id}")
    print(f"   Type: {svc_type}")
    print(f"   Suspended: {suspended}")
    print(f"   Region: {details['region']}")
    print(f"   Build Command: {build_cmd.strip()}")
    print(f"   Start Command: {start_cmd.strip()}")
    print(f"   Dashboard: {svc['dashboardUrl']}")

print("\n" + "=" * 100)
print(" DATABASE SERVICES ".center(100, "="))
print("=" * 100)

pg = data['postgres'][0]['postgres']
print(f"\n🐘 PostgreSQL: {pg['name']}")
print(f"   ID: {pg['id']}")
print(f"   Status: {pg['status']}")
print(f"   Version: {pg['version']}")
print(f"   Plan: {pg['plan']}")
print(f"   Database: {pg['databaseName']}")
print(f"   User: {pg['databaseUser']}")

redis = data['redis'][0]['redis']
print(f"\n🔴 Redis: {redis['name']}")
print(f"   ID: {redis['id']}")
print(f"   Status: {redis['status']}")
print(f"   Version: {redis['version']}")
print(f"   Plan: {redis['plan']}")
print(f"   Policy: {redis['options']['maxmemoryPolicy']}")

print("\n" + "=" * 100)
print(" SERVICE IDS FOR LOG COLLECTION ".center(100, "="))
print("=" * 100)

print("\n📋 Service IDs:")
for item in data['services']:
    svc = item['service']
    print(f"{svc['name']:35s} = {svc['id']}")
