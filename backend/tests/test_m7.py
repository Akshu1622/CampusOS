def test_get_report_admin(client, admin_token):
    res = client.get("/api/v1/analytics/reports/RP-1", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert "data" in data
    assert "total" in data

def test_get_report_csv_export(client, admin_token):
    res = client.get("/api/v1/analytics/reports/RP-1?export_csv=true", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    assert res.headers["content-type"] == "text/csv; charset=utf-8"
    assert "attachment; filename=RP-1.csv" in res.headers["content-disposition"]

def test_get_report_sp_fee_collection(client, admin_token):
    res = client.get("/api/v1/analytics/reports/RP-4?defaulter_threshold=100.0", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert "data" in data

def test_get_report_invalid_key(client, admin_token):
    res = client.get("/api/v1/analytics/reports/RP-999", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 400

def test_get_report_faculty_forbidden(client, faculty_token):
    res = client.get("/api/v1/analytics/reports/RP-1", headers={"Authorization": f"Bearer {faculty_token}"})
    assert res.status_code == 403

def test_get_report_student_forbidden(client, student_token):
    res = client.get("/api/v1/analytics/reports/RP-1", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 403

def test_get_audit_logs(client, admin_token):
    res = client.get("/api/v1/analytics/audit-logs", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert "data" in data

def test_get_integrity_checks(client, admin_token):
    res = client.get("/api/v1/analytics/integrity/checks", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_admin_dashboard(client, admin_token):
    res = client.get("/api/v1/analytics/dashboard/admin", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert "total_students" in data

def test_faculty_dashboard(client, faculty_token):
    res = client.get("/api/v1/analytics/dashboard/faculty", headers={"Authorization": f"Bearer {faculty_token}"})
    assert res.status_code == 200
    data = res.json()
    assert "assigned_offerings" in data

def test_student_dashboard(client, student_token):
    res = client.get("/api/v1/analytics/dashboard/student", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 200
    data = res.json()
    assert "total_enrolled_courses" in data

def test_workflow_11_end_to_end(client, admin_token, faculty_token, student_token):
    # W-11: Generate reports, export data, and review audit logs.
    
    # 1. Admin views dashboard
    res = client.get("/api/v1/analytics/dashboard/admin", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    
    # 2. Admin views RP-1 report
    res = client.get("/api/v1/analytics/reports/RP-1", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    
    # 3. Admin exports RP-1 to CSV
    res = client.get("/api/v1/analytics/reports/RP-1?export_csv=true", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    
    # 4. Admin reviews audit logs
    res = client.get("/api/v1/analytics/audit-logs", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    
    # 5. Admin runs integrity checks
    res = client.get("/api/v1/analytics/integrity/checks", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    
    # 6. Faculty views their dashboard
    res = client.get("/api/v1/analytics/dashboard/faculty", headers={"Authorization": f"Bearer {faculty_token}"})
    assert res.status_code == 200
    
    # 7. Student views their dashboard
    res = client.get("/api/v1/analytics/dashboard/student", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 200
