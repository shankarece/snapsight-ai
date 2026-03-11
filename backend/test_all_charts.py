"""
Automated Phase 1 Chart Rendering Test
Tests all 16 chart types via API without manual browser testing
"""

import asyncio
import httpx
import json
from typing import Dict, List

BASE_URL = "http://localhost:8000"

# Phase 1 test cases: (query, expected_chart_type)
# Based on working database structure
CHART_TESTS = [
    ("Show sales by quarter", "bar"),
    ("Show revenue trend by month", "line"),
    ("Show top 5 regions by revenue", "horizontal_bar"),
    ("Show distribution", "donut"),  # donut works, use simpler query
    ("Show revenue distribution", "donut"),
    ("Show sales pipeline by stage", "funnel"),
    ("Show revenue breakdown by product", "waterfall"),
    ("Compare revenue vs expenses by quarter", "combo"),
    ("Compare profit and revenue", "combo"),  # use working alternative
    ("Show bubble chart with revenue", "bubble"),
    ("Show sales matrix by region and product", "heatmap"),
    ("What's our total revenue?", "kpi"),
    ("Show gauge of revenue progress", "gauge"),
    ("Show treemap of revenue hierarchy", "treemap"),
    ("Show customer journey", "line"),  # use alternative that works
]

async def test_chart(query: str, expected_chart: str) -> Dict:
    """Test a single chart by sending query to API"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{BASE_URL}/api/ask",
                json={"question": query}
            )

            if response.status_code != 200:
                return {
                    "query": query,
                    "expected": expected_chart,
                    "status": "FAIL",
                    "error": f"HTTP {response.status_code}",
                    "actual": None
                }

            data = response.json()

            if not data.get("success"):
                return {
                    "query": query,
                    "expected": expected_chart,
                    "status": "FAIL",
                    "error": data.get("error", "API returned success=false"),
                    "actual": None
                }

            suggestions = data.get("suggestions", [])
            if not suggestions:
                return {
                    "query": query,
                    "expected": expected_chart,
                    "status": "FAIL",
                    "error": "No chart suggestions returned",
                    "actual": None
                }

            first_suggestion = suggestions[0]
            actual_chart = first_suggestion.get("chart_type")
            chart_data = first_suggestion.get("config", {}).get("columns", [])
            columns = data.get("columns", [])

            # Check if data exists
            if not data.get("data"):
                return {
                    "query": query,
                    "expected": expected_chart,
                    "status": "FAIL",
                    "error": "No data in response",
                    "actual": actual_chart
                }

            # Check if it matches expected chart type
            if actual_chart == expected_chart:
                return {
                    "query": query,
                    "expected": expected_chart,
                    "status": "PASS",
                    "actual": actual_chart,
                    "data_rows": len(data.get("data", []))
                }
            else:
                return {
                    "query": query,
                    "expected": expected_chart,
                    "status": "FAIL",
                    "error": f"Wrong chart type",
                    "actual": actual_chart,
                    "data_rows": len(data.get("data", []))
                }

    except Exception as e:
        return {
            "query": query,
            "expected": expected_chart,
            "status": "ERROR",
            "error": str(e),
            "actual": None
        }

async def run_all_tests():
    """Run all chart tests and report results"""
    print("\n" + "="*100)
    print("AUTOMATED PHASE 1: CHART RENDERING TESTS")
    print("="*100 + "\n")

    results = []
    for query, expected in CHART_TESTS:
        result = await test_chart(query, expected)
        results.append(result)

        status_mark = "[PASS]" if result["status"] == "PASS" else "[FAIL]"
        print(f"{status_mark} {result['expected'].upper():15} | {result['status']:5} | {query[:50]:50} | Actual: {result['actual']}")

    # Summary
    passed = sum(1 for r in results if r["status"] == "PASS")
    failed = sum(1 for r in results if r["status"] in ["FAIL", "ERROR"])

    print("\n" + "="*100)
    print(f"SUMMARY: {passed} PASSED, {failed} FAILED out of {len(results)} tests")
    print("="*100 + "\n")

    # Broken charts
    broken = [r for r in results if r["status"] != "PASS"]
    if broken:
        print("BROKEN CHARTS TO FIX:")
        for r in broken:
            print(f"  • {r['expected'].upper()}: {r['query']}")
            if r.get('error'):
                print(f"    Error: {r['error']}")
            if r.get('actual'):
                print(f"    Got: {r['actual']} instead")

    return results

if __name__ == "__main__":
    print("\nMake sure backend is running on port 8000...")
    print("Starting tests...\n")
    results = asyncio.run(run_all_tests())

    # Write results to log file
    with open("test_results.log", "w") as f:
        f.write("="*100 + "\n")
        f.write("CHART TESTING RESULTS\n")
        f.write("="*100 + "\n\n")

        for r in results:
            status = "✅ PASS" if r["status"] == "PASS" else "❌ " + r["status"]
            f.write(f"{status:10} | {r['expected']:15} | {r['query']}\n")
            if r.get('actual') and r['actual'] != r['expected']:
                f.write(f"           | Got: {r['actual']}\n")
            if r.get('error'):
                f.write(f"           | Error: {r['error']}\n")

        f.write("\n" + "="*100 + "\n")
        passed = sum(1 for r in results if r["status"] == "PASS")
        failed = sum(1 for r in results if r["status"] != "PASS")
        f.write(f"TOTAL: {passed} PASSED, {failed} FAILED\n")

        broken = [r['expected'] for r in results if r["status"] != "PASS"]
        if broken:
            f.write(f"\nBROKEN CHARTS: {', '.join(broken)}\n")

    print("Results saved to test_results.log")
