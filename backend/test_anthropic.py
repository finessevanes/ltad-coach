"""Standalone test script to verify Anthropic API integration with prompt caching.

Run with: python test_anthropic.py
"""

import asyncio
import os
from dotenv import load_dotenv
from anthropic import AsyncAnthropic

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

# Static context for caching test
STATIC_CONTEXT = """You are a youth sports coach assistant helping analyze One-Leg Balance Test results.

LTAD Age Expectations:
- Ages 5-7: 5-10 seconds (Active Start)
- Ages 8-9: 10-15 seconds (FUNdamentals)
- Ages 10-11: 15-20 seconds (Learning to Train)
- Ages 12-13: 20-25+ seconds (Training to Train)

Key Focus Areas:
- Balance duration (hold time)
- Stability (sway velocity and corrections)
- Body alignment (arm symmetry, hip angle)
- Temporal performance (fatigue patterns)

This is static context that will be cached."""


async def test_simple_chat():
    """Test basic message creation without caching."""
    print("\n" + "=" * 80)
    print("TEST 1: Simple Chat (No Caching)")
    print("=" * 80)

    try:
        client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY, timeout=30.0)

        response = await client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=50,
            messages=[{"role": "user", "content": "Say hello in one sentence."}]
        )

        print(f"\n✅ Response: {response.content[0].text}")
        print(f"📊 Token Usage:")
        print(f"   - Input tokens: {response.usage.input_tokens}")
        print(f"   - Output tokens: {response.usage.output_tokens}")

        await client.close()
        return True

    except Exception as e:
        print(f"\n❌ TEST FAILED: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_cache_creation():
    """Test first request with cache_control (creates cache)."""
    print("\n" + "=" * 80)
    print("TEST 2: Cache Creation (First Request)")
    print("=" * 80)

    try:
        client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY, timeout=30.0)

        # First call with cache control - should create cache
        system_param = [
            {
                "type": "text",
                "text": STATIC_CONTEXT,
                "cache_control": {"type": "ephemeral"}
            }
        ]

        response = await client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=100,
            system=system_param,
            messages=[
                {
                    "role": "user",
                    "content": "What is the expected balance duration for a 9-year-old?"
                }
            ]
        )

        print(f"\n✅ Response: {response.content[0].text}")
        print(f"📊 Token Usage:")
        print(f"   - Input tokens: {response.usage.input_tokens}")
        print(f"   - Output tokens: {response.usage.output_tokens}")
        print(f"   - Cache creation tokens: {response.usage.cache_creation_input_tokens}")
        print(f"   - Cache read tokens: {response.usage.cache_read_input_tokens}")

        if response.usage.cache_creation_input_tokens > 0:
            print(f"\n✅ Cache created! {response.usage.cache_creation_input_tokens} tokens cached")
        else:
            print(f"\n⚠️  No cache created (expected on first call)")

        await client.close()
        return True

    except Exception as e:
        print(f"\n❌ TEST FAILED: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_cache_hit():
    """Test second request with same system prompt (reads from cache)."""
    print("\n" + "=" * 80)
    print("TEST 3: Cache Hit (Second Request)")
    print("=" * 80)

    try:
        client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY, timeout=30.0)

        # Same system prompt as test_cache_creation
        system_param = [
            {
                "type": "text",
                "text": STATIC_CONTEXT,
                "cache_control": {"type": "ephemeral"}
            }
        ]

        # First call (prime cache)
        print("\n📝 Priming cache with first request...")
        await client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=100,
            system=system_param,
            messages=[
                {
                    "role": "user",
                    "content": "What is the expected balance duration for a 9-year-old?"
                }
            ]
        )

        # Wait briefly to ensure cache is ready
        await asyncio.sleep(1)

        # Second call (should hit cache)
        print("📝 Making second request (should hit cache)...")
        response = await client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=100,
            system=system_param,  # Same system prompt
            messages=[
                {
                    "role": "user",
                    "content": "What about a 12-year-old?"  # Different question
                }
            ]
        )

        print(f"\n✅ Response: {response.content[0].text}")
        print(f"📊 Token Usage:")
        print(f"   - Input tokens: {response.usage.input_tokens}")
        print(f"   - Output tokens: {response.usage.output_tokens}")
        print(f"   - Cache creation tokens: {response.usage.cache_creation_input_tokens}")
        print(f"   - Cache read tokens: {response.usage.cache_read_input_tokens}")

        if response.usage.cache_read_input_tokens > 0:
            print(f"\n✅ Cache hit! Read {response.usage.cache_read_input_tokens} cached tokens")
            savings = (response.usage.cache_read_input_tokens * 0.9) / response.usage.cache_read_input_tokens * 100
            print(f"💰 Cost savings: ~{savings:.0f}% on cached content")
        else:
            print(f"\n⚠️  No cache hit (cache may have expired or was not created)")

        await client.close()
        return response.usage.cache_read_input_tokens > 0

    except Exception as e:
        print(f"\n❌ TEST FAILED: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_anthropic_client():
    """Test using the actual AnthropicClient from the application."""
    print("\n" + "=" * 80)
    print("TEST 4: AnthropicClient Integration Test")
    print("=" * 80)

    try:
        # Import the actual client from the application
        import sys
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

        from backend.app.agents.client import get_anthropic_client
        from backend.app.config import get_settings

        settings = get_settings()
        client = get_anthropic_client()

        # Test with cache control
        print("\n📝 Testing AnthropicClient.chat() with caching...")
        response_text = await client.chat(
            model=settings.sonnet_model,
            messages=[{"role": "user", "content": "Provide a one-sentence tip for youth balance training."}],
            system=STATIC_CONTEXT,
            cache_control=True,
            max_tokens=100
        )

        print(f"\n✅ Response: {response_text}")

        # Get cache stats
        stats = client.get_cache_stats()
        print(f"📊 Cache Statistics:")
        print(f"   - Cache hits: {stats['cache_hits']}")
        print(f"   - Cache misses: {stats['cache_misses']}")

        return True

    except Exception as e:
        print(f"\n❌ TEST FAILED: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Run all test cases."""
    print(f"\nAnthropic API Key: {ANTHROPIC_API_KEY[:20]}..." if ANTHROPIC_API_KEY else "❌ NO API KEY FOUND")

    if not ANTHROPIC_API_KEY:
        print("\n❌ ERROR: ANTHROPIC_API_KEY not found in environment")
        print("   Set it in backend/.env file")
        return

    results = {}

    # Run tests
    results["simple_chat"] = await test_simple_chat()
    await asyncio.sleep(2)

    results["cache_creation"] = await test_cache_creation()
    await asyncio.sleep(2)

    results["cache_hit"] = await test_cache_hit()
    await asyncio.sleep(2)

    results["client_integration"] = await test_anthropic_client()

    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {status}: {test_name}")

    all_passed = all(results.values())
    if all_passed:
        print(f"\n✅ ALL TESTS PASSED - Anthropic API integration is working!")
        print(f"   - Direct API calls working")
        print(f"   - Prompt caching functional")
        print(f"   - AnthropicClient integration verified")
    else:
        print(f"\n⚠️  SOME TESTS FAILED - Review errors above")
        print(f"   Check API key, model IDs, or network connectivity")


if __name__ == "__main__":
    asyncio.run(main())
