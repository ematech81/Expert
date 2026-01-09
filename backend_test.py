#!/usr/bin/env python3
"""
ExpertBridge Backend API Testing Suite
Tests all major backend endpoints for the professional services marketplace
"""

import requests
import json
import time
import uuid
from datetime import datetime

# Configuration
BASE_URL = "https://profconnect-22.preview.emergentagent.com/api"
TIMEOUT = 30

class ExpertBridgeAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.session.timeout = TIMEOUT
        self.professional_token = None
        self.admin_token = None
        self.test_professional_id = None
        self.test_professional_email = None
        self.results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'details': details
        }
        self.results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def make_request(self, method, endpoint, data=None, headers=None, auth_token=None):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        
        # Set up headers
        req_headers = {'Content-Type': 'application/json'}
        if headers:
            req_headers.update(headers)
        if auth_token:
            req_headers['Authorization'] = f'Bearer {auth_token}'
            
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, headers=req_headers)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, headers=req_headers)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data, headers=req_headers)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, headers=req_headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            return None
    
    def test_root_endpoint(self):
        """Test GET / - Root endpoint"""
        print("\n=== Testing Root Endpoint ===")
        
        response = self.make_request('GET', '/')
        if not response:
            self.log_result("Root Endpoint", False, "Request failed")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if 'message' in data and 'categories' in data:
                    self.log_result("Root Endpoint", True, f"Root endpoint working. Message: {data['message']}")
                    return True
                else:
                    self.log_result("Root Endpoint", False, "Missing expected fields in response", data)
                    return False
            except json.JSONDecodeError:
                self.log_result("Root Endpoint", False, "Invalid JSON response", response.text)
                return False
        else:
            self.log_result("Root Endpoint", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_categories_endpoint(self):
        """Test GET /categories - Get all categories"""
        print("\n=== Testing Categories Endpoint ===")
        
        response = self.make_request('GET', '/categories')
        if not response:
            self.log_result("Categories Endpoint", False, "Request failed")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if 'categories' in data and isinstance(data['categories'], list):
                    categories_count = len(data['categories'])
                    self.log_result("Categories Endpoint", True, f"Categories endpoint working. Found {categories_count} categories")
                    return True
                else:
                    self.log_result("Categories Endpoint", False, "Missing or invalid categories field", data)
                    return False
            except json.JSONDecodeError:
                self.log_result("Categories Endpoint", False, "Invalid JSON response", response.text)
                return False
        else:
            self.log_result("Categories Endpoint", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_professional_registration(self):
        """Test POST /auth/register - Register new professional"""
        print("\n=== Testing Professional Registration ===")
        
        # Generate unique email for testing
        unique_id = str(uuid.uuid4())[:8]
        self.test_professional_email = f"testpro_{unique_id}@expertbridge.com"
        
        registration_data = {
            "fullName": "Dr. Sarah Johnson",
            "email": self.test_professional_email,
            "phone": "+1-555-0123",
            "password": "SecurePass123!",
            "category": "Psychologist",
            "subcategory": "Clinical Psychology",
            "bio": "Experienced clinical psychologist with over 10 years of practice specializing in cognitive behavioral therapy, anxiety disorders, and depression treatment. I provide compassionate, evidence-based care to help clients achieve their mental health goals and improve their overall well-being.",
            "experience": 10,
            "location": {
                "country": "Nigeria",
                "state": "Lagos",
                "city": "Lagos"
            },
            "serviceOptions": {
                "inPerson": True,
                "virtual": True,
                "serviceRadius": "state"
            },
            "languages": ["English", "Yoruba"],
            "socialLinks": {
                "linkedin": "https://linkedin.com/in/sarahjohnson",
                "website": "https://drsarahjohnson.com"
            }
        }
        
        response = self.make_request('POST', '/auth/register', registration_data)
        if not response:
            self.log_result("Professional Registration", False, "Request failed")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if 'token' in data and 'professional' in data:
                    self.professional_token = data['token']
                    self.test_professional_id = data['professional']['id']
                    self.log_result("Professional Registration", True, f"Registration successful. Professional ID: {self.test_professional_id}")
                    return True
                else:
                    self.log_result("Professional Registration", False, "Missing token or professional data", data)
                    return False
            except json.JSONDecodeError:
                self.log_result("Professional Registration", False, "Invalid JSON response", response.text)
                return False
        else:
            self.log_result("Professional Registration", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_professional_login(self):
        """Test POST /auth/login - Professional login"""
        print("\n=== Testing Professional Login ===")
        
        if not self.test_professional_email:
            self.log_result("Professional Login", False, "No test professional email available")
            return False
            
        login_data = {
            "email": self.test_professional_email,
            "password": "SecurePass123!"
        }
        
        response = self.make_request('POST', '/auth/login', login_data)
        if not response:
            self.log_result("Professional Login", False, "Request failed")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if 'token' in data and 'professional' in data:
                    self.professional_token = data['token']  # Update token
                    self.log_result("Professional Login", True, f"Login successful for {self.test_professional_email}")
                    return True
                else:
                    self.log_result("Professional Login", False, "Missing token or professional data", data)
                    return False
            except json.JSONDecodeError:
                self.log_result("Professional Login", False, "Invalid JSON response", response.text)
                return False
        else:
            self.log_result("Professional Login", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_admin_login(self):
        """Test POST /auth/admin/login - Admin login"""
        print("\n=== Testing Admin Login ===")
        
        admin_data = {
            "email": "admin@expertbridge.com",
            "password": "admin123"
        }
        
        response = self.make_request('POST', '/auth/admin/login', admin_data)
        if not response:
            self.log_result("Admin Login", False, "Request failed")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if 'token' in data and 'admin' in data:
                    self.admin_token = data['token']
                    self.log_result("Admin Login", True, f"Admin login successful. Admin: {data['admin']['fullName']}")
                    return True
                else:
                    self.log_result("Admin Login", False, "Missing token or admin data", data)
                    return False
            except json.JSONDecodeError:
                self.log_result("Admin Login", False, "Invalid JSON response", response.text)
                return False
        else:
            self.log_result("Admin Login", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_get_professionals(self):
        """Test GET /professionals - Get all approved professionals"""
        print("\n=== Testing Get Professionals ===")
        
        response = self.make_request('GET', '/professionals?limit=10')
        if not response:
            self.log_result("Get Professionals", False, "Request failed")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if 'professionals' in data and 'pagination' in data:
                    professionals_count = len(data['professionals'])
                    total = data['pagination']['total']
                    self.log_result("Get Professionals", True, f"Found {professionals_count} professionals (total: {total})")
                    return True
                else:
                    self.log_result("Get Professionals", False, "Missing professionals or pagination data", data)
                    return False
            except json.JSONDecodeError:
                self.log_result("Get Professionals", False, "Invalid JSON response", response.text)
                return False
        else:
            self.log_result("Get Professionals", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_search_professionals(self):
        """Test GET /search - Search professionals with filters"""
        print("\n=== Testing Search Professionals ===")
        
        # Test search with category and country filters
        search_params = "?category=Psychologist&country=Nigeria"
        response = self.make_request('GET', f'/search{search_params}')
        if not response:
            self.log_result("Search Professionals", False, "Request failed")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if 'professionals' in data and 'filters' in data and 'pagination' in data:
                    professionals_count = len(data['professionals'])
                    filters = data['filters']
                    self.log_result("Search Professionals", True, f"Search working. Found {professionals_count} professionals with filters: {filters}")
                    return True
                else:
                    self.log_result("Search Professionals", False, "Missing expected fields in search response", data)
                    return False
            except json.JSONDecodeError:
                self.log_result("Search Professionals", False, "Invalid JSON response", response.text)
                return False
        else:
            self.log_result("Search Professionals", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_admin_pending_approvals(self):
        """Test GET /admin/pending - Get pending approvals"""
        print("\n=== Testing Admin Pending Approvals ===")
        
        if not self.admin_token:
            self.log_result("Admin Pending Approvals", False, "No admin token available")
            return False
            
        response = self.make_request('GET', '/admin/pending', auth_token=self.admin_token)
        if not response:
            self.log_result("Admin Pending Approvals", False, "Request failed")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if 'pending' in data:
                    pending_count = len(data['pending'])
                    self.log_result("Admin Pending Approvals", True, f"Found {pending_count} pending approvals")
                    return True
                else:
                    self.log_result("Admin Pending Approvals", False, "Missing pending field", data)
                    return False
            except json.JSONDecodeError:
                self.log_result("Admin Pending Approvals", False, "Invalid JSON response", response.text)
                return False
        else:
            self.log_result("Admin Pending Approvals", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_admin_approve_professional(self):
        """Test PUT /admin/approve/{id} - Approve professional"""
        print("\n=== Testing Admin Approve Professional ===")
        
        if not self.admin_token:
            self.log_result("Admin Approve Professional", False, "No admin token available")
            return False
            
        if not self.test_professional_id:
            self.log_result("Admin Approve Professional", False, "No test professional ID available")
            return False
            
        response = self.make_request('PUT', f'/admin/approve/{self.test_professional_id}', auth_token=self.admin_token)
        if not response:
            self.log_result("Admin Approve Professional", False, "Request failed")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if 'message' in data:
                    self.log_result("Admin Approve Professional", True, f"Professional approved: {data['message']}")
                    return True
                else:
                    self.log_result("Admin Approve Professional", False, "Missing message field", data)
                    return False
            except json.JSONDecodeError:
                self.log_result("Admin Approve Professional", False, "Invalid JSON response", response.text)
                return False
        else:
            self.log_result("Admin Approve Professional", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_admin_stats(self):
        """Test GET /admin/stats - Get platform statistics"""
        print("\n=== Testing Admin Stats ===")
        
        if not self.admin_token:
            self.log_result("Admin Stats", False, "No admin token available")
            return False
            
        response = self.make_request('GET', '/admin/stats', auth_token=self.admin_token)
        if not response:
            self.log_result("Admin Stats", False, "Request failed")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if 'stats' in data and 'categoryBreakdown' in data:
                    stats = data['stats']
                    self.log_result("Admin Stats", True, f"Stats retrieved. Total professionals: {stats.get('totalProfessionals', 0)}")
                    return True
                else:
                    self.log_result("Admin Stats", False, "Missing stats or categoryBreakdown", data)
                    return False
            except json.JSONDecodeError:
                self.log_result("Admin Stats", False, "Invalid JSON response", response.text)
                return False
        else:
            self.log_result("Admin Stats", False, f"HTTP {response.status_code}", response.text)
            return False
    
    def test_professional_profile_view(self):
        """Test GET /professionals/{id} - View professional profile and track views"""
        print("\n=== Testing Professional Profile View ===")
        
        if not self.test_professional_id:
            self.log_result("Professional Profile View", False, "No test professional ID available")
            return False
            
        # Get initial view count
        response1 = self.make_request('GET', f'/professionals/{self.test_professional_id}')
        if not response1 or response1.status_code != 200:
            self.log_result("Professional Profile View", False, "Failed to get initial profile")
            return False
            
        try:
            data1 = response1.json()
            initial_views = data1['professional']['analytics']['profileViews']
        except (json.JSONDecodeError, KeyError):
            self.log_result("Professional Profile View", False, "Invalid initial profile response")
            return False
        
        # Wait a moment and view again
        time.sleep(1)
        response2 = self.make_request('GET', f'/professionals/{self.test_professional_id}')
        if not response2 or response2.status_code != 200:
            self.log_result("Professional Profile View", False, "Failed to get second profile view")
            return False
            
        try:
            data2 = response2.json()
            new_views = data2['professional']['analytics']['profileViews']
            
            if new_views > initial_views:
                self.log_result("Professional Profile View", True, f"View tracking working. Views: {initial_views} → {new_views}")
                return True
            else:
                self.log_result("Professional Profile View", False, f"View count not incremented. Views: {initial_views} → {new_views}")
                return False
        except (json.JSONDecodeError, KeyError):
            self.log_result("Professional Profile View", False, "Invalid second profile response")
            return False
    
    def test_error_cases(self):
        """Test various error cases"""
        print("\n=== Testing Error Cases ===")
        
        error_tests_passed = 0
        total_error_tests = 3
        
        # Test registration with missing fields
        response = self.make_request('POST', '/auth/register', {"email": "test@test.com"})
        if response and response.status_code == 400:
            self.log_result("Error Case - Missing Fields", True, "Correctly rejected registration with missing fields")
            error_tests_passed += 1
        else:
            self.log_result("Error Case - Missing Fields", False, f"Should reject registration with missing fields. Got status: {response.status_code if response else 'None'}")
        
        # Test login with invalid credentials
        response = self.make_request('POST', '/auth/login', {"email": "invalid@test.com", "password": "wrong"})
        if response and response.status_code == 401:
            self.log_result("Error Case - Invalid Login", True, "Correctly rejected invalid login")
            error_tests_passed += 1
        else:
            self.log_result("Error Case - Invalid Login", False, f"Should reject invalid login credentials. Got status: {response.status_code if response else 'None'}")
        
        # Test admin endpoint without token
        response = self.make_request('GET', '/admin/pending')
        if response and response.status_code == 401:
            self.log_result("Error Case - Unauthorized Admin", True, "Correctly rejected unauthorized admin access")
            error_tests_passed += 1
        else:
            self.log_result("Error Case - Unauthorized Admin", False, f"Should reject unauthorized admin access. Got status: {response.status_code if response else 'None'}")
        
        return error_tests_passed == total_error_tests
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting ExpertBridge Backend API Tests")
        print(f"Base URL: {self.base_url}")
        print("=" * 60)
        
        # Core API tests
        tests = [
            self.test_root_endpoint,
            self.test_categories_endpoint,
            self.test_professional_registration,
            self.test_professional_login,
            self.test_admin_login,
            self.test_get_professionals,
            self.test_search_professionals,
            self.test_admin_pending_approvals,
            self.test_admin_approve_professional,
            self.test_admin_stats,
            self.test_professional_profile_view,
            self.test_error_cases
        ]
        
        passed = 0
        failed = 0
        
        for test in tests:
            try:
                if test():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ FAIL: {test.__name__} - Exception: {e}")
                self.log_result(test.__name__, False, f"Exception: {e}")
                failed += 1
        
        # Print summary
        print("\n" + "=" * 60)
        print("🏁 TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📊 Total: {passed + failed}")
        print(f"📈 Success Rate: {(passed / (passed + failed) * 100):.1f}%")
        
        # Print detailed results
        print("\n📋 DETAILED RESULTS:")
        for result in self.results:
            status = "✅" if result['success'] else "❌"
            print(f"{status} {result['test']}: {result['message']}")
        
        return passed, failed

if __name__ == "__main__":
    tester = ExpertBridgeAPITester()
    passed, failed = tester.run_all_tests()
    
    # Exit with appropriate code
    exit(0 if failed == 0 else 1)