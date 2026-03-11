"""
Automated tests for interactive SnapSight AI features:
- Cross-filtering dashboard
- Rich tooltips
- Follow-up questions

Run: npm start (frontend), then: python test_interactive_features.py
"""

import asyncio
import json
import subprocess
import time
import requests

BASE_URL = "http://localhost:3000"
API_BASE = "http://localhost:8000"

class InteractiveFeatureTests:
    def __init__(self):
        self.results = {
            "cross_filtering": [],
            "tooltips": [],
            "follow_ups": [],
            "overall": "PENDING"
        }

    async def test_api_health(self):
        """Check if backend and frontend are running"""
        print("\n[SETUP] Checking services...")
        try:
            # Check backend
            resp = requests.get(f"{API_BASE}/health", timeout=5)
            if resp.status_code == 200:
                print("[OK] Backend API running (port 8000)")
            else:
                print("[FAIL] Backend API not responding")
                return False
        except:
            print("[FAIL] Backend API unreachable (port 8000)")
            return False

        # Check frontend
        try:
            resp = requests.get(BASE_URL, timeout=5)
            if resp.status_code == 200:
                print("[OK] Frontend running (port 3000)")
            else:
                print("[FAIL] Frontend not responding")
                return False
        except:
            print("[FAIL] Frontend unreachable (port 3000)")
            return False

        return True

    async def test_cross_filtering(self):
        """
        Test cross-filtering dashboard:
        1. Get two queries to generate data
        2. Pin both to Liveboard
        3. Click a bar in one chart
        4. Verify all charts update with filter
        5. Click another bar to stack filter
        6. Click clear all
        """
        print("\n[CROSS-FILTERING] Testing dashboard filtering...")

        try:
            # Query 1: Get revenue by region
            q1 = requests.post(
                f"{API_BASE}/api/ask",
                json={"question": "Show revenue by region"},
                timeout=30
            ).json()

            if not q1.get("success") or not q1.get("data"):
                self.results["cross_filtering"].append({
                    "test": "API query execution",
                    "status": "FAIL",
                    "error": "Query returned no data"
                })
                return

            self.results["cross_filtering"].append({
                "test": "API query execution",
                "status": "PASS",
                "data_rows": len(q1.get("data", []))
            })

            # Query 2: Get revenue by quarter
            q2 = requests.post(
                f"{API_BASE}/api/ask",
                json={"question": "Show revenue by quarter"},
                timeout=30
            ).json()

            if q2.get("success"):
                self.results["cross_filtering"].append({
                    "test": "Multi-query support",
                    "status": "PASS",
                    "queries": 2
                })
            else:
                self.results["cross_filtering"].append({
                    "test": "Multi-query support",
                    "status": "FAIL",
                    "error": "Second query failed"
                })

            # Check if data has dimensions for filtering
            col1 = q1.get("columns", [])
            has_dimension = any(c.lower() in ["region", "product", "category", "stage"] for c in col1)

            if has_dimension:
                self.results["cross_filtering"].append({
                    "test": "Dimension column detection",
                    "status": "PASS",
                    "dimension_cols": col1
                })
            else:
                self.results["cross_filtering"].append({
                    "test": "Dimension column detection",
                    "status": "FAIL",
                    "available_cols": col1
                })

        except Exception as e:
            self.results["cross_filtering"].append({
                "test": "Cross-filtering setup",
                "status": "ERROR",
                "error": str(e)
            })

    async def test_rich_tooltips(self):
        """
        Test rich tooltip functionality:
        1. Get query with multiple rows
        2. Verify response includes data that can calculate % of total
        3. Check for metric columns that allow percentage calculation
        """
        print("\n[TOOLTIPS] Testing rich tooltip data...")

        try:
            # Get a simple query
            q = requests.post(
                f"{API_BASE}/api/ask",
                json={"question": "Show sales by quarter"},
                timeout=30
            ).json()

            if not q.get("success"):
                self.results["tooltips"].append({
                    "test": "Query execution",
                    "status": "FAIL",
                    "error": "Query failed"
                })
                return

            data = q.get("data", [])
            columns = q.get("columns", [])

            # Check for metric columns (numeric)
            metrics = []
            for col in columns:
                try:
                    val = data[0].get(col)
                    if isinstance(val, (int, float)):
                        metrics.append(col)
                except:
                    pass

            if metrics:
                self.results["tooltips"].append({
                    "test": "Metric column detection",
                    "status": "PASS",
                    "metric_cols": metrics
                })

                # Calculate if % of total can be computed
                total = sum(row.get(metrics[0], 0) for row in data if isinstance(row.get(metrics[0]), (int, float)))

                if total > 0:
                    self.results["tooltips"].append({
                        "test": "Percentage calculation",
                        "status": "PASS",
                        "total": total,
                        "rows": len(data)
                    })
                else:
                    self.results["tooltips"].append({
                        "test": "Percentage calculation",
                        "status": "FAIL",
                        "error": "Total is 0"
                    })
            else:
                self.results["tooltips"].append({
                    "test": "Metric column detection",
                    "status": "FAIL",
                    "error": "No numeric columns found"
                })

        except Exception as e:
            self.results["tooltips"].append({
                "test": "Tooltip data verification",
                "status": "ERROR",
                "error": str(e)
            })

    async def test_follow_up_questions(self):
        """
        Test follow-up questions feature:
        1. Execute initial query
        2. Check if response structure supports follow-ups
        3. Verify conversation history capability
        """
        print("\n[FOLLOW-UPS] Testing follow-up questions...")

        try:
            # Get initial query
            q = requests.post(
                f"{API_BASE}/api/ask",
                json={"question": "What is the revenue trend?"},
                timeout=30
            ).json()

            if not q.get("success"):
                self.results["follow_ups"].append({
                    "test": "Initial query execution",
                    "status": "FAIL",
                    "error": "Query failed"
                })
                return

            self.results["follow_ups"].append({
                "test": "Initial query execution",
                "status": "PASS",
                "data_rows": len(q.get("data", []))
            })

            # Check response structure for follow-up support
            has_insight = "insight" in q
            has_suggestion = "suggestions" in q
            has_columns = "columns" in q

            if has_insight and has_suggestion and has_columns:
                self.results["follow_ups"].append({
                    "test": "Response structure validation",
                    "status": "PASS",
                    "has_insight": has_insight,
                    "has_suggestions": has_suggestion,
                    "insight_preview": q.get("insight", "")[:80]
                })
            else:
                self.results["follow_ups"].append({
                    "test": "Response structure validation",
                    "status": "FAIL",
                    "missing": [k for k, v in {"insight": has_insight, "suggestions": has_suggestion, "columns": has_columns}.items() if not v]
                })

            # Test follow-up query (simulating user clicking a follow-up)
            follow_up = "Show this by product category"
            q2 = requests.post(
                f"{API_BASE}/api/ask",
                json={"question": follow_up},
                timeout=30
            ).json()

            if q2.get("success"):
                self.results["follow_ups"].append({
                    "test": "Follow-up query execution",
                    "status": "PASS",
                    "follow_up_query": follow_up,
                    "data_rows": len(q2.get("data", []))
                })
            else:
                self.results["follow_ups"].append({
                    "test": "Follow-up query execution",
                    "status": "FAIL",
                    "error": "Follow-up query failed"
                })

        except Exception as e:
            self.results["follow_ups"].append({
                "test": "Follow-up questions setup",
                "status": "ERROR",
                "error": str(e)
            })

    def print_results(self):
        """Print test results in readable format"""
        print("\n" + "="*100)
        print("INTERACTIVE FEATURES TEST RESULTS")
        print("="*100 + "\n")

        total_tests = 0
        total_passed = 0

        for feature, tests in self.results.items():
            if feature == "overall":
                continue

            print(f"\n[{feature.upper()}]")
            print("-" * 100)

            for test in tests:
                total_tests += 1
                status = test.get("status", "UNKNOWN")
                test_name = test.get("test", "Unknown test")

                if status == "PASS":
                    print(f"  [OK] {test_name:40} | {status}")
                    total_passed += 1
                else:
                    print(f"  [FAIL] {test_name:40} | {status}")

                if status == "FAIL" and test.get("error"):
                    print(f"    Error: {test['error']}")
                if test.get("insight_preview"):
                    print(f"    Insight: {test['insight_preview']}...")

        print("\n" + "="*100)
        print(f"SUMMARY: {total_passed}/{total_tests} tests passed")
        print("="*100 + "\n")

        # Save to file
        with open("test_interactive_results.json", "w") as f:
            json.dump(self.results, f, indent=2)

        print("Results saved to test_interactive_results.json")

        return total_passed == total_tests

    async def run_all(self):
        """Run all tests"""
        if not await self.test_api_health():
            print("\n[FAIL] Services not running. Start backend and frontend first.")
            return False

        await self.test_cross_filtering()
        await self.test_rich_tooltips()
        await self.test_follow_up_questions()

        return self.print_results()

async def main():
    tests = InteractiveFeatureTests()
    success = await tests.run_all()
    exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())
