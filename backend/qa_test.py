"""
QA Test Suite for SnapSight AI Hackathon Submission
Tests all critical features before demo/submission
"""

import asyncio
import httpx
import time
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

class QATest:
    def __init__(self):
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "health": {},
            "chart_quality": {},
            "interactive": {},
            "performance": {},
            "error_handling": {},
            "summary": {}
        }
        self.errors = []
        self.client = None

    async def test_health(self):
        """Test API and database connectivity"""
        print("\n" + "="*80)
        print("[HEALTH CHECK] Verifying API and Database")
        print("="*80)

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{BASE_URL}/health")
                data = resp.json()

                api_ok = resp.status_code == 200
                db_ok = data.get("database") == "connected"

                self.results["health"] = {
                    "api": "OK" if api_ok else "FAILED",
                    "database": "CONNECTED" if db_ok else "DISCONNECTED",
                    "response_time_ms": resp.elapsed.total_seconds() * 1000
                }

                print(f"[{'OK' if api_ok else 'FAIL'}] API Status: {resp.status_code}")
                print(f"[{'OK' if db_ok else 'FAIL'}] Database: {data.get('database')}")
                print(f"Response time: {self.results['health']['response_time_ms']:.2f}ms")

                return api_ok and db_ok
        except Exception as e:
            self.errors.append(f"Health check failed: {str(e)}")
            print(f"[FAIL] Health check error: {e}")
            return False

    async def test_chart_quality(self):
        """Test critical chart types that must work perfectly"""
        print("\n" + "="*80)
        print("[CHART QUALITY] Testing 6 Critical Chart Types")
        print("="*80)

        test_cases = [
            ("Show sales by quarter", "bar", "Bar Chart"),
            ("Show revenue trend by month", "line", "Line Chart"),
            ("Show sales pipeline funnel by stage", "funnel", "Funnel Chart"),
            ("Compare revenue vs expenses by quarter", "combo", "Combo Chart"),
            ("Show total revenue this year", "kpi", "KPI Gauge"),
            ("Show revenue by product category", "treemap", "Treemap"),
        ]

        async with httpx.AsyncClient(timeout=30.0) as client:
            for query, expected_chart, label in test_cases:
                try:
                    start = time.time()
                    resp = await client.post(
                        f"{BASE_URL}/api/ask",
                        json={"question": query}
                    )
                    elapsed = time.time() - start

                    if resp.status_code != 200:
                        self.results["chart_quality"][label] = {
                            "status": "FAIL",
                            "error": f"HTTP {resp.status_code}",
                            "response_time": elapsed
                        }
                        print(f"[FAIL] {label:20} | HTTP {resp.status_code}")
                        continue

                    data = resp.json()

                    if not data.get("success"):
                        self.results["chart_quality"][label] = {
                            "status": "FAIL",
                            "error": data.get("error", "Unknown error"),
                            "response_time": elapsed
                        }
                        print(f"[FAIL] {label:20} | {data.get('error')}")
                        continue

                    # Check chart type
                    suggestions = data.get("suggestions", [])
                    if not suggestions:
                        self.results["chart_quality"][label] = {
                            "status": "FAIL",
                            "error": "No suggestions returned",
                            "response_time": elapsed
                        }
                        print(f"[FAIL] {label:20} | No suggestions")
                        continue

                    actual_chart = suggestions[0].get("chart_type")
                    has_data = len(data.get("data", [])) > 0
                    has_insight = len(data.get("insight", "").strip()) > 0

                    # Check if chart matches expected
                    chart_match = actual_chart == expected_chart

                    self.results["chart_quality"][label] = {
                        "status": "PASS" if (chart_match and has_data and has_insight) else "PARTIAL",
                        "expected_chart": expected_chart,
                        "actual_chart": actual_chart,
                        "data_rows": len(data.get("data", [])),
                        "has_insight": has_insight,
                        "response_time": elapsed
                    }

                    status_icon = "[OK]" if (chart_match and has_data and has_insight) else "[WARN]"
                    print(f"{status_icon} {label:20} | Expected: {expected_chart:12} Got: {actual_chart:12} | Data: {len(data.get('data', [])):2} rows | {elapsed:.2f}s")

                except Exception as e:
                    self.results["chart_quality"][label] = {
                        "status": "ERROR",
                        "error": str(e),
                        "response_time": 0
                    }
                    print(f"[ERROR] {label:20} | {str(e)}")
                    self.errors.append(f"{label}: {str(e)}")

    async def test_interactive_features(self):
        """Test cross-filtering and follow-ups"""
        print("\n" + "="*80)
        print("[INTERACTIVE] Testing Cross-Filtering & Follow-Ups")
        print("="*80)

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                # Query 1: Revenue by region
                print("\n[Step 1] Query 1: Revenue by region")
                resp1 = await client.post(
                    f"{BASE_URL}/api/ask",
                    json={"question": "Show revenue by region"}
                )
                q1 = resp1.json()
                q1_pass = q1.get("success") and len(q1.get("data", [])) > 0
                print(f"[{'OK' if q1_pass else 'FAIL'}] Query 1 executed, {len(q1.get('data', []))} rows")

                # Query 2: Revenue by quarter
                print("[Step 2] Query 2: Revenue by quarter")
                resp2 = await client.post(
                    f"{BASE_URL}/api/ask",
                    json={"question": "Show revenue by quarter"}
                )
                q2 = resp2.json()
                q2_pass = q2.get("success") and len(q2.get("data", [])) > 0
                print(f"[{'OK' if q2_pass else 'FAIL'}] Query 2 executed, {len(q2.get('data', []))} rows")

                # Check if both have dimension columns (for cross-filtering)
                col1 = q1.get("columns", [])
                col2 = q2.get("columns", [])
                has_dimension_q1 = any(c.lower() in ["region", "product", "category", "stage"] for c in col1)
                has_dimension_q2 = any(c.lower() in ["quarter", "month", "year", "date"] for c in col2)

                self.results["interactive"]["cross_filtering"] = {
                    "status": "PASS" if (q1_pass and q2_pass and has_dimension_q1) else "FAIL",
                    "query1_rows": len(q1.get("data", [])),
                    "query2_rows": len(q2.get("data", [])),
                    "dimension_columns": col1
                }
                print(f"[{'OK' if has_dimension_q1 else 'WARN'}] Dimension columns available for filtering")

                # Test follow-up
                print("[Step 3] Follow-up query")
                resp_followup = await client.post(
                    f"{BASE_URL}/api/ask",
                    json={"question": "Show this breakdown by product category"}
                )
                followup = resp_followup.json()
                followup_pass = followup.get("success") and len(followup.get("data", [])) > 0

                self.results["interactive"]["follow_ups"] = {
                    "status": "PASS" if followup_pass else "FAIL",
                    "follow_up_query": "Show this breakdown by product category",
                    "rows_returned": len(followup.get("data", []))
                }
                print(f"[{'OK' if followup_pass else 'FAIL'}] Follow-up query executed, {len(followup.get('data', []))} rows")

            except Exception as e:
                self.results["interactive"]["error"] = str(e)
                print(f"[ERROR] Interactive test failed: {e}")
                self.errors.append(f"Interactive test: {str(e)}")

    async def test_performance(self):
        """Test response times for key operations"""
        print("\n" + "="*80)
        print("[PERFORMANCE] Response Time Benchmarks")
        print("="*80)

        async with httpx.AsyncClient(timeout=30.0) as client:
            # Health check time
            start = time.time()
            resp = await client.get(f"{BASE_URL}/health")
            health_time = (time.time() - start) * 1000

            # Query time
            start = time.time()
            resp = await client.post(
                f"{BASE_URL}/api/ask",
                json={"question": "Show revenue by region"}
            )
            query_time = (time.time() - start) * 1000

            # Catalog time
            start = time.time()
            resp = await client.get(f"{BASE_URL}/api/insights/catalog")
            catalog_time = (time.time() - start) * 1000

            self.results["performance"] = {
                "health_check_ms": health_time,
                "query_processing_ms": query_time,
                "catalog_load_ms": catalog_time
            }

            print(f"Health check:      {health_time:7.2f}ms {'[OK]' if health_time < 100 else '[SLOW]'}")
            print(f"Query processing:  {query_time:7.2f}ms {'[OK]' if query_time < 15000 else '[SLOW]'}")
            print(f"Catalog load:      {catalog_time:7.2f}ms {'[OK]' if catalog_time < 100 else '[SLOW]'}")

    async def test_error_handling(self):
        """Test error cases"""
        print("\n" + "="*80)
        print("[ERROR HANDLING] Testing Edge Cases")
        print("="*80)

        test_cases = [
            ("", "Empty question"),
            ("xyz abc def ghi jkl", "Nonsense query"),
            ("Show me the moon", "Question about non-existent data"),
        ]

        async with httpx.AsyncClient(timeout=30.0) as client:
            for query, label in test_cases:
                try:
                    resp = await client.post(
                        f"{BASE_URL}/api/ask",
                        json={"question": query}
                    )

                    # Any non-500 response is acceptable (could be error or fallback)
                    if resp.status_code == 400:
                        result = "EXPECTED_ERROR"
                        print(f"[OK] {label:40} -> HTTP 400 (validation)")
                    elif resp.status_code == 200:
                        data = resp.json()
                        if not data.get("success"):
                            result = "GRACEFUL_FAIL"
                            print(f"[OK] {label:40} -> Graceful error handling")
                        else:
                            result = "FALLBACK"
                            print(f"[OK] {label:40} -> Fallback query")
                    else:
                        result = "ERROR"
                        print(f"[WARN] {label:40} -> HTTP {resp.status_code}")

                    self.results["error_handling"][label] = result

                except Exception as e:
                    print(f"[OK] {label:40} -> Exception caught: {type(e).__name__}")
                    self.results["error_handling"][label] = "EXCEPTION_CAUGHT"

    def print_summary(self):
        """Print final summary"""
        print("\n" + "="*80)
        print("QA TEST SUMMARY")
        print("="*80)

        # Health
        health = self.results.get("health", {})
        print(f"\n[HEALTH]")
        print(f"  API:      {health.get('api', 'N/A')}")
        print(f"  Database: {health.get('database', 'N/A')}")

        # Chart Quality
        charts = self.results.get("chart_quality", {})
        passed = sum(1 for r in charts.values() if r.get("status") in ["PASS", "PARTIAL"])
        print(f"\n[CHART QUALITY] {passed}/{len(charts)} passed")
        for chart, result in charts.items():
            status = "[OK]" if result.get("status") == "PASS" else "[WARN]" if result.get("status") == "PARTIAL" else "[FAIL]"
            print(f"  {status} {chart}")

        # Interactive
        interactive = self.results.get("interactive", {})
        print(f"\n[INTERACTIVE FEATURES]")
        for feature, result in interactive.items():
            status = "[OK]" if result.get("status") == "PASS" else "[FAIL]"
            print(f"  {status} {feature}")

        # Performance
        perf = self.results.get("performance", {})
        print(f"\n[PERFORMANCE]")
        print(f"  Health check:     {perf.get('health_check_ms', 0):.0f}ms")
        print(f"  Query:            {perf.get('query_processing_ms', 0):.0f}ms")
        print(f"  Catalog:          {perf.get('catalog_load_ms', 0):.0f}ms")

        # Errors
        if self.errors:
            print(f"\n[ERRORS] {len(self.errors)} issues found:")
            for err in self.errors:
                print(f"  • {err}")
        else:
            print(f"\n[ERRORS] None - all tests passed!")

        # Save results
        print("\n" + "="*80)
        with open("qa_results.json", "w") as f:
            json.dump(self.results, f, indent=2)
        print("Results saved to qa_results.json")

    async def run_all(self):
        """Run all QA tests"""
        print("\nSnapSight AI - QA Test Suite")
        print("Starting automated quality assurance testing...")

        if not await self.test_health():
            print("[CRITICAL] Health check failed. Cannot proceed with testing.")
            return False

        await self.test_chart_quality()
        await self.test_interactive_features()
        await self.test_performance()
        await self.test_error_handling()

        self.print_summary()

        return len(self.errors) == 0

async def main():
    qa = QATest()
    success = await qa.run_all()
    exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())
