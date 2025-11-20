import os

import sentry_sdk
from sentry_sdk.integrations.aiohttp import AioHttpIntegration
from sentry_sdk.integrations.logging import LoggingIntegration


def init_sentry():
    sentry_sdk.init(
        dsn=os.getenv("SENTRY_DSN"),
        environment=os.getenv("SENTRY_ENV", "development"),
        release=os.getenv("SENTRY_RELEASE"),
        traces_sample_rate=0.2,
        integrations=[LoggingIntegration(level=None, event_level=None), AioHttpIntegration()],
    )
